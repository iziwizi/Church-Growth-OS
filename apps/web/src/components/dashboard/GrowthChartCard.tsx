'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface GrowthDataPoint {
  month: string
  members: number
  visitors: number
  deliveries: number
}

const DEFAULT_GROWTH_DATA: GrowthDataPoint[] = [
  { month: 'Mar', members: 210, visitors: 45, deliveries: 1200 },
  { month: 'Apr', members: 235, visitors: 58, deliveries: 1450 },
  { month: 'May', members: 252, visitors: 71, deliveries: 1800 },
  { month: 'Jun', members: 278, visitors: 66, deliveries: 2100 },
  { month: 'Jul', members: 295, visitors: 82, deliveries: 2400 },
  { month: 'Aug', members: 318, visitors: 94, deliveries: 2850 },
]

export function GrowthChartCard({ data = DEFAULT_GROWTH_DATA }: { data?: GrowthDataPoint[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Church Growth & Deliveries</h2>
          <p className="text-xs text-muted-foreground">Members, visitors, and automated message volume</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            Members
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Visitors
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            Deliveries
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <defs>
            <linearGradient id="membersGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="members"
            name="Members"
            stroke="hsl(243, 75%, 59%)"
            strokeWidth={2.5}
            fill="url(#membersGrad)"
          />
          <Area
            type="monotone"
            dataKey="visitors"
            name="Visitors"
            stroke="hsl(160, 60%, 45%)"
            strokeWidth={2.5}
            fill="url(#visitorsGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
