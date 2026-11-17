import Image from "next/image"

/**
 * The shop's logo: the printer mascot on a pastel badge, next to the name set
 * in the heading font. Being type and one small image, it stays sharp at any
 * size and takes its colours from the theme.
 *
 * Sizes scale with the font size of `.mk-logo`; see styles/minimal.css.
 */
export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`mk-logo ${className}`.trim()}>
      <span className="mk-logo-mark" aria-hidden="true">
        <Image src="/brand/mukkys-icon.png" alt="" width={512} height={512} sizes="72px" priority />
      </span>
      <span className="mk-logo-word">
        Mukky’s<span className="mk-logo-tag">3D</span>
      </span>
    </span>
  )
}
