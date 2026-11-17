import { ArrowRightMini, ArrowUturnLeft, Tag } from "@medusajs/icons"
import { Fragment, type CSSProperties } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import HeroDeck, { type DeckCard } from "@modules/home/components/hero-deck"
import {
  CubeSticker,
  SmileSticker,
  SparkleSticker,
  SpinningBadge,
  SquiggleSticker,
} from "@modules/home/components/stickers"

type HeroProps = {
  /** Products for the card stack, the one to show first at the front. */
  cards: DeckCard[]
  /** Formatted lowest price in the shop, such as "£2.99". */
  fromPrice?: string
}

// Each word arrives on its own beat; the last two are underlined by hand.
const headline = ["Straight", "off", "our", "3D", "printer", "and", "into"]

/**
 * The opening screen: a full-width sheet of colour with the headline on one
 * side and a stack of product cards to play with on the other.
 */
export default function Hero({ cards, fromPrice }: HeroProps) {
  return (
    <section className="mk-hero">
      <div className="content-container mk-hero-inner">
        <div className="mk-hero-copy">
          {/* The shop's own strapline, as used at the foot of its emails. */}
          <p className="ink-kicker mk-hero-kicker">Small objects. Big personality.</p>
          <h1 className="mk-hero-title">
            {/* The space sits outside each word's box, or the words would run together. */}
            {headline.map((word, index) => (
              <Fragment key={word}>
                <span className="mk-word" style={{ "--i": index } as CSSProperties}>{word}</span>{" "}
              </Fragment>
            ))}
            <span className="mk-word mk-underlined" style={{ "--i": headline.length } as CSSProperties}>
              your hands.
              <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <path d="M4 13c38-11 74 7 112 0s78-11 116-3 44 6 64 1" />
              </svg>
            </span>
          </h1>
          <p className="mk-hero-lede">
            Fidgets that click, spin, flip and curl. Printed by us and posted with Royal Mail.
          </p>
          <div className="mk-hero-actions">
            <LocalizedClientLink href="/store" className="ink-button">
              Shop all fidgets <ArrowRightMini aria-hidden="true" />
            </LocalizedClientLink>
            <a href="#made" className="mk-ghost-button">
              How they’re made
            </a>
          </div>
          <ul className="mk-hero-facts">
            {fromPrice && (
              <li><Tag aria-hidden="true" /> Fidgets from {fromPrice}</li>
            )}
            <li><ArrowUturnLeft aria-hidden="true" /> 14 days to change your mind</li>
          </ul>
        </div>

        {cards.length > 0 && (
          <div className="mk-hero-stage">
            <SparkleSticker className="mk-sticker mk-sticker-sparkle" />
            <CubeSticker className="mk-sticker mk-sticker-cube" />
            <SquiggleSticker className="mk-sticker mk-sticker-squiggle" />
            <SmileSticker className="mk-sticker mk-sticker-smile" />
            <HeroDeck cards={cards} />
            <SpinningBadge className="mk-spin-badge" label="Printed by us" />
          </div>
        )}
      </div>
    </section>
  )
}
