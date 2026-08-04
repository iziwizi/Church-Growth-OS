'use client'

import { Cpu, MessageSquare, Mail, Phone } from 'lucide-react'

export default function AdminProvidersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          AI & Communication Provider Routing
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Central routing rules for Anthropic, OpenAI, Meta Cloud API, Resend, and Termii gateways.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
        <h2 className="font-display text-base font-bold text-foreground">AI Model Routing Rules</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
            <div>
              <p className="font-bold text-foreground">Claude 3.5 Sonnet</p>
              <p className="text-[10px] text-muted-foreground">Default model for Executive Reports & Content Generation</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
            <div>
              <p className="font-bold text-foreground">OpenAI GPT-4o</p>
              <p className="text-[10px] text-muted-foreground">Fallback model for complex reasoning</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}
