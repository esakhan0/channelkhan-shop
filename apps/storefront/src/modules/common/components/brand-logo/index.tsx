"use client"

import { useState } from "react"
import Image from "next/image"

export default function BrandLogo({ animated = false }: { animated?: boolean }) {
  const [paused, setPaused] = useState(false)
  return (
    <div className={animated ? "mukky-logo-stage" : "mukky-header-logo"}>
      <Image src="/brand/mukkys-logo-v2.png" alt="Mukky's 3D Shop — a smiling printer making a star"
        width={1938} height={811} priority
        className={animated ? "mukky-logo-drawing" : "mukky-logo-small"}
        style={{ animationPlayState: paused ? "paused" : "running" }} />
      {animated && (
        <button type="button" className="mukky-motion-button"
          aria-label={paused ? "Play logo animation" : "Pause logo animation"}
          aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? "Play animation" : "Pause animation"}
        </button>
      )}
    </div>
  )
}
