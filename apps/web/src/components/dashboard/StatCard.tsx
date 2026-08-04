'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  color: string
  bg: string
  subtitle?: string
}

export function StatCard({
  label,
  value,
  change,
  trend = 'up',
  icon: Icon,
  color,
  bg,
  subtitle,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-brand-500/30">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-3 ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              trend === 'up'
                ? 'bg-emerald-500/10 text-emerald-500'
                : trend === 'down'
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="font-display text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
        {subtitle && <p className="mt-1 text-[11px] text-muted-foreground/80">{subtitle}</p>}
      </div>
    </div>
  )
}
