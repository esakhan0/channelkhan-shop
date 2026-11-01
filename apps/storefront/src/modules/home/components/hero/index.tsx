import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Hero({ countryCode: _countryCode }: { countryCode: string }) {
  return <>
    <div className="ink-announcement">Small-batch spirit. Big imagination. <span>✳</span> Est. 2026</div>
    <section className="ink-hero content-container">
      <div className="ink-hero-copy">
        <p className="ink-kicker">A LITTLE DIFFERENT. A LOT MORE YOU.</p>
        <h1 className="ink-lettering"><span className="sr-only">Making joy.</span><Image src="/brand/making-joy.png" alt="" width={1536} height={1024} priority sizes="(max-width: 800px) 90vw, 50vw" /></h1>
        <p>Playful prints. Useful little things. Objects with a personality all of their own.</p>
        <div className="ink-hero-actions"><LocalizedClientLink href="/store" className="ink-button">Find your happy <span aria-hidden="true">↗</span></LocalizedClientLink><a href="#latest" className="ink-underlined">Explore the collection</a></div>
      </div>
      <div className="ink-workshop">
        <span className="ink-tape">MADE OF IDEAS (&amp; A FEW LAYERS)</span>
        <svg className="ink-doodle ink-doodle-one" viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M40 4 47 28 72 20 54 40 74 58 49 53 40 77 32 53 7 60 25 40 7 19 33 28Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /></svg>
        <Image src="/brand/mukkys-logo.png" alt="Our cheerful Mukky’s printer mascot, printing a golden star" width={1792} height={896} className="ink-mascot" priority />
        <div className="ink-sticker">100%<br /><span>little-shop energy</span></div>
        <svg className="ink-doodle ink-doodle-two" viewBox="0 0 100 70" fill="none" aria-hidden="true"><path d="M5 10C70 0 95 35 45 40C5 45 35 70 87 58M75 48 90 58 78 67" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
        <p className="ink-workshop-caption">Two brothers. One printer. Endless possibilities.</p>
      </div>
    </section>
    <div className="ink-ribbon"><span>USEFUL LITTLE THINGS</span><b>✳</b><span>PERSONALITY INCLUDED</span><b>✳</b><span>MAKING JOY SINCE 2026</span></div>
  </>
}
