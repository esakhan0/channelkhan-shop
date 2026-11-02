"use client"

import { useState } from "react"
import styles from "./sale.module.css"

const message = 'USE CODE “MUKKY” FOR 25% OFF — OPENING SALE'

export default function OpeningSale() {
  const [paused, setPaused] = useState(false)
  return <aside className={styles.banner} aria-label="Opening sale">
    <span className="sr-only">{message}</span>
    <div className={styles.window} aria-hidden="true">
      <div className={styles.track} style={{ animationPlayState: paused ? "paused" : "running" }}>
        {[0, 1].map((group) => <div className={styles.group} key={group}>
          {[0, 1, 2].map((copy) => <span className={styles.message} key={copy}>{message}<span className={styles.star}>✦</span></span>)}
        </div>)}
      </div>
    </div>
    <button type="button" className={styles.pause} aria-label={paused ? "Play sale banner" : "Pause sale banner"}
      aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "▶" : "Ⅱ"}</button>
  </aside>
}
