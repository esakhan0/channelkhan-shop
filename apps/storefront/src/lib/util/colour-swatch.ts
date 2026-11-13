/**
 * Reads colour families out of product option values such as "Coral Palette",
 * "Black / Green" or "Black casing / Red wheel". The shop's colour chips and the
 * swatch dots on option buttons both use it, so a value is grouped and drawn
 * the same way everywhere.
 */

export type ColourFamily = {
  /** Lower-case key the family is grouped by, e.g. "black". */
  key: string
  /** What shoppers read on a chip, e.g. "Black". */
  label: string
  /** CSS background for a swatch; a gradient for gradient filaments. */
  fill: string
  /** A flat stand-in for `fill`, used when two colours share one swatch. */
  solid: string
}

type Swatch = { fill?: string; solid: string }

// Filament colours rather than interface colours: they only ever fill small swatches.
const KNOWN_COLOURS: Record<string, Swatch> = {
  black: { solid: "#1f1e1b" },
  white: { solid: "#ffffff" },
  grey: { solid: "#9b9a97" },
  silver: { solid: "#c4c6c8" },
  red: { solid: "#d6362b" },
  orange: { solid: "#f28a2e" },
  yellow: { solid: "#f4d34c" },
  gold: { solid: "#d9a73a" },
  green: { solid: "#55b866" },
  mint: { solid: "#b2d1a0" },
  teal: { solid: "#27818f" },
  turquoise: { solid: "#2bb3b1" },
  blue: { solid: "#3b6fd4" },
  navy: { solid: "#1f2d5a" },
  purple: { solid: "#7a4bc4" },
  violet: { solid: "#5d5c97" },
  lilac: { solid: "#c9b6ee" },
  pink: { solid: "#ff7ab8" },
  brown: { solid: "#7a5236" },
  cream: { solid: "#eadfc8" },
  // Gradient filaments, sampled from the shop's own palette guides.
  coral: {
    solid: "#c9617f",
    fill: "linear-gradient(135deg, #e8be5f 0%, #c9617f 50%, #5d5c97 100%)",
  },
  forest: {
    solid: "#3f9a4f",
    fill: "linear-gradient(135deg, #bfc23a 0%, #3f9a4f 50%, #27818f 100%)",
  },
}

const ALIASES: Record<string, string> = { gray: "grey", beige: "cream" }

const UNKNOWN_SOLID = "#d9d4c8"

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/** Options titled "Colour", "Color", "Colour combination" and so on. */
export const isColourOption = (title?: string | null) => /colou?r/i.test(title ?? "")

/**
 * The colour a single part of a value names. A known colour word wins wherever
 * it sits ("Green wheel"); otherwise the first word stands in ("Galaxy Palette"),
 * so new filaments still get a chip without being listed here.
 */
const familyOfPart = (part: string): ColourFamily | null => {
  const words = (part.toLowerCase().match(/[a-z]+/g) ?? []).map((word) => ALIASES[word] ?? word)

  if (!words.length) {
    return null
  }

  const key = words.find((word) => word in KNOWN_COLOURS) ?? words[0]
  const swatch = KNOWN_COLOURS[key]

  return {
    key,
    label: capitalise(key),
    fill: swatch?.fill ?? swatch?.solid ?? UNKNOWN_SOLID,
    solid: swatch?.solid ?? UNKNOWN_SOLID,
  }
}

/** Every colour family a value names, in reading order and without repeats. */
export const coloursOf = (value: string): ColourFamily[] => {
  const families = new Map<string, ColourFamily>()

  for (const part of value.split("/")) {
    const family = familyOfPart(part)

    if (family && !families.has(family.key)) {
      families.set(family.key, family)
    }
  }

  return Array.from(families.values())
}

/** CSS background for a value's swatch: one colour, or two side by side. */
export const swatchFill = (value: string): string => {
  const [first, second] = coloursOf(value)

  if (!first) {
    return UNKNOWN_SOLID
  }

  if (!second) {
    return first.fill
  }

  return `linear-gradient(90deg, ${first.solid} 0 50%, ${second.solid} 50% 100%)`
}
