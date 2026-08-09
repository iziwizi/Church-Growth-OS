'use client'

import { motion } from 'framer-motion'

export function RotatingGlobe() {
  return (
    <div className="pointer-events-none absolute top-6 sm:top-12 left-1/2 -translate-x-1/2 w-[340px] sm:w-[650px] md:w-[850px] lg:w-[1000px] h-[340px] sm:h-[650px] md:h-[850px] lg:h-[1000px] -z-10 flex items-center justify-center overflow-visible">
      {/* ── Central Nebula Glow ─────────────────────────────────────────── */}
      <div className="absolute w-[280px] sm:w-[500px] lg:w-[650px] h-[280px] sm:h-[500px] lg:h-[650px] rounded-full bg-gradient-to-tr from-brand-600/30 via-purple-600/25 to-indigo-500/30 blur-[90px] sm:blur-[130px]" />

      {/* ── SVG Wireframe Globe with Glowing Rings ──────────────────────── */}
      <svg
        className="w-full h-full max-w-[900px] max-h-[900px] opacity-85 dark:opacity-75"
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Core Gradient */}
          <radialGradient id="globeCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </radialGradient>

          {/* Stroke Glow Gradients */}
          <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="ringGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
          </linearGradient>

          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Semi-transparent Globe Sphere Body */}
        <circle cx="400" cy="400" r="280" fill="url(#globeCoreGlow)" />
        <circle
          cx="400"
          cy="400"
          r="280"
          stroke="url(#ringGrad1)"
          strokeWidth="1.5"
          filter="url(#neonGlow)"
        />

        {/* ── Rotating Meridian Group ────────────────────────────────────── */}
        <g className="origin-[400px_400px] animate-[spin_60s_linear_infinite]">
          {/* Latitude Concentric Rings */}
          <ellipse cx="400" cy="400" rx="280" ry="240" stroke="url(#ringGrad1)" strokeWidth="1.2" strokeDasharray="6 4" opacity="0.6" />
          <ellipse cx="400" cy="400" rx="280" ry="170" stroke="url(#ringGrad1)" strokeWidth="1.2" opacity="0.7" />
          <ellipse cx="400" cy="400" rx="280" ry="90" stroke="url(#ringGrad2)" strokeWidth="1.5" opacity="0.8" />
          <line x1="120" y1="400" x2="680" y2="400" stroke="url(#ringGrad1)" strokeWidth="1.8" opacity="0.85" />

          {/* Longitude Ellipses */}
          <ellipse cx="400" cy="400" rx="240" ry="280" stroke="url(#ringGrad2)" strokeWidth="1.2" strokeDasharray="6 4" opacity="0.6" />
          <ellipse cx="400" cy="400" rx="170" ry="280" stroke="url(#ringGrad2)" strokeWidth="1.2" opacity="0.7" />
          <ellipse cx="400" cy="400" rx="90" ry="280" stroke="url(#ringGrad1)" strokeWidth="1.5" opacity="0.8" />
          <line x1="400" y1="120" x2="400" y2="680" stroke="url(#ringGrad2)" strokeWidth="1.8" opacity="0.85" />

          {/* Diagonal Tilted Meridian */}
          <ellipse
            cx="400"
            cy="400"
            rx="280"
            ry="110"
            transform="rotate(25 400 400)"
            stroke="#a855f7"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.65"
          />
          <ellipse
            cx="400"
            cy="400"
            rx="280"
            ry="110"
            transform="rotate(-25 400 400)"
            stroke="#6366f1"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.65"
          />

          {/* Global Ministry Hub Nodes (Illuminated Pulsing Beacons) */}
          {/* Lagos */}
          <circle cx="410" cy="430" r="5" fill="#6366f1" filter="url(#neonGlow)" />
          <circle cx="410" cy="430" r="10" stroke="#818cf8" strokeWidth="1" opacity="0.8" />

          {/* London */}
          <circle cx="395" cy="270" r="4.5" fill="#a855f7" filter="url(#neonGlow)" />
          <circle cx="395" cy="270" r="9" stroke="#c084fc" strokeWidth="1" opacity="0.8" />

          {/* Atlanta / Americas */}
          <circle cx="250" cy="310" r="5" fill="#38bdf8" filter="url(#neonGlow)" />
          <circle cx="250" cy="310" r="10" stroke="#7dd3fc" strokeWidth="1" opacity="0.8" />

          {/* Nairobi */}
          <circle cx="470" cy="460" r="4.5" fill="#34d399" filter="url(#neonGlow)" />
          <circle cx="470" cy="460" r="9" stroke="#6ee7b7" strokeWidth="1" opacity="0.8" />

          {/* Singapore / Asia */}
          <circle cx="560" cy="440" r="4.5" fill="#fbbf24" filter="url(#neonGlow)" />
          <circle cx="560" cy="440" r="9" stroke="#fde68a" strokeWidth="1" opacity="0.8" />

          {/* Sydney / Oceania */}
          <circle cx="610" cy="550" r="4" fill="#818cf8" filter="url(#neonGlow)" />
          <circle cx="610" cy="550" r="8" stroke="#a5b4fc" strokeWidth="1" opacity="0.8" />
        </g>

        {/* ── Outer Reverse Orbital Rings ────────────────────────────────── */}
        <g className="origin-[400px_400px] animate-[spin_40s_linear_infinite_reverse]">
          <circle
            cx="400"
            cy="400"
            r="320"
            stroke="url(#ringGrad1)"
            strokeWidth="1.2"
            strokeDasharray="16 12"
            opacity="0.5"
          />
          {/* Orbiting Satellite Node 1 */}
          <circle cx="400" cy="80" r="4" fill="#c084fc" filter="url(#neonGlow)" />
          <circle cx="400" cy="720" r="3.5" fill="#38bdf8" filter="url(#neonGlow)" />
        </g>

        <g className="origin-[400px_400px] animate-[spin_85s_linear_infinite]">
          <circle
            cx="400"
            cy="400"
            r="360"
            stroke="url(#ringGrad2)"
            strokeWidth="1"
            strokeDasharray="8 16"
            opacity="0.35"
          />
          {/* Orbiting Satellite Node 2 */}
          <circle cx="40" cy="400" r="3.5" fill="#818cf8" filter="url(#neonGlow)" />
          <circle cx="760" cy="400" r="4" fill="#34d399" filter="url(#neonGlow)" />
        </g>
      </svg>
    </div>
  )
}
