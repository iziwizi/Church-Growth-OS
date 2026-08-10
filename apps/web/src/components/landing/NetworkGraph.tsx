'use client'

import { motion } from 'framer-motion'

export function NetworkGraph() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
      <svg
        className="w-full h-full max-w-[1300px] max-h-[720px] opacity-40 dark:opacity-30 transition-opacity"
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="netGradLight1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="netGradLight2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
          </linearGradient>

          <filter id="nodeGlowLight" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Curved Connection Paths (Subtle Network Flow) ─────────────── */}
        <g strokeWidth="1.2" strokeDasharray="4 6" opacity="0.55">
          <path
            d="M 120 180 Q 280 110 500 150 T 880 140"
            stroke="url(#netGradLight1)"
          />
          <path
            d="M 160 380 Q 340 310 500 350 T 840 340"
            stroke="url(#netGradLight2)"
          />
          <path
            d="M 240 140 Q 320 270 500 230 T 760 380"
            stroke="url(#netGradLight1)"
          />
          <path
            d="M 320 420 Q 500 170 680 420"
            stroke="url(#netGradLight2)"
            strokeDasharray="2 6"
          />
        </g>

        {/* ── Network Nodes (Subtle Ministry Intelligence Hub Points) ──── */}
        {/* Node 1: Left Top */}
        <g transform="translate(180, 150)">
          <circle r="4" fill="#6366f1" filter="url(#nodeGlowLight)" />
          <circle r="10" stroke="#6366f1" strokeWidth="1" opacity="0.35" className="animate-ping origin-center" />
        </g>

        {/* Node 2: Center Top */}
        <g transform="translate(500, 150)">
          <circle r="4.5" fill="#a855f7" filter="url(#nodeGlowLight)" />
          <circle r="12" stroke="#a855f7" strokeWidth="1" opacity="0.35" className="animate-ping origin-center" />
        </g>

        {/* Node 3: Right Top */}
        <g transform="translate(820, 140)">
          <circle r="4" fill="#0ea5e9" filter="url(#nodeGlowLight)" />
          <circle r="10" stroke="#0ea5e9" strokeWidth="1" opacity="0.35" className="animate-ping origin-center" />
        </g>

        {/* Node 4: Left Bottom */}
        <g transform="translate(240, 360)">
          <circle r="4" fill="#10b981" filter="url(#nodeGlowLight)" />
          <circle r="10" stroke="#10b981" strokeWidth="1" opacity="0.3" />
        </g>

        {/* Node 5: Center Bottom */}
        <g transform="translate(500, 350)">
          <circle r="5" fill="#6366f1" filter="url(#nodeGlowLight)" />
          <circle r="14" stroke="#6366f1" strokeWidth="1" opacity="0.35" className="animate-ping origin-center" />
        </g>

        {/* Node 6: Right Bottom */}
        <g transform="translate(760, 370)">
          <circle r="4" fill="#f59e0b" filter="url(#nodeGlowLight)" />
          <circle r="10" stroke="#f59e0b" strokeWidth="1" opacity="0.3" />
        </g>
      </svg>
    </div>
  )
}
