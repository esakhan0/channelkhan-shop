"use client"

import { useEffect, useRef, type ReactNode, type PointerEvent } from "react"

export default function WorkshopCard({ children }: { children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  const animation = useRef<Animation | null>(null)
  const reduced = useRef(true)

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => {
      reduced.current = preference.matches
      if (preference.matches) {
        animation.current?.cancel()
        panel.current?.style.removeProperty("transform")
      }
    }
    update()
    preference.addEventListener("change", update)
    return () => {
      animation.current?.cancel()
      preference.removeEventListener("change", update)
    }
  }, [])

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (reduced.current || event.pointerType !== "mouse" || !panel.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    panel.current.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) rotate(2deg)`
  }

  function wiggle() {
    if (reduced.current || !panel.current?.animate) return
    animation.current?.cancel()
    animation.current = panel.current.animate([
      { transform: "rotate(2deg)" },
      { transform: "rotate(-5deg) translateY(-8px)", offset: 0.25 },
      { transform: "rotate(5deg) translateY(-4px)", offset: 0.55 },
      { transform: "rotate(2deg)" },
    ], { duration: 700, easing: "ease-in-out" })
  }

  return <div className="ink-workshop-stage" onPointerMove={tilt} onPointerLeave={() => panel.current?.style.removeProperty("transform")}>
    <div ref={panel} className="ink-workshop">{children}</div>
    <button type="button" onClick={wiggle} className="ink-wiggle-button">Give it a wiggle <span aria-hidden="true">↝</span></button>
  </div>
}
