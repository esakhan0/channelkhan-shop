import { coloursOf, isColourOption, type ColourFamily } from "@lib/util/colour-swatch"

/** A colour family and every option facet value that belongs to it. */
export type ChipFamily = ColourFamily & { values: string[] }

/** Splits a facet value such as `Colour:Black / Green` into its option title and value. */
export const parseOptionValue = (facetValue: string) => {
  const separator = facetValue.indexOf(":")

  return separator < 1
    ? null
    : { title: facetValue.slice(0, separator), value: facetValue.slice(separator + 1) }
}

export const isColourValue = (facetValue: string) =>
  isColourOption(parseOptionValue(facetValue)?.title)

export const sameValues = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value) => right.includes(value))

/**
 * Groups the option facet's values into colour families: "Black" collects
 * "Colour:Black", "Colour:Black / Green", "Colour combination:Black casing / Red
 * wheel" and so on. A value naming two colours belongs to both families.
 */
export const groupColourFamilies = (facetValues: string[]): ChipFamily[] => {
  const grouped = new Map<string, ChipFamily>()

  for (const facetValue of facetValues) {
    const parsed = parseOptionValue(facetValue)

    if (!parsed || !isColourOption(parsed.title)) {
      continue
    }

    for (const family of coloursOf(parsed.value)) {
      const existing = grouped.get(family.key)

      if (existing) {
        existing.values.push(facetValue)
      } else {
        grouped.set(family.key, { ...family, values: [facetValue] })
      }
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.label.localeCompare(b.label))
}
