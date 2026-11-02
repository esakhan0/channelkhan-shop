import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

// Repair only the default local upload URLs. Keep image IDs and gallery order.
export default async function fixLocalProductImageUrls({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const backendUrl = process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "")
  if (!backendUrl) {
    logger.info("Skipping local image URL repair: no public backend URL configured.")
    return
  }

  const target = new URL(backendUrl)
  if (["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) return
  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("MEDUSA_BACKEND_URL must be an HTTP or HTTPS URL")
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const repair = (url: string) => url.replace(
    /^http:\/\/(?:localhost|127\.0\.0\.1):9000\/static\//,
    `${backendUrl}/static/`
  )
  let updated = 0
  const take = 100

  for (let skip = 0; ; skip += take) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "thumbnail", "images.id", "images.url", "images.rank"],
      pagination: { skip, take, order: { id: "ASC" } },
    })

    for (const product of products) {
      const thumbnail = product.thumbnail ? repair(product.thumbnail) : product.thumbnail
      const originalImages = [...(product.images || [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      const images = originalImages.map(image => ({ id: image.id, url: repair(image.url) }))
      const changedImages = images.some((image, i) => image.url !== originalImages[i].url)
      if (thumbnail === product.thumbnail && !changedImages) continue

      await updateProductsWorkflow(container).run({
        input: {
          products: [{
            id: product.id,
            ...(thumbnail !== product.thumbnail ? { thumbnail } : {}),
            ...(changedImages ? { images } : {}),
          }],
        },
      })
      updated++
    }
    if (products.length < take) break
  }

  logger.info(`Repaired local image URLs on ${updated} products.`)
}
