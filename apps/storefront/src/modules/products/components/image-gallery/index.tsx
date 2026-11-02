"use client"

import { useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const move = (index: number) => {
    const target = track.current?.children[index] as HTMLElement | undefined
    if (target && track.current) track.current.scrollTo({ left: target.offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }
  return (
    <div className="joy-gallery" role="region" aria-label="Product photos">
      <div ref={track} className="joy-gallery-track flex flex-col flex-1 small:mx-16 gap-y-4" onScroll={() => {
        if (!track.current) return
        const children = Array.from(track.current.children) as HTMLElement[]
        const closest = children.reduce((best, child, index) => Math.abs(child.offsetLeft - track.current!.scrollLeft) < Math.abs(children[best].offsetLeft - track.current!.scrollLeft) ? index : best, 0)
        setActive(closest)
      }}>
        {images.map((image, index) => {
          return (
            <Container
              key={image.id}
              className="joy-gallery-slide relative aspect-[29/34] w-full overflow-hidden bg-ui-bg-subtle"
              id={image.id}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  priority={index === 0}
                  className="absolute inset-0 rounded-rounded"
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                  style={{
                    objectFit: "cover",
                  }}
                />
              )}
            </Container>
          )
        })}
      </div>
      {images.length > 1 && <div className="joy-gallery-controls">
        <button type="button" onClick={() => move(Math.max(0, active - 1))} disabled={active === 0} aria-label="Previous product photo">←</button>
        <span aria-live="polite">{active + 1} / {images.length} <span aria-hidden="true"> · Swipe to explore</span></span>
        <button type="button" onClick={() => move(Math.min(images.length - 1, active + 1))} disabled={active === images.length - 1} aria-label="Next product photo">→</button>
      </div>}
    </div>
  )
}

export default ImageGallery
