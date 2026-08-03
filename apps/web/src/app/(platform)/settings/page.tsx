'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  Palette,
  MessageSquare,
  Sparkles,
  Users,
  CreditCard,
  Globe,
  Shield,
} from 'lucide-react'

const SETTINGS_NAV = [
  { label: 'Church Profile', href: '/settings', icon: Building2 },
  { label: 'Branding & Theme', href: '/settings/branding', icon: Palette },
  { label: 'Communication Providers', href: '/settings/communications', icon: MessageSquare },
  { label: 'AI Settings', href: '/settings/ai', icon: Sparkles },
  { label: 'Users & Roles', href: '/settings/users', icon: Users },
  { label: 'Social Media', href: '/settings/social', icon: Globe },
  { label: 'Subscription', href: '/settings/subscription', icon: CreditCard },
  { label: 'Security', href: '/settings/security', icon: Shield },
]

export default function SettingsPage() {
  const pathname = usePathname()

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Settings Nav */}
      <nav className="lg:col-span-1">
        <div className="rounded-xl border bg-card shadow-sm">
          <ul className="p-2">
            {SETTINGS_NAV.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* Settings Content */}
      <div className="lg:col-span-3">
        <ChurchProfileSettings />
      </div>
    </div>
  )
}

function ChurchProfileSettings() {
  return (
    <div className="space-y-6">
      {/* Church Information */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 font-display text-base font-semibold">Church Information</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Basic information about your church visible to all staff
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Church Name</label>
            <input
              type="text"
              placeholder="Grace Community Church"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Church Slug</label>
            <div className="flex h-10 rounded-lg border border-input overflow-hidden">
              <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground border-r">
                app.churchgrowth.os/
              </span>
              <input
                type="text"
                placeholder="grace-church"
                className="flex-1 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Country</label>
            <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="NG">Nigeria</option>
              <option value="GH">Ghana</option>
              <option value="KE">Kenya</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Timezone</label>
            <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="Africa/Accra">Africa/Accra (GMT)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Church Address</label>
            <input
              type="text"
              placeholder="123 Faith Avenue, Lagos, Nigeria"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Church Description</label>
            <textarea
              rows={3}
              placeholder="A brief description of your church and mission..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">
            Save Changes
          </button>
        </div>
      </div>

      {/* AI Mode Settings */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 font-display text-base font-semibold">AI Operation Mode</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Control how the AI operates for your church
        </p>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-950/20">
            <input type="radio" name="ai_mode" value="autonomous" defaultChecked className="mt-0.5" />
            <div>
              <p className="font-medium">🤖 Autonomous Mode (Recommended)</p>
              <p className="text-sm text-muted-foreground">
                AI works automatically — no approval required. The dashboard shows what AI has already completed.
              </p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand-950/20">
            <input type="radio" name="ai_mode" value="approval" className="mt-0.5" />
            <div>
              <p className="font-medium">✋ Approval Mode</p>
              <p className="text-sm text-muted-foreground">
                AI generates content for review. Nothing is sent until a staff member approves it.
              </p>
            </div>
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">
            Save Mode
          </button>
        </div>
      </div>
    </div>
  )
}
