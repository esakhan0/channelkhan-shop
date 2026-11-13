"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  /** Product name, so each photo's alt text says what it shows. */
  title?: string | null
}

/**
 * One large photo with a strip of thumbnails beneath it. The photos sit in a
 * horizontal scroll-snap track, so the same markup swipes on a touch screen and
 * jumps to a photo when its thumbnail or an arrow is pressed.
 */
const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const photos = images.filter((image) => !!image.url)
  const subject = title || "Product"

  const show = (index: number) => {
    const target = track.current?.children[index] as HTMLElement | undefined

    if (!target || !track.current) {
      return
    }

    track.current.scrollTo({
      left: target.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }

  // Follows swipes as well as button presses, so the thumbnails never disagree
  // with the photo on screen.
  const syncActive = () => {
    const element = track.current

    if (!element) {
      return
    }

    const slides = Array.from(element.children) as HTMLElement[]
    const closest = slides.reduce(
      (best, slide, index) =>
        Math.abs(slide.offsetLeft - element.scrollLeft) <
        Math.abs(slides[best].offsetLeft - element.scrollLeft)
          ? index
          : best,
      0
    )

    setActive(closest)
  }

  if (!photos.length) {
    return null
  }

  return (
    <div className="joy-gallery mk-gallery" role="region" aria-label="Product photos">
      <div className="mk-gallery-stage">
        <div ref={track} className="mk-gallery-track no-scrollbar" onScroll={syncActive}>
          {photos.map((image, index) => (
            <div key={image.id} id={image.id} className="mk-gallery-slide">
              <Image
                src={image.url}
                alt={`${subject}, photo ${index + 1} of ${photos.length}`}
                priority={index === 0}
                fill
                sizes="(max-width: 1023px) 100vw, 55vw"
                style={{ objectFit: "contain" }}
              />
            </div>
          ))}
        </div>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="mk-gallery-arrow mk-gallery-arrow-previous"
              onClick={() => show(active - 1)}
              disabled={active === 0}
              aria-label="Previous photo"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="mk-gallery-arrow mk-gallery-arrow-next"
              onClick={() => show(active + 1)}
              disabled={active === photos.length - 1}
              aria-label="Next photo"
            >
              <ChevronRight aria-hidden="true" />
            </button>
            <span className="mk-gallery-count" aria-live="polite">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="mk-gallery-thumbs" role="group" aria-label="Choose a photo">
          {photos.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="mk-gallery-thumb"
              aria-label={`Show photo ${index + 1} of ${photos.length}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => show(index)}
              data-testid="gallery-thumbnail"
            >
              <Image src={image.url} alt="" fill sizes="96px" style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
