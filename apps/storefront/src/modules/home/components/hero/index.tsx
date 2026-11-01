import BrandLogo from "@modules/common/components/brand-logo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => (
  <section className="mukky-hero" aria-labelledby="mukky-title">
    <div className="content-container mukky-hero-grid">
      <div className="mukky-intro">
        <p className="mukky-eyebrow">Mukky&apos;s 3D Shop <span aria-hidden="true">✳</span> Est. 2026</p>
        <h1 id="mukky-title">Making<br /><span>joy.</span></h1>
        <p className="mukky-description">
          A little imagination. A lot of layers. Discover playful 3D-printed
          finds from Mukky&apos;s, a shop started by two brothers and one printer.
        </p>
        <div className="mukky-actions">
          <LocalizedClientLink href="/store" className="mukky-button">
            Explore the shop <span aria-hidden="true">↗</span>
          </LocalizedClientLink>
          <LocalizedClientLink href="/contact" className="mukky-text-link">Say hello</LocalizedClientLink>
        </div>
        <p className="mukky-footnote">Small prints. Big personality. Since 2026.</p>
      </div>
      <div className="mukky-comic-panel">
        <span className="mukky-panel-caption">Meanwhile, at Mukky&apos;s...</span>
        <BrandLogo animated />
        <span className="mukky-panel-note">Good things take a few layers.</span>
      </div>
    </div>
    <div className="mukky-paper-strip" aria-label="About the shop">
      <span>Two brothers</span><span aria-hidden="true">✳</span>
      <span>One printer</span><span aria-hidden="true">✳</span>
      <span>A whole lot of ideas</span>
    </div>
  </section>
)

export default Hero
