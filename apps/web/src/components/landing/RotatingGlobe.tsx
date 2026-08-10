'use client'

import { motion } from 'framer-motion'

export function RotatingGlobe() {
  return (
    <div className="pointer-events-none absolute top-4 sm:top-8 md:top-12 left-1/2 -translate-x-1/2 w-[320px] sm:w-[560px] md:w-[750px] lg:w-[920px] h-[320px] sm:h-[560px] md:h-[750px] lg:h-[920px] z-0 flex items-center justify-center">
      {/* ── Ambient Radiant Nebula Core ─────────────────────────────────── */}
      <div className="absolute w-[240px] sm:w-[420px] md:w-[560px] h-[240px] sm:h-[420px] md:h-[560px] rounded-full bg-gradient-to-tr from-brand-600/35 via-purple-600/30 to-indigo-500/35 blur-[70px] sm:blur-[110px]" />

      {/* ── SVG Wireframe Planetary Globe ───────────────────────────────── */}
      <svg
        className="w-full h-full max-w-[850px] max-h-[850px] opacity-95 dark:opacity-90"
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Sphere Fill */}
          <radialGradient id="globeCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
          </radialGradient>

          {/* Stroke Glow Gradients */}
          <linearGradient id="ringGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="ringGradSecondary" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
          </linearGradient>

          <filter id="neonFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
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
          stroke="url(#ringGradPrimary)"
          strokeWidth="2"
          filter="url(#neonFilter)"
        />

        {/* ── Rotating Forward Meridians Group ────────────────────────────── */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 55, ease: 'linear' }}
          style={{ transformOrigin: '400px 400px' }}
        >
          {/* Latitude Concentric Rings */}
          <ellipse cx="400" cy="400" rx="280" ry="235" stroke="url(#ringGradPrimary)" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.75" />
          <ellipse cx="400" cy="400" rx="280" ry="165" stroke="url(#ringGradPrimary)" strokeWidth="1.5" opacity="0.8" />
          <ellipse cx="400" cy="400" rx="280" ry="85" stroke="url(#ringGradSecondary)" strokeWidth="1.8" opacity="0.85" />
          <line x1="120" y1="400" x2="680" y2="400" stroke="url(#ringGradPrimary)" strokeWidth="2" opacity="0.9" />

          {/* Longitude Ellipses */}
          <ellipse cx="400" cy="400" rx="235" ry="280" stroke="url(#ringGradSecondary)" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.75" />
          <ellipse cx="400" cy="400" rx="165" ry="280" stroke="url(#ringGradSecondary)" strokeWidth="1.5" opacity="0.8" />
          <ellipse cx="400" cy="400" rx="85" ry="280" stroke="url(#ringGradPrimary)" strokeWidth="1.8" opacity="0.85" />
          <line x1="400" y1="120" x2="400" y2="680" stroke="url(#ringGradSecondary)" strokeWidth="2" opacity="0.9" />

          {/* Diagonal Tilted Orbital Ring */}
          <ellipse
            cx="400"
            cy="400"
            rx="280"
            ry="110"
            transform="rotate(28 400 400)"
            stroke="#c084fc"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity="0.8"
          />

          {/* Global Ministry Hub Nodes (Pulsing Illuminated Beacons) */}
          {/* Lagos Hub */}
          <circle cx="410" cy="430" r="6" fill="#6366f1" filter="url(#neonFilter)" />
          <circle cx="410" cy="430" r="14" stroke="#818cf8" strokeWidth="1.5" opacity="0.9" />

          {/* London Hub */}
          <circle cx="395" cy="265" r="5" fill="#a855f7" filter="url(#neonFilter)" />
          <circle cx="395" cy="265" r="12" stroke="#c084fc" strokeWidth="1.5" opacity="0.9" />

          {/* Atlanta / North America Hub */}
          <circle cx="245" cy="310" r="6" fill="#38bdf8" filter="url(#neonFilter)" />
          <circle cx="245" cy="310" r="14" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.9" />

          {/* Nairobi / East Africa Hub */}
          <circle cx="475" cy="460" r="5" fill="#34d399" filter="url(#neonFilter)" />
          <circle cx="475" cy="460" r="12" stroke="#6ee7b7" strokeWidth="1.5" opacity="0.9" />

          {/* Singapore / Asia Hub */}
          <circle cx="565" cy="435" r="5" fill="#fbbf24" filter="url(#neonFilter)" />
          <circle cx="565" cy="435" r="12" stroke="#fde68a" strokeWidth="1.5" opacity="0.9" />

          {/* Sydney / Oceania Hub */}
          <circle cx="615" cy="550" r="5" fill="#818cf8" filter="url(#neonFilter)" />
          <circle cx="615" cy="550" r="12" stroke="#a5b4fc" strokeWidth="1.5" opacity="0.9" />
        </motion.g>

        {/* ── Outer Reverse Orbital Rings with Satellite Markers ──────────── */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
          style={{ transformOrigin: '400px 400px' }}
        >
          <circle
            cx="400"
            cy="400"
            r="325"
            stroke="url(#ringGradPrimary)"
            strokeWidth="1.5"
            strokeDasharray="20 14"
            opacity="0.65"
          />
          <circle cx="400" cy="75" r="5" fill="#c084fc" filter="url(#neonFilter)" />
          <circle cx="400" cy="725" r="4.5" fill="#38bdf8" filter="url(#neonFilter)" />
        </motion.g>

        <motion.g
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 80, ease: 'linear' }}
          style={{ transformOrigin: '400px 400px' }}
        >
          <circle
            cx="400"
            cy="400"
            r="365"
            stroke="url(#ringGradSecondary)"
            strokeWidth="1.2"
            strokeDasharray="10 18"
            opacity="0.5"
          />
          <circle cx="35" cy="400" r="4.5" fill="#818cf8" filter="url(#neonFilter)" />
          <circle cx="765" cy="400" r="5" fill="#34d399" filter="url(#neonFilter)" />
        </motion.g>
      </svg>
    </div>
  )
}
