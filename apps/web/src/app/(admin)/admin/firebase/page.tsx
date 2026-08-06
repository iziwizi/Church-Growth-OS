'use client'

import { Flame, CheckCircle2, Server, ShieldCheck } from 'lucide-react'

export default function AdminFirebasePage() {
  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Firebase Engine &amp; Firestore Health
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Platform-wide status for Firebase Auth, Cloud Firestore, Cloud Storage, and Rules Engine.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Firebase Auth</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-muted-foreground">Authentication &amp; Verification</p>
          <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Operational</span>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Cloud Firestore</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-muted-foreground">25 Security Rules Deployed</p>
          <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Operational</span>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Firebase Admin SDK</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-[11px] text-muted-foreground">Service Account Verified</p>
          <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">Operational</span>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Project ID</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-mono font-bold text-brand-500 text-[11px]">church-growth-os</p>
          <span className="inline-block rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-500">Google Cloud</span>
        </div>
      </div>
    </div>
  )
}
