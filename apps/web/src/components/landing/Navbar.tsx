'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight, ChevronRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Platform', href: '#features' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'AI & Automation', href: '#automation' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full max-w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-xl border-b border-border/70 shadow-sm py-2.5 sm:py-3 text-foreground'
          : 'bg-zinc-950/70 backdrop-blur-xl border-b border-white/10 py-3 sm:py-4 text-white'
      }`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between gap-2">
          {/* Canonical Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Church Growth OS"
              width={260}
              height={70}
              className="h-8 sm:h-12 md:h-14 w-auto max-w-[140px] sm:max-w-[240px] object-contain rounded-lg group-hover:opacity-90 transition-opacity bg-white/10 p-1 backdrop-blur-xs"
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav
            className={`hidden md:flex items-center gap-1 p-1.5 rounded-full backdrop-blur-md transition-colors ${
              isScrolled
                ? 'bg-muted/60 border border-border/50'
                : 'bg-white/10 border border-white/15'
            }`}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  isScrolled
                    ? 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                    : 'text-zinc-300 hover:text-white hover:bg-white/15'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Auth Actions */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <Link
              href="/login"
              className={`px-4 py-2 text-xs font-semibold transition-colors ${
                isScrolled ? 'text-foreground hover:text-brand-600' : 'text-zinc-200 hover:text-white'
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:from-brand-500 hover:to-brand-600 transition-all hover:scale-[1.02]"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:hidden flex-shrink-0">
            <Link
              href="/register"
              className="px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-white bg-brand-600 rounded-lg shadow-xs flex-shrink-0"
            >
              Free Trial
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1.5 sm:p-2 rounded-xl border flex-shrink-0 ${
                isScrolled
                  ? 'border-border bg-card text-foreground'
                  : 'border-white/20 bg-zinc-900 text-white'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden border-b px-4 sm:px-6 py-5 space-y-4 w-full max-w-full overflow-x-hidden backdrop-blur-2xl ${
              isScrolled
                ? 'bg-background/98 border-border text-foreground'
                : 'bg-zinc-950/98 border-white/10 text-white'
            }`}
          >
            <div className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 text-xs sm:text-sm font-semibold border-b transition-colors ${
                    isScrolled
                      ? 'text-foreground hover:text-brand-500 border-border/30'
                      : 'text-zinc-200 hover:text-white border-white/10'
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-center py-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                  isScrolled
                    ? 'border-border bg-card text-foreground hover:bg-accent'
                    : 'border-white/20 bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-bold rounded-xl bg-brand-600 text-white shadow-md hover:bg-brand-500"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
