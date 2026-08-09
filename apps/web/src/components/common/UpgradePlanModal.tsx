'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Lock, ArrowRight, X, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
  featureDescription?: string
  currentPlan?: string
  requiredPlan?: string
}

export function UpgradePlanModal({
  isOpen,
  onClose,
  featureName,
  featureDescription,
  currentPlan = 'Free Trial',
  requiredPlan = 'Growth Plan',
}: UpgradePlanModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md rounded-2xl border border-brand-500/20 bg-card p-6 shadow-2xl space-y-5 text-xs relative"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 border border-brand-500/20 shadow-xs">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                Plan Upgrade Required
              </span>
              <h3 className="font-display text-base font-bold text-foreground mt-0.5">
                Unlock {featureName}
              </h3>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <p className="text-foreground font-medium leading-relaxed">
              {featureDescription ||
                `${featureName} is not included in your current ${currentPlan} tier. Upgrade your ministry plan to enable autonomous delivery and full feature access.`}
            </p>
            <div className="flex items-center justify-between text-[11px] pt-2 border-t text-muted-foreground">
              <span>Your Current Plan: <strong className="text-foreground capitalize">{currentPlan}</strong></span>
              <span>Available on: <strong className="text-brand-600">{requiredPlan}</strong></span>
            </div>
          </div>

          {/* Value Props */}
          <div className="space-y-2 text-[11px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Instant activation upon plan upgrade</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Expanded AI tokens, satellite campuses &amp; dedicated delivery</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-xl border bg-background font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Maybe Later
            </button>
            <Link
              href="/settings?tab=subscription"
              onClick={onClose}
              className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-500 shadow-sm transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Upgrade Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
