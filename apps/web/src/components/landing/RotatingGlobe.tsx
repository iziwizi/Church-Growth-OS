'use client'

import { motion } from 'framer-motion'

export function RotatingGlobe() {
  return (
    <div className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-[750px] sm:w-[900px] lg:w-[1100px] h-[550px] sm:h-[700px] -z-10 flex items-center justify-center opacity-45 dark:opacity-35 overflow-hidden">
      {/* Ambient Gradient Core */}
      <div className="absolute w-[450px] sm:w-[550px] h-[450px] sm:h-[550px] rounded-full bg-gradient-to-tr from-brand-600/20 via-purple-600/15 to-indigo-600/20 blur-2xl" />

      {/* Rotating Spherical Wireframe */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
        className="relative w-[480px] sm:w-[620px] h-[480px] sm:h-[620px] rounded-full border border-brand-500/25 flex items-center justify-center"
      >
        {/* Latitude Ellipses */}
        <div className="absolute w-full h-[85%] rounded-full border border-dashed border-brand-400/20" />
        <div className="absolute w-full h-[60%] rounded-full border border-brand-500/20" />
        <div className="absolute w-full h-[30%] rounded-full border border-indigo-400/20" />
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

        {/* Longitude Ellipses */}
        <div className="absolute h-full w-[85%] rounded-full border border-dashed border-purple-400/20" />
        <div className="absolute h-full w-[60%] rounded-full border border-purple-500/20" />
        <div className="absolute h-full w-[30%] rounded-full border border-indigo-500/25" />
        <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-purple-500/40 to-transparent" />

        {/* Global Ministry Hub Nodes (Pulsing Network Beacons) */}
        {/* Lagos Node */}
        <div className="absolute top-[48%] left-[51%]">
          <span className="absolute -inset-1.5 rounded-full bg-brand-400 opacity-75 animate-ping" />
          <span className="relative block h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white/80" />
        </div>

        {/* London Node */}
        <div className="absolute top-[32%] left-[49%]">
          <span className="absolute -inset-1.5 rounded-full bg-purple-400 opacity-75 animate-ping" />
          <span className="relative block h-2 w-2 rounded-full bg-purple-400 ring-2 ring-white/80" />
        </div>

        {/* Atlanta / US Node */}
        <div className="absolute top-[38%] left-[30%]">
          <span className="absolute -inset-1.5 rounded-full bg-indigo-400 opacity-75 animate-ping" />
          <span className="relative block h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-white/80" />
        </div>

        {/* Nairobi Node */}
        <div className="absolute top-[56%] left-[58%]">
          <span className="absolute -inset-1.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative block h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white/80" />
        </div>

        {/* Singapore Node */}
        <div className="absolute top-[52%] left-[75%]">
          <span className="absolute -inset-1.5 rounded-full bg-amber-400 opacity-75 animate-ping" />
          <span className="relative block h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white/80" />
        </div>

        {/* Sydney Node */}
        <div className="absolute top-[72%] left-[82%]">
          <span className="absolute -inset-1.5 rounded-full bg-brand-400 opacity-75 animate-ping" />
          <span className="relative block h-2 w-2 rounded-full bg-brand-400 ring-2 ring-white/80" />
        </div>

        {/* Connecting Orbital Arc Rings */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 45, ease: 'linear' }}
          className="absolute -inset-6 rounded-full border border-brand-400/15 border-t-brand-500/40"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 80, ease: 'linear' }}
          className="absolute -inset-16 rounded-full border border-purple-500/10 border-b-purple-400/30"
        />
      </motion.div>
    </div>
  )
}
