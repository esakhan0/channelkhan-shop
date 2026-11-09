import type { HttpTypes } from "@medusajs/types"
import Image from "next/image"

export default function GradientPaletteGuide({ product }: { product: HttpTypes.StoreProduct }) {
  const colourNames = [
    ...(product.options ?? []).flatMap((option) => (option.values ?? []).map((value) => value.value)),
    ...(product.variants ?? []).flatMap((variant) => [variant.title, ...(variant.options ?? []).map((option) => option.value)]),
  ]
  const palettes = [
    { key: "coral", title: "Coral Palette", colours: "Pink, peach and orange tones" },
    { key: "forest", title: "Forest Palette", colours: "Sage, olive, lime green and silvery grey tones" },
  ].filter((palette) => colourNames.some((name) =>
    new RegExp(`\\b${palette.key}\\b`, "i").test(name ?? "") && /\b(palette|pallete|gradient)\b/i.test(name ?? "")
  ))

  if (!palettes.length) return null

  return (
    <section aria-label="Gradient colour guide" className="mt-2 rounded-xl border border-[#ddd7cb] bg-[#faf5e7] p-4">
      <h2 className="text-lg font-semibold mb-2">Every gradient is different</h2>
      <p className="text-sm leading-6 text-ui-fg-subtle">
        Coral Palette and Forest Palette are colour ranges, not exact colour combinations.
        Shades, proportions and their placement vary depending on which section of the filament reel is used.
        Your fidget may be mostly one shade and may not include every colour shown, so it won&apos;t exactly match the photos.
        This applies to gradient parts only; solid-colour parts keep their chosen colour.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
      {palettes.map((palette) => <figure key={palette.key}>
        <a href={`/images/${palette.key}-palette-guide.webp`} target="_blank" rel="noopener noreferrer" aria-label={`Open a larger ${palette.title} guide in a new tab`}>
          <Image
            src={`/images/${palette.key}-palette-guide.webp`}
            alt={`${palette.title}: ${palette.colours}. Colour examples only; shades and placement vary with the reel.`}
            width={1400}
            height={1400}
            sizes="(max-width: 600px) 45vw, 230px"
            className="w-full h-auto rounded-lg"
          />
        </a>
        <figcaption className="mt-2 text-xs leading-5 text-ui-fg-subtle">
          {palette.title}
        </figcaption>
      </figure>)}
      </div>
      <p className="mt-2 text-xs leading-5 text-ui-fg-subtle">Colour examples only, based on our filament photos. Screen colours can vary. Tap a guide to enlarge.</p>
    </section>
  )
}
