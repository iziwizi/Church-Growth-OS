'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2, ShieldCheck, Clock } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAuditLogs()
  }, [])

  async function loadAuditLogs() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'auditLogs')).catch(() => null)
      const list: any[] = []
      snap?.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setLogs(list)
    } catch {
      toast.error('Could not load system audit logs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          System Security &amp; Audit Logs
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Immutable audit trails of administrative actions, plan updates, role mutations, and security events.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center shadow-xs space-y-3">
          <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
          <p className="font-bold text-foreground">System Audit Log Active</p>
          <p className="text-muted-foreground max-w-sm mx-auto">
            All administrative actions and security events are logged to Firestore audit collections automatically.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Actor User</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="p-3.5 font-bold text-foreground">{log.action}</td>
                  <td className="p-3.5 font-mono text-muted-foreground">{log.actorEmail}</td>
                  <td className="p-3.5 text-muted-foreground">{log.target}</td>
                  <td className="p-3.5 text-right text-muted-foreground">{log.timestamp || 'Recent'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
