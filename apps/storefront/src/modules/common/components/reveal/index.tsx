"use client"

import { useEffect, useRef, type ReactNode } from "react"

export default function Reveal({ children, className = "", delay = 0 }: {
  children: ReactNode
  className?: string
  delay?: number
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
          { opacity: 0, transform: "translateY(22px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 650, delay, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" })
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
  }, [delay])

  return <div ref={ref} className={className}>{children}</div>
}
