'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore, useAuthStore } from '@/store'
import { toast } from 'sonner'
import { uploadService } from '@/lib/upload'
import {
  Building2,
  Palette,
  Users,
  Globe,
  Bell,
  Network,
  Sliders,
  Loader2,
  Save,
  Lock,
  CreditCard,
  HandHeart,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  HardDrive,
  Sparkles,
  Upload,
  X,
  ImageIcon,
  Send,
} from 'lucide-react'
import { sendPasswordReset } from '@/lib/firebase/auth'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { UpgradePlanModal } from '@/components/common/UpgradePlanModal'

type SettingsTab =
  | 'profile'
  | 'branding'
  | 'users'
  | 'social'
  | 'notifications'
  | 'branches'
  | 'subscription'
  | 'giving'
  | 'preferences'
  | 'security'

const SETTINGS_NAV = [
  { id: 'profile' as SettingsTab, label: 'Church Profile', icon: Building2 },
  { id: 'branding' as SettingsTab, label: 'Branding & Theme', icon: Palette },
  { id: 'users' as SettingsTab, label: 'Users & Roles', icon: Users },
  { id: 'social' as SettingsTab, label: 'Social Media Links', icon: Globe },
  { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
  { id: 'branches' as SettingsTab, label: 'Branch Management', icon: Network },
  { id: 'subscription' as SettingsTab, label: 'Subscription & Plan', icon: CreditCard },
  { id: 'giving' as SettingsTab, label: 'Giving & Payment', icon: HandHeart },
  { id: 'preferences' as SettingsTab, label: 'Preferences', icon: Sliders },
  { id: 'security' as SettingsTab, label: 'Security & Password', icon: Lock },
]

function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab | null
    if (tab && ['profile', 'branding', 'users', 'social', 'notifications', 'branches', 'subscription', 'giving', 'preferences', 'security'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const { church, setChurch } = useChurchStore()
  const { user } = useAuthStore()

  if (!church) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Church Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system configuration, white-label branding, branch networks, and team permissions for{' '}
          <span className="font-semibold text-brand-500">{church.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <nav className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <ul className="p-2 space-y-1">
              {SETTINGS_NAV.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Tab Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'branding' && <BrandingSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'users' && <UsersSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'social' && <SocialMediaSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'notifications' && <NotificationsSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'branches' && <BranchSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'subscription' && <SubscriptionSettingsTab church={church} />}
          {activeTab === 'giving' && <GivingSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'preferences' && <PreferencesTab church={church} setChurch={setChurch} />}
          {activeTab === 'security' && <SecuritySettingsTab user={user} />}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>}>
      <SettingsPageContent />
    </Suspense>
  )
}

// ── 1. Profile Settings Tab (Task 5: Synchronizes all setup fields) ─────────
function ProfileSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: church.name ?? '',
      slug: church.slug ?? '',
      description: church.description ?? '',
      missionStatement: church.missionStatement ?? '',
      visionStatement: church.visionStatement ?? '',
      churchEmail: church.churchEmail ?? '',
      churchPhone: church.churchPhone ?? '',
      website: church.website ?? '',
      address: church.address ?? '',
      city: church.city ?? '',
      state: church.state ?? '',
      denomination: church.denomination ?? 'Pentecostal',
      yearFounded: church.yearFounded ?? '',
      averageAttendance: church.averageAttendance ?? 250,
      country: church.branding?.country ?? 'NG',
      timezone: church.branding?.timezone ?? 'Africa/Lagos',
      seniorPastorName: church.seniorPastor?.name ?? '',
      seniorPastorEmail: church.seniorPastor?.email ?? '',
      seniorPastorPhone: church.seniorPastor?.phone ?? '',
    },
  })

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      const churchRef = doc(db, 'churches', church.id)
      const updateData = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        missionStatement: data.missionStatement,
        visionStatement: data.visionStatement,
        churchEmail: data.churchEmail,
        churchPhone: data.churchPhone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        denomination: data.denomination,
        yearFounded: data.yearFounded ? parseInt(data.yearFounded) : null,
        averageAttendance: parseInt(data.averageAttendance) || 250,
        seniorPastor: {
          name: data.seniorPastorName,
          email: data.seniorPastorEmail,
          phone: data.seniorPastorPhone,
        },
        'branding.country': data.country,
        'branding.timezone': data.timezone,
        updatedAt: serverTimestamp(),
      }
      await updateDoc(churchRef, updateData)

      setChurch({
        ...church,
        ...data,
        seniorPastor: {
          name: data.seniorPastorName,
          email: data.seniorPastorEmail,
          phone: data.seniorPastorPhone,
        },
        branding: { ...church.branding, country: data.country, timezone: data.timezone },
      })
      toast.success('Church profile updated successfully!')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4 text-xs">
        <h2 className="font-display text-base font-bold text-foreground">Church Identity &amp; Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="font-semibold">Church Name</label>
            <input
              type="text"
              {...register('name')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Church Slug (URL)</label>
            <input
              type="text"
              {...register('slug')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Church Email</label>
            <input
              type="email"
              {...register('churchEmail')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Church Phone</label>
            <input
              type="text"
              {...register('churchPhone')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Country</label>
            <select
              {...register('country')}
              className="flex h-9 w-full rounded-xl border bg-background px-2"
            >
              <option value="NG">Nigeria</option>
              <option value="GH">Ghana</option>
              <option value="KE">Kenya</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Timezone</label>
            <select
              {...register('timezone')}
              className="flex h-9 w-full rounded-xl border bg-background px-2"
            >
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="Africa/Accra">Africa/Accra (GMT)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Denomination</label>
            <input
              type="text"
              {...register('denomination')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Year Founded</label>
            <input
              type="number"
              {...register('yearFounded')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="font-semibold">Address</label>
            <input
              type="text"
              {...register('address')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">City</label>
            <input
              type="text"
              {...register('city')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">State / Region</label>
            <input
              type="text"
              {...register('state')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
        </div>

        <h3 className="font-display text-sm font-bold text-foreground border-t pt-4">Leadership &amp; Vision</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="font-semibold">Senior Pastor Name</label>
            <input
              type="text"
              {...register('seniorPastorName')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Pastor Email</label>
            <input
              type="email"
              {...register('seniorPastorEmail')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Pastor Phone</label>
            <input
              type="text"
              {...register('seniorPastorPhone')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="font-semibold">Mission Statement</label>
            <textarea
              rows={2}
              {...register('missionStatement')}
              className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
            />
          </div>
          <div>
            <label className="font-semibold">Vision Statement</label>
            <textarea
              rows={2}
              {...register('visionStatement')}
              className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
            />
          </div>
          <div>
            <label className="font-semibold">Church Description</label>
            <textarea
              rows={2}
              {...register('description')}
              className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Profile
          </button>
        </div>
      </div>
    </form>
  )
}

// ── 2. Branding Settings Tab ──────────────────────────────────────────────────
function BrandingSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [primaryColor, setPrimaryColor] = useState(church.branding?.primaryColor ?? '#4f46e5')
  const [secondaryColor, setSecondaryColor] = useState(church.branding?.secondaryColor ?? '#06b6d4')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const currentLogoUrl = church.branding?.logoUrl ?? null

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5 MB')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleRemoveSelectedLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let logoUrl = currentLogoUrl ?? ''

      // Upload new logo if selected
      if (logoFile) {
        setUploadingLogo(true)
        try {
          const res = await uploadService.upload(logoFile, {
            folder: `churches/${church.id}/logos`,
            allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
          })
          logoUrl = res.url
        } finally {
          setUploadingLogo(false)
        }
      }

      const churchRef = doc(db, 'churches', church.id)
      await updateDoc(churchRef, {
        'branding.primaryColor': primaryColor,
        'branding.secondaryColor': secondaryColor,
        'branding.logoUrl': logoUrl,
        updatedAt: serverTimestamp(),
      })

      // Update Zustand store immediately — sidebar and header reflect change
      const updatedBranding = {
        ...church.branding,
        primaryColor,
        secondaryColor,
        logoUrl,
      }
      setChurch({ ...church, branding: updatedBranding })
      setLogoFile(null)
      setLogoPreview(null)
      toast.success('Branding updated! Logo is now synchronized across the platform.')
    } catch {
      toast.error('Failed to update branding.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* ── Logo Section ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground">Church Logo</h2>
        <p className="text-xs text-muted-foreground">Your logo is displayed in the sidebar, reports, and exported PDFs. Changes sync instantly.</p>

        <div className="flex items-center gap-6">
          {/* Current / Preview */}
          <div className="relative">
            {(logoPreview ?? currentLogoUrl) ? (
              <>
                <img
                  src={logoPreview ?? currentLogoUrl!}
                  alt="Church Logo"
                  className="h-20 w-20 rounded-lg object-contain border-2 border-border bg-background p-1"
                />
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveSelectedLogo}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border bg-background px-4 font-semibold text-foreground hover:bg-accent transition-colors">
              <Upload className="h-3.5 w-3.5" />
              {logoFile ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            </label>
            <p className="text-muted-foreground">PNG, JPG, SVG or WebP — Max 5 MB.</p>
            {logoFile && (
              <p className="text-brand-500 font-semibold">✓ New logo ready to save</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Theme Colors Section ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground">Theme Colors</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div>
            <label className="font-semibold">Primary Brand Color</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-xl border bg-transparent p-1"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold">Secondary Accent Color</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-xl border bg-transparent p-1"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs uppercase font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || uploadingLogo}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {(saving || uploadingLogo) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {uploadingLogo ? 'Uploading logo...' : saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ── 3. Users & Roles Tab (Granular Permissions Matrix) ───────────────────────
function UsersSettingsTab({ church, setChurch }: { church: any; setChurch?: any }) {
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'pastor' | 'finance' | 'comms' | 'media' | 'volunteer' | 'custom'>('admin')
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)

  const MODULES = [
    { id: 'dashboard', name: 'Dashboard & Overview' },
    { id: 'members', name: 'Members Directory' },
    { id: 'visitors', name: 'First-Time Visitors' },
    { id: 'prayer', name: 'Prayer Requests' },
    { id: 'sermons', name: 'Sermons & Media' },
    { id: 'events', name: 'Events & Attendance' },
    { id: 'giving', name: 'Donations & Giving' },
    { id: 'store', name: 'Church Store' },
    { id: 'communications', name: 'Broadcasts & SMS' },
    { id: 'aiStudio', name: 'AI Studio & Repurposing' },
    { id: 'reports', name: 'Executive Growth Reports' },
    { id: 'liveService', name: 'Live Streaming Room' },
    { id: 'settings', name: 'Church Settings & Billing' },
  ]

  const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
    owner: { dashboard: true, members: true, visitors: true, prayer: true, sermons: true, events: true, giving: true, store: true, communications: true, aiStudio: true, reports: true, liveService: true, settings: true },
    admin: { dashboard: true, members: true, visitors: true, prayer: true, sermons: true, events: true, giving: false, store: true, communications: true, aiStudio: true, reports: true, liveService: true, settings: false },
    pastor: { dashboard: true, members: true, visitors: true, prayer: true, sermons: true, events: true, giving: false, store: false, communications: true, aiStudio: true, reports: true, liveService: false, settings: false },
    finance: { dashboard: true, members: false, visitors: false, prayer: false, sermons: false, events: false, giving: true, store: true, communications: false, aiStudio: false, reports: true, liveService: false, settings: false },
    comms: { dashboard: true, members: true, visitors: true, prayer: false, sermons: true, events: true, giving: false, store: true, communications: true, aiStudio: true, reports: false, liveService: true, settings: false },
    media: { dashboard: true, members: false, visitors: false, prayer: false, sermons: true, events: true, giving: false, store: false, communications: false, aiStudio: true, reports: false, liveService: true, settings: false },
    volunteer: { dashboard: true, members: false, visitors: true, prayer: true, sermons: false, events: true, giving: false, store: false, communications: false, aiStudio: false, reports: false, liveService: false, settings: false },
    custom: { dashboard: true, members: true, visitors: true, prayer: true, sermons: false, events: false, giving: false, store: false, communications: false, aiStudio: false, reports: false, liveService: false, settings: false },
  }

  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    return church.rolePermissions || DEFAULT_ROLE_PERMISSIONS
  })

  useEffect(() => {
    if (church.rolePermissions) {
      setRolePermissions(church.rolePermissions)
    }
  }, [church.rolePermissions])

  const toggleModulePermission = (modId: string) => {
    if (selectedRole === 'owner') {
      toast.info('Senior Pastor / Owner has unconditional master access.')
      return
    }

    setRolePermissions((prev) => {
      const currentRolePerms = prev[selectedRole] || DEFAULT_ROLE_PERMISSIONS[selectedRole] || {}
      return {
        ...prev,
        [selectedRole]: {
          ...currentRolePerms,
          [modId]: !currentRolePerms[modId],
        },
      }
    })
  }

  const handleSavePermissions = async () => {
    setSavingPermissions(true)
    try {
      await updateDoc(doc(db, 'churches', church.id), {
        rolePermissions,
        updatedAt: serverTimestamp(),
      })
      if (setChurch) setChurch({ ...church, rolePermissions })
      toast.success(`Role permissions matrix saved successfully to Firestore!`)
    } catch {
      toast.error('Failed to save permissions.')
    } finally {
      setSavingPermissions(false)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteName.trim() || !church?.id) return
    setInviting(true)
    try {
      await addDoc(collection(db, 'churches', church.id, 'teamMembers'), {
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        status: 'active',
        invitedAt: serverTimestamp(),
      })
      toast.success(`Invitation dispatched to ${inviteEmail} as "${inviteRole}".`)
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteName('')
    } catch {
      toast.error('Failed to send invitation.')
    } finally {
      setInviting(false)
    }
  }

  const currentRolePerms = rolePermissions[selectedRole] || DEFAULT_ROLE_PERMISSIONS[selectedRole] || {}

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Team Users &amp; Granular Permissions</h2>
          <p className="text-muted-foreground mt-0.5">Control staff and volunteer access across all church modules with instant Firestore persistence.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSavePermissions}
            disabled={savingPermissions}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50 shadow-xs"
          >
            {savingPermissions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Permissions
          </button>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border bg-card px-4 font-semibold text-foreground hover:bg-accent shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Invite Team Member
          </button>
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="font-bold text-foreground">Role Presets &amp; Permission Matrix</span>
          <span className="text-[11px] text-muted-foreground capitalize font-medium">Editing: {selectedRole}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'owner', label: 'Senior Pastor / Owner' },
            { id: 'admin', label: 'Church Administrator' },
            { id: 'pastor', label: 'Associate Pastor' },
            { id: 'finance', label: 'Finance & Accounts' },
            { id: 'comms', label: 'Communications Team' },
            { id: 'media', label: 'Media & Tech' },
            { id: 'volunteer', label: 'Department Volunteer' },
            { id: 'custom', label: 'Custom Staff Role' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRole(r.id as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedRole === r.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'border bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Permissions Grid with Interactive Click Toggle */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          {MODULES.map((mod) => {
            const hasAccess = currentRolePerms[mod.id] ?? false
            const isOwner = selectedRole === 'owner'

            return (
              <div
                key={mod.id}
                onClick={() => !isOwner && toggleModulePermission(mod.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isOwner
                    ? 'bg-brand-500/5 border-brand-500/20 cursor-not-allowed'
                    : 'cursor-pointer hover:border-brand-500/50'
                } ${
                  hasAccess ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-muted/10 border-border opacity-60'
                }`}
              >
                <div>
                  <span className="font-semibold text-foreground">{mod.name}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isOwner ? 'Master access' : 'Click to toggle access'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                    hasAccess
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}
                >
                  {hasAccess ? '✓ Allowed' : '✕ Restricted'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Invite New Team Member</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3.5">
              <div>
                <label className="font-semibold text-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deacon Joshua Emmanuel"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="joshua@church.org"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Role Preset</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2 font-medium"
                >
                  <option value="admin">Church Administrator</option>
                  <option value="pastor">Associate Pastor</option>
                  <option value="finance">Finance &amp; Tithing Team</option>
                  <option value="comms">Communications Lead</option>
                  <option value="media">Media &amp; Sound Tech</option>
                  <option value="volunteer">Volunteer Member</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 4. Social Links Tab (Task 6: Expanded 12 Supported Platforms) ─────────────
function SocialMediaSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const links = church.socialLinks ?? {}

  const [facebook, setFacebook] = useState(links.facebook ?? '')
  const [instagram, setInstagram] = useState(links.instagram ?? '')
  const [youtube, setYoutube] = useState(links.youtube ?? '')
  const [tiktok, setTiktok] = useState(links.tiktok ?? '')
  const [linkedin, setLinkedin] = useState(links.linkedin ?? '')
  const [twitter, setTwitter] = useState(links.twitter ?? '')
  const [threads, setThreads] = useState(links.threads ?? '')
  const [telegram, setTelegram] = useState(links.telegram ?? '')
  const [whatsappChannel, setWhatsappChannel] = useState(links.whatsappChannel ?? '')
  const [spotify, setSpotify] = useState(links.spotify ?? '')
  const [applePodcast, setApplePodcast] = useState(links.applePodcast ?? '')
  const [website, setWebsite] = useState(links.website ?? church.website ?? '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const socialLinksPayload = {
        facebook,
        instagram,
        youtube,
        tiktok,
        linkedin,
        twitter,
        threads,
        telegram,
        whatsappChannel,
        spotify,
        applePodcast,
        website,
      }
      await updateDoc(doc(db, 'churches', church.id), {
        socialLinks: socialLinksPayload,
        updatedAt: serverTimestamp(),
      })
      setChurch({ ...church, socialLinks: socialLinksPayload })
      toast.success('All 12 Social media channels saved to Firestore!')
    } catch {
      toast.error('Failed to update social links.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
        <h2 className="font-display text-base font-bold text-foreground">12 Ministry Social &amp; Media Channels</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="font-semibold">Facebook Page</label>
            <input
              type="url"
              placeholder="https://facebook.com/mychurch"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Instagram Handle / URL</label>
            <input
              type="url"
              placeholder="https://instagram.com/mychurch"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">YouTube Channel</label>
            <input
              type="url"
              placeholder="https://youtube.com/@mychurch"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">TikTok Profile</label>
            <input
              type="url"
              placeholder="https://tiktok.com/@mychurch"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">LinkedIn Page</label>
            <input
              type="url"
              placeholder="https://linkedin.com/company/mychurch"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">X / Twitter</label>
            <input
              type="url"
              placeholder="https://x.com/mychurch"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Threads</label>
            <input
              type="url"
              placeholder="https://threads.net/@mychurch"
              value={threads}
              onChange={(e) => setThreads(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Telegram Channel / Group</label>
            <input
              type="url"
              placeholder="https://t.me/mychurch"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">WhatsApp Channel</label>
            <input
              type="url"
              placeholder="https://whatsapp.com/channel/..."
              value={whatsappChannel}
              onChange={(e) => setWhatsappChannel(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Spotify Podcast Show</label>
            <input
              type="url"
              placeholder="https://open.spotify.com/show/..."
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Apple Podcast</label>
            <input
              type="url"
              placeholder="https://podcasts.apple.com/..."
              value={applePodcast}
              onChange={(e) => setApplePodcast(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Official Website</label>
            <input
              type="url"
              placeholder="https://mychurch.org"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Social Media Links
          </button>
        </div>
      </div>
    </form>
  )
}

// ── 5. Notification Center Settings Tab ───────────────────────────────────────
function NotificationsSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const { hasFeature, planName } = useFeatureAccess()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState('')
  const [upgradeDesc, setUpgradeDesc] = useState('')

  const channelPermissions = {
    inApp: true,
    email: hasFeature('email'),
    whatsapp: hasFeature('whatsapp'),
    sms: hasFeature('sms'),
  }

  const [settings, setSettings] = useState({
    visitorArrival: { email: true, inApp: true, whatsapp: true, sms: false },
    prayerRequest: { email: true, inApp: true, whatsapp: false, sms: false },
    donationReceived: { email: true, inApp: true, whatsapp: true, sms: true },
    storeOrder: { email: true, inApp: true, whatsapp: true, sms: false },
    dailyGrowthReport: { email: true, inApp: true, whatsapp: true, sms: false },
  })

  useEffect(() => {
    if (church.notifications) {
      setSettings((prev) => ({ ...prev, ...church.notifications }))
    }
  }, [church.notifications])

  const toggleChannel = (eventKey: keyof typeof settings, channelKey: 'email' | 'inApp' | 'whatsapp' | 'sms') => {
    if (!channelPermissions[channelKey]) {
      const channelNames: Record<string, string> = {
        email: 'Email Delivery Engine',
        whatsapp: 'WhatsApp Meta Gateway',
        sms: 'Termii SMS Gateway',
      }
      setUpgradeFeature(channelNames[channelKey] || channelKey)
      setUpgradeDesc(
        `Your current plan (${planName}) does not include ${channelNames[channelKey] || channelKey}. Upgrade your subscription to activate this notification channel.`
      )
      setShowUpgradeModal(true)
      return
    }

    setSettings((prev) => ({
      ...prev,
      [eventKey]: {
        ...prev[eventKey],
        [channelKey]: !prev[eventKey][channelKey],
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Sanitize payload: never persist unsupported channels as true
      const sanitizedSettings = { ...settings }
      Object.keys(sanitizedSettings).forEach((evt) => {
        const k = evt as keyof typeof settings
        if (!channelPermissions.email) sanitizedSettings[k].email = false
        if (!channelPermissions.whatsapp) sanitizedSettings[k].whatsapp = false
        if (!channelPermissions.sms) sanitizedSettings[k].sms = false
      })

      await updateDoc(doc(db, 'churches', church.id), {
        notifications: sanitizedSettings,
        updatedAt: serverTimestamp(),
      })
      setChurch({ ...church, notifications: sanitizedSettings })
      toast.success('Notification preferences updated!')
    } catch {
      toast.error('Failed to update notification settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestNotification = async () => {
    setTesting(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      toast.success('🔔 Test notification dispatched to your active channels!')
    } catch {
      toast.error('Test notification failed.')
    } finally {
      setTesting(false)
    }
  }

  const EVENT_LABELS = [
    { key: 'visitorArrival' as const, label: 'First-Time Visitor Arrival', desc: 'When a new guest registers via form or QR code' },
    { key: 'prayerRequest' as const, label: 'New Prayer Request Submitted', desc: 'When a member or visitor submits a prayer need' },
    { key: 'donationReceived' as const, label: 'Online Donation / Offering', desc: 'When an online contribution or tithe is confirmed' },
    { key: 'storeOrder' as const, label: 'Church Store Resource Order', desc: 'When a member orders books, sermons, or tickets' },
    { key: 'dailyGrowthReport' as const, label: '6:00 AM Executive Growth Report', desc: 'Daily morning pastoral briefing with AI recommendations' },
  ]

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5 text-xs">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Multi-Channel Notification Center</h2>
          <p className="text-muted-foreground mt-0.5">Choose which channels receive instant alerts for critical ministry activities.</p>
        </div>
        <button
          type="button"
          onClick={handleTestNotification}
          disabled={testing}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border bg-card px-3.5 font-semibold text-foreground hover:bg-accent disabled:opacity-50"
        >
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5 text-brand-600" />}
          Send Test Notification
        </button>
      </div>

      <div className="space-y-3">
        {EVENT_LABELS.map((evt) => (
          <div key={evt.key} className="rounded-xl border bg-muted/10 p-4 space-y-2.5">
            <div>
              <p className="font-bold text-foreground text-xs">{evt.label}</p>
              <p className="text-[11px] text-muted-foreground">{evt.desc}</p>
            </div>

            <div className="flex flex-wrap gap-4 pt-1 border-t">
              {(['inApp', 'email', 'whatsapp', 'sms'] as const).map((ch) => {
                const isPermitted = channelPermissions[ch]
                const isChecked = isPermitted && (settings[evt.key]?.[ch] ?? false)

                return (
                  <label
                    key={ch}
                    onClick={(e) => {
                      if (!isPermitted) {
                        e.preventDefault()
                        toggleChannel(evt.key, ch)
                      }
                    }}
                    className={`flex items-center gap-1.5 font-medium transition-all ${
                      isPermitted
                        ? 'cursor-pointer text-foreground'
                        : 'cursor-pointer text-muted-foreground opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!isPermitted}
                      checked={isChecked}
                      onChange={() => toggleChannel(evt.key, ch)}
                      className="rounded text-brand-600 focus:ring-brand-500 disabled:opacity-40"
                    />
                    <span className="capitalize">{ch === 'inApp' ? 'In-App' : ch}</span>
                    {!isPermitted && <Lock className="h-3 w-3 text-amber-500 ml-0.5" />}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Notification Matrix
        </button>
      </div>

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeature}
        featureDescription={upgradeDesc}
        currentPlan={planName}
        requiredPlan="Starter or Growth Plan"
      />
    </div>
  )
}

// ── 6. Branch Management Tab ──────────────────────────────────────────────────
function BranchSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const branches = church.branches ?? []
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchAddr, setNewBranchAddr] = useState('')
  const [newBranchPastor, setNewBranchPastor] = useState('')
  const [adding, setAdding] = useState(false)

  // Read branch limit from Firestore-backed subscription — no hardcoding
  const branchesLimit: number = church.subscription?.branchesLimit ?? 1
  const canAddBranch = branchesLimit > 1 || branchesLimit === -1 // -1 = unlimited
  const planId: string = church.subscription?.planId ?? 'free_trial'

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBranchName.trim()) return
    if (!canAddBranch) {
      toast.error('Upgrade your plan to add satellite branches.')
      return
    }
    setAdding(true)
    try {
      const newBranch = {
        id: `branch-${Date.now()}`,
        name: newBranchName.trim(),
        address: newBranchAddr.trim(),
        pastorName: newBranchPastor.trim(),
        isHQ: false,
      }
      const updatedBranches = [...branches, newBranch]
      await updateDoc(doc(db, 'churches', church.id), {
        branches: updatedBranches,
        updatedAt: serverTimestamp(),
      })
      setChurch({ ...church, branches: updatedBranches })
      toast.success(`Branch "${newBranchName}" created!`)
      setNewBranchName('')
      setNewBranchAddr('')
      setNewBranchPastor('')
    } catch {
      toast.error('Failed to add branch.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground">Satellite Campuses &amp; Branches</h2>
      <div className="space-y-3">
        {branches.map((b: any) => (
          <div key={b.id} className="flex items-center justify-between rounded-xl border p-3 bg-muted/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{b.name}</span>
                {b.isHQ && <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-500">HQ</span>}
              </div>
              <p className="text-muted-foreground text-[11px] mt-0.5">{b.address} • Pastor: {b.pastorName || 'Unassigned'}</p>
            </div>
          </div>
        ))}
      </div>

      {canAddBranch ? (
        /* ── Plan allows branches — show Add Branch form ── */
        <form onSubmit={handleAddBranch} className="rounded-xl border bg-muted/20 p-4 space-y-3">
          <p className="font-bold text-foreground">Add New Satellite Branch</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              type="text"
              required
              placeholder="Branch Name *"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="flex h-9 rounded-xl border bg-background px-3"
            />
            <input
              type="text"
              placeholder="Address"
              value={newBranchAddr}
              onChange={(e) => setNewBranchAddr(e.target.value)}
              className="flex h-9 rounded-xl border bg-background px-3"
            />
            <input
              type="text"
              placeholder="Resident Pastor Name"
              value={newBranchPastor}
              onChange={(e) => setNewBranchPastor(e.target.value)}
              className="flex h-9 rounded-xl border bg-background px-3"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={adding}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-brand-600 px-3 font-semibold text-white hover:bg-brand-500"
            >
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Add Campus Branch
            </button>
          </div>
        </form>
      ) : (
        /* ── Free plan: show Upgrade Card ── */
        <div className="rounded-xl border-2 border-dashed border-brand-500/30 bg-brand-500/5 p-6 text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
              <Network className="h-6 w-6" />
            </div>
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Multi-Campus Branches</p>
            <p className="text-muted-foreground mt-1">
              Your current plan <span className="font-semibold text-foreground capitalize">{planId.replace('_', ' ')}</span> supports{' '}
              <span className="font-semibold text-brand-500">1 campus</span> only. Upgrade to Growth or Enterprise to add satellite branches.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade Plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ── 7. Subscription Tab (Task 11 Requirement) ────────────────────────────────
function SubscriptionSettingsTab({ church }: { church: any }) {
  const isTrial = church.subscription?.planId === 'free_trial' || church.subscription?.status === 'trialing'
  const planName = isTrial ? '14-Day Free Trial' : (church.subscription?.planId?.toUpperCase() ?? 'FREE TRIAL')

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-brand-500" />
        Current SaaS Subscription
      </h2>

      <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground text-sm">{planName}</p>
            <p className="text-muted-foreground text-[11px]">
              Status: <span className="text-emerald-500 font-bold capitalize">{church.subscription?.status ?? 'active'}</span>
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 shadow-xs"
          >
            <span>Upgrade Plan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── 8. Preferences Tab (Ministry Growth Mode) ─────────────────────────────────
function PreferencesTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const currentGrowthMode = church.preferences?.growthMode ?? church.settings?.aiMode ?? 'automatic'

  const handleSetGrowthMode = async (mode: 'automatic' | 'manual') => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'churches', church.id), {
        'preferences.growthMode': mode,
        'settings.aiMode': mode === 'automatic' ? 'autonomous' : 'approval',
        updatedAt: serverTimestamp(),
      })
      setChurch({
        ...church,
        preferences: { ...church.preferences, growthMode: mode },
        settings: { ...church.settings, aiMode: mode === 'automatic' ? 'autonomous' : 'approval' },
      })
      toast.success(`Ministry Growth Mode set to ${mode.toUpperCase()}!`)
    } catch {
      toast.error('Failed to update Growth Mode.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-6 text-xs">
      <div>
        <h2 className="font-display text-base font-bold text-foreground">Ministry Growth Mode</h2>
        <p className="text-muted-foreground mt-0.5">
          Select how Church Growth OS automations and AI workflows operate for your ministry.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Automatic Mode */}
        <div
          onClick={() => handleSetGrowthMode('automatic')}
          className={`cursor-pointer rounded-2xl border p-5 space-y-2.5 transition-all ${
            currentGrowthMode === 'automatic' || currentGrowthMode === 'autonomous'
              ? 'border-brand-600 bg-brand-500/10 ring-2 ring-brand-500/30'
              : 'border-border bg-card hover:border-brand-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold text-foreground">⚡ Automatic Growth Mode</span>
            {(currentGrowthMode === 'automatic' || currentGrowthMode === 'autonomous') && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            AI automatically dispatches scheduled follow-up journeys, 6:00 AM daily executive briefings, and automated reminders without requiring manual human approval for every action.
          </p>
        </div>

        {/* Manual Approval Mode */}
        <div
          onClick={() => handleSetGrowthMode('manual')}
          className={`cursor-pointer rounded-2xl border p-5 space-y-2.5 transition-all ${
            currentGrowthMode === 'manual' || currentGrowthMode === 'approval'
              ? 'border-brand-600 bg-brand-500/10 ring-2 ring-brand-500/30'
              : 'border-border bg-card hover:border-brand-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold text-foreground">🛡️ Manual Approval Mode</span>
            {(currentGrowthMode === 'manual' || currentGrowthMode === 'approval') && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            AI drafts all guest follow-up messages, announcements, and sermon reels into an approval queue, waiting for pastoral team review before any broadcast is dispatched.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
        <p className="font-semibold text-foreground">Platform Standards</p>
        <div className="space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <span>Default Platform Currency:</span>
            <span className="font-bold text-foreground">NGN (₦) / USD ($)</span>
          </div>
          <div className="flex justify-between">
            <span>Primary AI Intelligence Gateway:</span>
            <span className="font-bold text-brand-600">AgentRouter.org</span>
          </div>
          <div className="flex justify-between">
            <span>Architecture Version:</span>
            <span className="font-bold text-foreground">Production Hardened v2.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 9. Security Tab ───────────────────────────────────────────────────────────
function SecuritySettingsTab({ user }: { user: any }) {
  const [sending, setSending] = useState(false)

  const handleResetPassword = async () => {
    if (!user?.email) return
    setSending(true)
    try {
      await sendPasswordReset(user.email)
      toast.success(`Password reset email sent to ${user.email}!`)
    } catch {
      toast.error('Failed to send reset email.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground">Account Security</h2>
      <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
        <p className="font-semibold text-foreground">Reset Account Password</p>
        <p className="text-muted-foreground">Send a secure password reset link to your registered email address ({user?.email}).</p>
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={sending}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Send Reset Link
        </button>
      </div>
    </div>
  )
}

// ── Giving & Payment Settings Tab ─────────────────────────────────────────
function GivingSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: {
      bankName: church.giving?.bankName ?? '',
      accountName: church.giving?.accountName ?? '',
      accountNumber: church.giving?.accountNumber ?? '',
      paystackLink: church.giving?.paystackLink ?? '',
      flutterwaveLink: church.giving?.flutterwaveLink ?? '',
      paypalUrl: church.giving?.paypalUrl ?? '',
      stripeLink: church.giving?.stripeLink ?? '',
      customGivingUrl: church.giving?.customGivingUrl ?? '',
      givingInstructions: church.giving?.givingInstructions ?? '',
      preferredMethod: church.giving?.preferredMethod ?? 'bank',
    },
  })

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      const churchRef = doc(db, 'churches', church.id)
      await updateDoc(churchRef, {
        giving: {
          bankName: data.bankName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          paystackLink: data.paystackLink,
          flutterwaveLink: data.flutterwaveLink,
          paypalUrl: data.paypalUrl,
          stripeLink: data.stripeLink,
          customGivingUrl: data.customGivingUrl,
          givingInstructions: data.givingInstructions,
          preferredMethod: data.preferredMethod,
        },
        updatedAt: serverTimestamp(),
      })
      setChurch({ ...church, giving: data })
      toast.success('Giving details updated!')
    } catch {
      toast.error('Failed to update giving details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4 text-xs">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Giving & Payment Destinations</h2>
          <p className="mt-1 text-muted-foreground">
            Configure your ministry receiving accounts. The AI will use these details for giving reminders and campaigns.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="font-semibold">Bank Name</label>
            <input type="text" {...register('bankName')} placeholder="e.g. First Bank of Nigeria" className="flex h-9 w-full rounded-xl border bg-background px-3" />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Account Name</label>
            <input type="text" {...register('accountName')} placeholder="Ministry account name" className="flex h-9 w-full rounded-xl border bg-background px-3" />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Account Number</label>
            <input type="text" {...register('accountNumber')} placeholder="0123456789" className="flex h-9 w-full rounded-xl border bg-background px-3" />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Preferred Method</label>
            <select {...register('preferredMethod')} className="flex h-9 w-full rounded-xl border bg-background px-2">
              <option value="bank">Bank Transfer</option>
              <option value="paystack">Paystack</option>
              <option value="flutterwave">Flutterwave</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
              <option value="custom">Custom Link</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h3 className="font-semibold text-foreground">Online Giving Links (Optional)</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="font-semibold">Paystack Payment Link</label>
              <input type="url" {...register('paystackLink')} placeholder="https://paystack.com/pay/..." className="flex h-9 w-full rounded-xl border bg-background px-3" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Flutterwave Payment Link</label>
              <input type="url" {...register('flutterwaveLink')} placeholder="https://flutterwave.com/pay/..." className="flex h-9 w-full rounded-xl border bg-background px-3" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">PayPal Link</label>
              <input type="url" {...register('paypalUrl')} placeholder="https://paypal.me/..." className="flex h-9 w-full rounded-xl border bg-background px-3" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Stripe Payment Link</label>
              <input type="url" {...register('stripeLink')} placeholder="https://buy.stripe.com/..." className="flex h-9 w-full rounded-xl border bg-background px-3" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold">Custom Giving URL</label>
              <input type="url" {...register('customGivingUrl')} placeholder="https://yourchurch.org/give" className="flex h-9 w-full rounded-xl border bg-background px-3" />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-1">
          <label className="font-semibold">Giving Instructions for Members</label>
          <textarea rows={3} {...register('givingInstructions')} placeholder="e.g. Please include your name and purpose of giving as the payment description." className="flex w-full rounded-xl border bg-background px-3 py-2 resize-none" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Giving Details
        </button>
      </div>
    </form>
  )
}
