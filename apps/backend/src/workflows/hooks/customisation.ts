import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  createCartWorkflow,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { checkCustomisation } from "../../lib/customisation"

type Line = {
  variant_id?: string | null
  metadata?: Record<string, unknown> | null
}

type ProductSummary = {
  title?: string | null
  metadata?: Record<string, unknown> | null
}

// A fault inside this check must never stop the shop selling. When a lookup
// fails for a reason of its own, the item is let through and the fault logged.
// Only a real problem with a buyer's text turns an item away.
function skipCheck(container: MedusaContainer, error: unknown) {
  const reason = error instanceof Error ? error.message : String(error)
  container.resolve(ContainerRegistrationKeys.LOGGER).error(`Customer text check skipped: ${reason}`)
}

// Checks the buyer's text for each line against its product's setting. The
// setting is read from the database here, never taken from the request.
async function assertCustomisation(lines: Line[], container: MedusaContainer) {
  const variantIds = [...new Set(lines.map((line) => line.variant_id).filter((id): id is string => !!id))]
  if (!variantIds.length) return

  let products: Map<string, ProductSummary | null | undefined>
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: variants } = await query.graph({
      entity: "variant",
      filters: { id: variantIds },
      fields: ["id", "product.title", "product.metadata"],
    })
    products = new Map(
      variants.map((variant) => [variant.id, variant.product as ProductSummary | null | undefined])
    )
  } catch (error) {
    skipCheck(container, error)
    return
  }

  for (const line of lines) {
    if (!line.variant_id) continue
    const product = products.get(line.variant_id)
    const problem = checkCustomisation(product?.metadata, line.metadata, product?.title ?? undefined)
    if (problem) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, problem)
    }
  }
}

// Every route that puts an item in a cart ends in one of these two workflows:
// the shop's own pages, the quick-buy links and the agent checkout API alike.
addToCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  await assertCustomisation((input.items ?? []) as Line[], container)
})

createCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  await assertCustomisation((input.items ?? []) as Line[], container)
})

// Changing a quantity leaves the text alone. Only when a request replaces the
// line's metadata does the new text need checking.
updateLineItemInCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const metadata = input.update?.metadata
  if (metadata === undefined) return

  let variantId: string | null | undefined
  try {
    const cartModule = container.resolve(Modules.CART)
    const line = await cartModule.retrieveLineItem(input.item_id, { select: ["id", "variant_id"] })
    variantId = line.variant_id
  } catch (error) {
    skipCheck(container, error)
    return
  }

  await assertCustomisation([{ variant_id: variantId, metadata }], container)
})
