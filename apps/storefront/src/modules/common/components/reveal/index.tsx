"use client"

import { useEffect, useRef, type ReactNode } from "react"

// Where each entrance starts from. Every one ends at rest, fully visible.
const EFFECTS = {
  up: { opacity: 0, transform: "translateY(26px)" },
  pop: { opacity: 0, transform: "translateY(18px) scale(0.92) rotate(-2deg)" },
  left: { opacity: 0, transform: "translateX(-40px)" },
  right: { opacity: 0, transform: "translateX(40px)" },
} as const

/**
 * Plays a short entrance the first time its content scrolls into view.
 * Nothing is hidden until that moment, so the content is always there for
 * people without JavaScript, and it stays put for anyone who asks for less
 * motion.
 */
export default function Reveal({ children, className = "", delay = 0, effect = "up" }: {
  children: ReactNode
  className?: string
  delay?: number
  effect?: keyof typeof EFFECTS
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !window.IntersectionObserver || !element.animate) return
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    let animation: Animation | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      if (!preference.matches) {
        animation = element.animate([
          EFFECTS[effect],
          { opacity: 1, transform: "none" },
        ], { duration: 700, delay, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" })
      }
      observer.disconnect()
    }, { threshold: 0.08 })
    const stop = () => { if (preference.matches) animation?.cancel() }
    preference.addEventListener("change", stop)
    observer.observe(element)
    return () => {
      observer.disconnect()
      animation?.cancel()
      preference.removeEventListener("change", stop)
    }
  }, [delay, effect])

  return <div ref={ref} className={className}>{children}</div>
}
