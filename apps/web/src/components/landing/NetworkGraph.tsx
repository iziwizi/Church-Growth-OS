'use client'

import { motion } from 'framer-motion'

export function NetworkGraph() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
      <svg
        className="w-full h-full max-w-[1200px] max-h-[700px] opacity-35 dark:opacity-30 transition-opacity"
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="netGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="netGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
          </linearGradient>

          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Curved Connection Paths (Subtle Network Flow) ─────────────── */}
        <g strokeWidth="1" strokeDasharray="4 6" opacity="0.6">
          <path
            d="M 120 180 Q 280 120 500 160 T 880 140"
            stroke="url(#netGrad1)"
          />
          <path
            d="M 160 380 Q 340 320 500 360 T 840 340"
            stroke="url(#netGrad2)"
          />
          <path
            d="M 240 140 Q 320 280 500 240 T 760 380"
            stroke="url(#netGrad1)"
          />
          <path
            d="M 320 420 Q 500 180 680 420"
            stroke="url(#netGrad2)"
            strokeDasharray="2 6"
          />
        </g>

        {/* ── Network Nodes (Subtle Ministry Hub Points) ────────────────── */}
        {/* Node 1: Left Top */}
        <g transform="translate(180, 150)">
          <circle r="4" fill="#818cf8" filter="url(#nodeGlow)" />
          <circle r="10" stroke="#818cf8" strokeWidth="1" opacity="0.4" className="animate-ping origin-center" />
        </g>

        {/* Node 2: Center Top */}
        <g transform="translate(500, 160)">
          <circle r="4.5" fill="#a855f7" filter="url(#nodeGlow)" />
          <circle r="12" stroke="#c084fc" strokeWidth="1" opacity="0.4" className="animate-ping origin-center" />
        </g>

        {/* Node 3: Right Top */}
        <g transform="translate(820, 150)">
          <circle r="4" fill="#38bdf8" filter="url(#nodeGlow)" />
          <circle r="10" stroke="#7dd3fc" strokeWidth="1" opacity="0.4" className="animate-ping origin-center" />
        </g>

        {/* Node 4: Left Bottom */}
        <g transform="translate(240, 360)">
          <circle r="4" fill="#34d399" filter="url(#nodeGlow)" />
          <circle r="10" stroke="#6ee7b7" strokeWidth="1" opacity="0.3" />
        </g>

        {/* Node 5: Center Bottom */}
        <g transform="translate(500, 360)">
          <circle r="5" fill="#6366f1" filter="url(#nodeGlow)" />
          <circle r="14" stroke="#818cf8" strokeWidth="1" opacity="0.4" className="animate-ping origin-center" />
        </g>

        {/* Node 6: Right Bottom */}
        <g transform="translate(760, 370)">
          <circle r="4" fill="#fbbf24" filter="url(#nodeGlow)" />
          <circle r="10" stroke="#fde68a" strokeWidth="1" opacity="0.3" />
        </g>
      </svg>
    </div>
  )
}
