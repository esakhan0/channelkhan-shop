import { ArrowRightMini } from "@medusajs/icons"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"

export default function Hero({ countryCode: _countryCode }: { countryCode: string }) {
  return (
    <section className="joy-editorial-hero mk-hero content-container">
      <Reveal className="joy-artwork">
        <h1>
          <Image src="/brand/hands-up-fidget.webp" alt="Hands up if you love to fidget."
            width={1536} height={1024} sizes="(max-width: 750px) 95vw, 600px" priority />
        </h1>
      </Reveal>
      <Reveal className="joy-editorial-copy" delay={100}>
        <p className="ink-kicker">Mukky’s 3D printed fidget toys</p>
        <h2>Straight off our 3D printer and into your hands.</h2>
        <p>Figure out how your fidget moves, then pass it to a friend. Can they do it too?</p>
        <div className="ink-hero-actions">
          <LocalizedClientLink href="/store" className="ink-button">
            Explore the fidget toys <ArrowRightMini aria-hidden="true" />
          </LocalizedClientLink>
        </div>
      </Reveal>
    </section>
  )
}
