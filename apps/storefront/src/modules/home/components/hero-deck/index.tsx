"use client"

import { ArrowPathMini } from "@medusajs/icons"
import Image from "next/image"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type DeckCard = {
  id: string
  title: string
  href: string
  image: string
  price?: string
}

const AUTO_SHUFFLE_MS = 3800
const TOSS_MS = 620
/** How far, in pixels, the top card must be dragged before it is thrown. */
const SWIPE_DISTANCE = 70

/**
 * A small stack of product cards to play with. The top card can be thrown to
 * the back by dragging it sideways or pressing Shuffle, and the stack leans
 * towards the pointer. Left alone, it deals itself a new card every few
 * seconds, until someone touches it or asks for less motion.
 */
export default function HeroDeck({ cards }: { cards: DeckCard[] }) {
  // order[0] is the index of the card on top.
  const [order, setOrder] = useState(() => cards.map((_, index) => index))
  // The card on its way to the back: which way it was thrown, and how far it
  // had already been dragged, so the throw starts from where the finger left it.
  const [tossed, setTossed] = useState<{ index: number; direction: 1 | -1; from: number } | null>(null)
  const [paused, setPaused] = useState(false)
  const [touched, setTouched] = useState(false)
  const deck = useRef<HTMLDivElement>(null)
  const drag = useRef({ startX: 0, active: false, moved: false })

  const shuffle = useCallback(
    (direction: 1 | -1 = 1, from = 0) => {
      if (order.length < 2) return
      setTossed({ index: order[0], direction, from })
      setOrder([...order.slice(1), order[0]])
    },
    [order]
  )

  useEffect(() => {
    if (!tossed) return
    const timer = window.setTimeout(() => setTossed(null), TOSS_MS)
    return () => window.clearTimeout(timer)
  }, [tossed])

  useEffect(() => {
    if (touched || paused || cards.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = window.setTimeout(() => shuffle(), AUTO_SHUFFLE_MS)
    return () => window.clearTimeout(timer)
  }, [touched, paused, shuffle, cards.length])

  const lean = (event: PointerEvent<HTMLDivElement>) => {
    const element = deck.current
    if (!element || event.pointerType !== "mouse") return
    const box = element.getBoundingClientRect()
    const across = (event.clientX - box.left) / box.width - 0.5
    const down = (event.clientY - box.top) / box.height - 0.5
    element.style.setProperty("--lean-x", `${(-down * 9).toFixed(2)}deg`)
    element.style.setProperty("--lean-y", `${(across * 11).toFixed(2)}deg`)
  }

  const settle = () => {
    deck.current?.style.removeProperty("--lean-x")
    deck.current?.style.removeProperty("--lean-y")
    setPaused(false)
  }

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return
    drag.current = { startX: event.clientX, active: true, moved: false }
  }

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current.active) return
    const distance = event.clientX - drag.current.startX
    if (Math.abs(distance) > 8 && !drag.current.moved) {
      drag.current.moved = true
      event.currentTarget.setAttribute("data-dragging", "")
      try {
        // Keeps the drag alive when the finger slides off the card.
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // The pointer has already gone; the drag still ends on pointerup.
      }
    }
    if (drag.current.moved) {
      event.currentTarget.style.setProperty("--drag", String(Math.round(distance)))
    }
  }

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current.active) return
    drag.current.active = false
    const distance = event.clientX - drag.current.startX
    event.currentTarget.style.removeProperty("--drag")
    event.currentTarget.removeAttribute("data-dragging")
    if (drag.current.moved && Math.abs(distance) > SWIPE_DISTANCE) {
      setTouched(true)
      shuffle(distance > 0 ? 1 : -1, Math.round(distance))
    }
  }

  // A drag ends with a click on the card; that click must not open the product.
  const swallowDragClick = (event: MouseEvent<HTMLElement>) => {
    if (!drag.current.moved) return
    drag.current.moved = false
    event.preventDefault()
  }

  return (
    <div
      ref={deck}
      className="mk-deck"
      onPointerMove={lean}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={settle}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mk-deck-cards">
        {cards.map((card, index) => {
          const position = order.indexOf(index)
          const onTop = position === 0
          const thrown = tossed?.index === index
          return (
            <LocalizedClientLink
              key={card.id}
              href={card.href}
              className="mk-deck-card"
              data-pos={Math.min(position, 3)}
              data-tossed={thrown ? "" : undefined}
              style={
                thrown
                  ? ({ "--toss": tossed.direction, "--toss-from": tossed.from } as CSSProperties)
                  : undefined
              }
              tabIndex={onTop ? 0 : -1}
              aria-hidden={onTop ? undefined : true}
              draggable={false}
              onPointerDown={onTop ? startDrag : undefined}
              onPointerMove={onTop ? moveDrag : undefined}
              onPointerUp={onTop ? endDrag : undefined}
              onPointerCancel={onTop ? endDrag : undefined}
              onClickCapture={swallowDragClick}
            >
              <span className="mk-deck-photo">
                <Image
                  src={card.image}
                  alt=""
                  fill
                  sizes="(max-width: 750px) 78vw, 440px"
                  priority={index === 0}
                  draggable={false}
                />
              </span>
              <span className="mk-deck-caption">
                <span className="mk-deck-title">{card.title}</span>
                {card.price && <span className="mk-deck-price">{card.price}</span>}
              </span>
            </LocalizedClientLink>
          )
        })}
      </div>

      {cards.length > 1 && (
        <button
          type="button"
          className="mk-deck-shuffle"
          onClick={() => {
            setTouched(true)
            shuffle()
          }}
        >
          <ArrowPathMini aria-hidden="true" />
          Shuffle
        </button>
      )}
    </div>
  )
}
