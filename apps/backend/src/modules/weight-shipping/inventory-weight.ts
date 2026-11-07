type InventoryLink = {
  required_quantity?: number | null
  inventory?: { weight?: number | null } | null
}

// A kit may consume several inventory items per sold variant. Every component
// must have a valid weight; never silently quote only part of a physical kit.
export function inventoryWeight(links: (InventoryLink | null)[] | null | undefined): number | null {
  if (!links?.length) return null
  let total = 0
  for (const link of links) {
    if (!link) return null
    const weight = Number(link.inventory?.weight)
    const quantity = Number(link.required_quantity)
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) return null
    total += weight * quantity
  }
  return Number.isFinite(total) ? total : null
}
