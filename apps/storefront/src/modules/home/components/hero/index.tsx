import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Reveal from "@modules/common/components/reveal"

export default function Hero({ countryCode: _countryCode }: { countryCode: string }) {
  return <>
    <nav aria-label="Explore the shop" className="joy-browse-nav content-container">
      <LocalizedClientLink href="/store">Shop all prints</LocalizedClientLink>
      <a href="#latest">Fresh from the workshop</a>
    </nav>
    <section className="joy-editorial-hero content-container">
      <Reveal className="joy-artwork">
        <h1><span className="sr-only">Making joy.</span><Image src="/brand/making-joy.png" alt="" width={1536} height={1024} priority sizes="(max-width: 750px) 95vw, 560px" /></h1>
      </Reveal>
      <Reveal className="joy-editorial-copy" delay={100}>
        <p className="ink-kicker">THE LITTLE PRINT SHOP WITH BIG IDEAS</p>
        <h2>A little different.<br />A lot more you.</h2>
        <p>Playful prints. Useful little things. Thoughtfully made objects with a personality all of their own.</p>
        <div className="ink-hero-actions"><LocalizedClientLink href="/store" className="ink-button">Find your happy <span aria-hidden="true">↗</span></LocalizedClientLink><a href="#latest" className="ink-underlined">Explore the collection</a></div>
        <span className="joy-makers-note">Made layer by layer. Loved every day.</span>
      </Reveal>
    </section>
    <div className="ink-ribbon"><span>USEFUL LITTLE THINGS</span><b aria-hidden="true">✳</b><span>PERSONALITY INCLUDED</span><b aria-hidden="true">✳</b><span>MAKING JOY SINCE 2026</span></div>
  </>
}
