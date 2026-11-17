"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * The sticky wrapper around the header. It marks itself with `data-scrolled`
 * once the page has moved, so the floating bar can tighten up and cast a
 * stronger shadow over the content passing beneath it.
 */
export default function HeaderShell({ children }: { children: ReactNode }) {
  const shell = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = shell.current
    if (!element) return

    const update = () => element.toggleAttribute("data-scrolled", window.scrollY > 16)

    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  return (
    <div ref={shell} className="sticky top-0 inset-x-0 z-50 group mk-header-shell">
      {children}
    </div>
  )
}
