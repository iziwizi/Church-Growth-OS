'use client'

import { useState } from 'react'
import { Zap, Bot, CheckCircle2, Play, Pause, RefreshCw } from 'lucide-react'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function AutomationPage() {
  const { church } = useChurchStore()

  const [workflows, setWorkflows] = useState([
    { id: '1', title: '7-Day First-Time Visitor Sequence', channel: 'WhatsApp & Email', status: 'active' },
    { id: '2', title: 'Daily 6 AM Executive Report Generation', channel: 'Email & Push', status: 'active' },
    { id: '3', title: 'Birthday & Anniversary Blessings Dispatch', channel: 'WhatsApp SMS', status: 'active' },
    { id: '4', title: 'Absentee Member Engagement (3 Weeks Inactive)', channel: 'WhatsApp', status: 'active' },
  ])

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const next = w.status === 'active' ? 'paused' : 'active'
          toast.info(`Workflow "${w.title}" is now ${next}.`)
          return { ...w, status: next }
        }
        return w
      })
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          <Zap className="h-6 w-6 text-brand-500" />
          Autonomous Engine Workflows
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Autonomous engagement schedules running 24/7 for {church?.name}.
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
            <tr>
              <th className="p-3.5">Automation Workflow</th>
              <th className="p-3.5">Channel</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {workflows.map((w) => (
              <tr key={w.id} className="hover:bg-muted/20">
                <td className="p-3.5 font-bold text-foreground">{w.title}</td>
                <td className="p-3.5 text-muted-foreground">{w.channel}</td>
                <td className="p-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                      w.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {w.status}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => toggleWorkflow(w.id)}
                    className="inline-flex h-7 px-3 items-center gap-1 rounded-lg border text-xs font-semibold hover:bg-accent"
                  >
                    {w.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {w.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
