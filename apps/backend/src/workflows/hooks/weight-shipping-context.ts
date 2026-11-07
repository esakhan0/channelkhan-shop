import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { calculateShippingOptionsPricesWorkflow, listShippingOptionsForCartWithPricingWorkflow } from "@medusajs/medusa/core-flows"
import { inventoryWeight } from "../../modules/weight-shipping/inventory-weight"

// Load from persisted cart relationships, never from shipping-option request data.
async function shippingContext(cartId: string, container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    filters: { id: cartId },
    fields: ["id", "items.variant.id", "items.variant.inventory_items.required_quantity",
      "items.variant.inventory_items.inventory.weight"],
  })
  const weights: Record<string, number | null> = {}
  for (const item of carts[0]?.items || []) {
    if (item?.variant?.id) {
      weights[item.variant.id] = inventoryWeight(item.variant.inventory_items)
    }
  }
  return new StepResponse({ inventory_shipping_weights: weights })
}

calculateShippingOptionsPricesWorkflow.hooks.setCalculatedShippingPricingContext(
  async ({ input }, { container }) => shippingContext(input.cart_id, container)
)

// Selecting delivery and refreshing a cart use this workflow, rather than the
// standalone quote workflow above. Keep the source of weight consistent in both.
listShippingOptionsForCartWithPricingWorkflow.hooks.setCalculatedShippingPricingContext(
  async ({ input }, { container }) => shippingContext(input.cart_id, container)
)
