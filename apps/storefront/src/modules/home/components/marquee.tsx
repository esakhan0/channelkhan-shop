import { CubeSticker, SmileSticker, SparkleSticker } from "@modules/home/components/stickers"

// What the fidgets in the shop do: click wheels, scroll wheels, infinity
// cubes, articulated dragons and the gear shift.
const words = ["Click it", "Spin it", "Flip it", "Curl it", "Shift it"]
const stickers = [SparkleSticker, CubeSticker, SmileSticker]

const Run = ({ hidden = false }: { hidden?: boolean }) => (
  <ul className="mk-marquee-run" aria-hidden={hidden ? true : undefined}>
    {words.map((word, index) => {
      const Sticker = stickers[index % stickers.length]
      return (
        <li key={word}>
          <span>{word}</span>
          <Sticker className="mk-marquee-sticker" />
        </li>
      )
    })}
  </ul>
)

/**
 * A slanted band of big words that slides past for ever. The words are written
 * out four times, so the loop has no seam even on a very wide screen; only the
 * first copy is read by screen readers. With reduced motion the band stands still.
 */
export default function Marquee() {
  return (
    <div className="mk-marquee">
      <div className="mk-marquee-band">
        <div className="mk-marquee-track">
          <Run />
          <Run hidden />
          <Run hidden />
          <Run hidden />
        </div>
      </div>
    </div>
  )
}
