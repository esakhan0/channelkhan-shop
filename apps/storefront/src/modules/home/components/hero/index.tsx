import styles from "./headline.module.css"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"

export default function Hero({ countryCode: _countryCode }: { countryCode: string }) {
  return <>
    <nav aria-label="Explore the shop" className="joy-browse-nav content-container">
      <LocalizedClientLink href="/store">Shop all prints</LocalizedClientLink>
      <a href="#latest">Meet the fidgets</a>
    </nav>
    <section className="joy-editorial-hero content-container">
      <Reveal className="joy-artwork">
        <h1>
          <Image src="/brand/hands-up-fidget.webp" alt="Hands up if you love to fidget."
            width={1536} height={1024} sizes="(max-width: 750px) 95vw, 600px" priority />
        </h1>
      </Reveal>
      <Reveal className="joy-editorial-copy" delay={100}>
        <p className="ink-kicker">MUKKY’S 3D PRINTED FIDGET TOYS</p>
        <h2>Straight off our 3D printer and into your hands.</h2>
        <p>Figure out how your fidget moves, then pass it to a friend. Can they do it too?</p>
        <div className="ink-hero-actions"><LocalizedClientLink href="/store" className="ink-button">Explore the fidget toys <span aria-hidden="true">↗</span></LocalizedClientLink></div>
      </Reveal>
    </section>
    <hr className={styles.divider} />
  </>
}
