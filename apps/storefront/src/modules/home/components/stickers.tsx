/**
 * Small flat shapes that sit around the home page headline, like stickers on
 * paper. They take their colours from the active pastel palette, so they change
 * with it. Purely decorative: hidden from assistive technology.
 */

type StickerProps = { className?: string }

const frame = {
  "aria-hidden": true,
  focusable: false,
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
} as const

const outline = {
  stroke: "var(--ink)",
  strokeWidth: 3,
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const

/** Four-point sparkle, like the ones around the shop's lettering. */
export const SparkleSticker = ({ className }: StickerProps) => (
  <svg {...frame} className={className} viewBox="0 0 64 64">
    <path
      {...outline}
      fill="var(--pastel-3)"
      d="M32 4c2 16 12 26 28 28-16 2-26 12-28 28-2-16-12-26-28-28 16-2 26-12 28-28z"
    />
  </svg>
)

/** A loose squiggle. */
export const SquiggleSticker = ({ className }: StickerProps) => (
  <svg {...frame} className={className} viewBox="0 0 120 48">
    <path
      d="M6 30c10-22 22-22 30 0s20 22 30 0 20-22 30 0 12 10 18 4"
      stroke="var(--accent)"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** A print-bed cube, for the 3D printing. */
export const CubeSticker = ({ className }: StickerProps) => (
  <svg {...frame} className={className} viewBox="0 0 64 64">
    <path {...outline} fill="var(--pastel-5)" d="M32 6 56 19v26L32 58 8 45V19L32 6z" />
    <path {...outline} d="M8 19l24 13 24-13M32 32v26" />
  </svg>
)

/**
 * A round badge with words running around its rim, made to turn slowly.
 * The words are repeated so they fill the circle.
 */
export const SpinningBadge = ({ className, label }: StickerProps & { label: string }) => {
  const rim = `${label} • ${label} • `.toUpperCase()

  return (
    <svg {...frame} className={className} viewBox="0 0 120 120">
      <defs>
        <path id="mk-badge-rim" d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" />
      </defs>
      <circle cx="60" cy="60" r="58" fill="var(--ink)" />
      <text fill="var(--mk-on-ink)" fontSize="12" fontWeight="600">
        <textPath href="#mk-badge-rim" textLength="266" lengthAdjust="spacing">
          {rim}
        </textPath>
      </text>
      <path
        fill="var(--pastel-1)"
        d="M60 38c1.6 12.8 9.2 20.4 22 22-12.8 1.6-20.4 9.2-22 22-1.6-12.8-9.2-20.4-22-22 12.8-1.6 20.4-9.2 22-22z"
      />
    </svg>
  )
}

/** A simple smile, because fidgets are fun. */
export const SmileSticker = ({ className }: StickerProps) => (
  <svg {...frame} className={className} viewBox="0 0 64 64">
    <circle {...outline} fill="var(--pastel-2)" cx="32" cy="32" r="26" />
    <path {...outline} d="M23 26v4M41 26v4M21 38c6 8 16 8 22 0" />
  </svg>
)
