/**
 * A little 3D printer that prints a star, layer by layer, then starts again.
 *
 * It is one inline SVG, so it is sharp at any size and takes its colours from
 * the active pastel palette. The movement lives in styles/minimal.css (search
 * for "mk-printer"): the star is uncovered from the bottom up in eight steps
 * while the print head climbs in step with it. Decorative only.
 */
export default function PrinterScene({ className = "" }: { className?: string }) {
  const ink = {
    stroke: "var(--ink)",
    strokeWidth: 5,
    strokeLinejoin: "round",
    strokeLinecap: "round",
  } as const

  return (
    <svg
      className={`mk-printer ${className}`.trim()}
      viewBox="0 0 480 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Eight flat bands of colour: the layers of the print. */}
        <linearGradient id="mk-print-layers" x1="0" y1="0" x2="0" y2="1">
          {[1, 3, 5, 4, 2, 1, 3, 5].flatMap((pastel, band) => [
            <stop key={`${band}-a`} offset={band / 8} stopColor={`var(--pastel-${pastel})`} />,
            <stop key={`${band}-b`} offset={(band + 1) / 8} stopColor={`var(--pastel-${pastel})`} />,
          ])}
        </linearGradient>
      </defs>

      {/* Reel of filament, feeding the print head. */}
      <path {...ink} strokeWidth={4} d="M386 70C340 20 270 28 240 96" strokeDasharray="2 10" />
      <g className="mk-printer-reel">
        <circle {...ink} fill="var(--pastel-3)" cx="398" cy="78" r="44" />
        <circle {...ink} fill="var(--mk-card)" cx="398" cy="78" r="15" />
        <path {...ink} d="M398 34v29M398 93v29M354 78h29M413 78h29" />
      </g>

      {/* Frame. */}
      <rect {...ink} fill="var(--mk-card)" x="62" y="96" width="28" height="262" rx="12" />
      <rect {...ink} fill="var(--mk-card)" x="390" y="96" width="28" height="262" rx="12" />
      <rect {...ink} fill="var(--pastel-2)" x="48" y="72" width="384" height="40" rx="20" />
      <rect {...ink} fill="var(--pastel-4)" x="36" y="340" width="408" height="56" rx="24" />
      <path {...ink} d="M196 364v6M284 364v6M214 376c16 12 36 12 52 0" />
      <rect fill="var(--ink)" x="120" y="322" width="240" height="14" rx="7" />

      {/* The print: a star, uncovered from the plate upwards. */}
      <g className="mk-printer-print">
        <path
          {...ink}
          fill="url(#mk-print-layers)"
          d="M240 196l17.630 41.730L302.770 241.600l-34.240 29.670 10.260 44.130L240 292l-38.790 23.400 10.260-44.130-34.240-29.670 45.140-3.870z"
        />
      </g>

      {/* Sparkles that greet the finished print. */}
      <g className="mk-printer-sparkles" fill="var(--accent)">
        <path d="M150 190c1.200 9.600 6.900 15.300 16.500 16.500-9.600 1.200-15.300 6.900-16.500 16.500-1.200-9.600-6.900-15.300-16.500-16.500 9.600-1.200 15.300-6.900 16.500-16.500z" />
        <path d="M338 168c0.900 7 5.100 11.100 12 12-6.900 0.900-11.100 5.100-12 12-0.900-6.900-5.100-11.100-12-12 6.900-0.900 11.100-5.100 12-12z" />
        <path d="M352 262c0.700 5.300 3.900 8.300 9 9-5.100 0.700-8.300 3.900-9 9-0.700-5.100-3.900-8.300-9-9 5.100-0.700 8.300-3.900 9-9z" />
      </g>

      {/* Print head: the rail climbs, the head runs along it. */}
      <g className="mk-printer-rail">
        <rect fill="var(--ink)" x="90" y="262" width="300" height="12" rx="6" />
        <g className="mk-printer-head">
          <rect {...ink} fill="var(--pastel-5)" x="214" y="246" width="52" height="44" rx="12" />
          <path {...ink} fill="var(--ink)" d="M230 290h20l-10 16z" />
        </g>
      </g>
    </svg>
  )
}
