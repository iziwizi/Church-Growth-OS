'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-card py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Col 1: Brand info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Church Growth OS"
                width={260}
                height={70}
                className="h-12 sm:h-14 w-auto object-contain rounded-lg"
              />
            </Link>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              The intelligent ministry platform engineered to help churches automate workflows, nurture first-time visitors, reconcile giving, and scale kingdom impact.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Built with purpose for modern churches worldwide.
            </p>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Platform</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Core Modules</a></li>
              <li><a href="#automation" className="hover:text-foreground transition-colors">AI &amp; Automation</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing Plans</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Col 3: Portal Access (Public customer portals only) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Access Portals</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground transition-colors">Church Admin Login</Link></li>
              <li><Link href="/register" className="hover:text-foreground transition-colors">Start Free Trial</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Member &amp; Worker Sign In</Link></li>
            </ul>
          </div>

          {/* Col 4: Trust & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Trust &amp; Legal</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Church Growth OS. All rights reserved.</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>A product of</span>
            <a
              href="https://mujteknify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-foreground hover:text-brand-500 transition-colors inline-flex items-center gap-0.5"
            >
              <span>MUJTEKNIFY</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
