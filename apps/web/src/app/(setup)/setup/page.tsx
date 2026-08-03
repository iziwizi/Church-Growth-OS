'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Church,
  Palette,
  Brain,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/client'
import { uploadService } from '@/lib/upload'

// ── Step definitions ──────────────────────────────────────────
const STEPS = [
  { id: 1, title: 'Church Profile',     icon: Church,       desc: 'Name, slug, and description' },
  { id: 2, title: 'Branding',           icon: Palette,      desc: 'Logo, colors, and timezone' },
  { id: 3, title: 'AI Settings',        icon: Brain,        desc: 'AI provider and automation mode' },
  { id: 4, title: 'Communications',     icon: MessageSquare, desc: 'WhatsApp, Email, and SMS' },
  { id: 5, title: 'Ready!',             icon: CheckCircle2, desc: 'You are all set' },
]

// ── Step 1 Schema ─────────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(3, 'Church name must be at least 3 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(30, 'Slug must be 30 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  timezone: z.string().min(1, 'Timezone is required'),
})

// ── Step 3 Schema ─────────────────────────────────────────────
const step3Schema = z.object({
  aiProvider: z.enum(['claude', 'openai', 'deepseek']),
  aiMode: z.enum(['autonomous', 'approval']),
})

type Step1Data = z.infer<typeof step1Schema>
type Step3Data = z.infer<typeof step3Schema>

interface SetupData {
  step1: Partial<Step1Data>
  step2: { logoUrl?: string; primaryColor: string; secondaryColor: string }
  step3: Partial<Step3Data>
  step4: { whatsappProvider?: string; emailProvider?: string; smsProvider?: string }
}

// ── Step Progress Indicator ───────────────────────────────────
function SetupProgress({ currentStep, steps }: { currentStep: number; steps: typeof STEPS }) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((step, i) => {
        const Icon = step.icon
        const isDone = currentStep > step.id
        const isCurrent = currentStep === step.id
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                isDone
                  ? 'bg-brand-500 text-white'
                  : isCurrent
                  ? 'bg-white text-brand-600 ring-2 ring-brand-400'
                  : 'bg-white/10 text-white/40'
              }`}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-8 transition-all ${
                  isDone ? 'bg-brand-400' : 'bg-white/20'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main Wizard Component ─────────────────────────────────────
export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [setupData, setSetupData] = useState<SetupData>({
    step1: {},
    step2: { primaryColor: '#6366f1', secondaryColor: '#8b5cf6' },
    step3: {},
    step4: { whatsappProvider: 'meta_cloud', emailProvider: 'resend', smsProvider: 'termii' },
  })

  // ── Step 1 form ────────────────────────────────────────────
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { country: 'NG', timezone: 'Africa/Lagos' },
  })

  // ── Step 3 form ────────────────────────────────────────────
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { aiProvider: 'claude', aiMode: 'autonomous' },
  })

  // Auto-generate slug from church name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30)
    step1Form.setValue('slug', slug)
  }

  // Logo file selection
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

  // ── Complete setup ─────────────────────────────────────────
  const completeSetup = async () => {
    const user = auth.currentUser
    if (!user) {
      toast.error('You must be signed in to complete setup')
      router.push('/login')
      return
    }

    setSaving(true)

    try {
      // Upload logo if selected
      let logoUrl = ''
      if (logoFile) {
        setUploading(true)
        const result = await uploadService.upload(logoFile, {
          folder: `churches/${user.uid}/logos`,
          allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
          maxBytes: 5 * 1024 * 1024,
          tags: ['church_logo'],
        })
        logoUrl = result.url
        setUploading(false)
      }

      // Generate a churchId from slug
      const churchId = `${setupData.step1.slug}-${user.uid.slice(0, 6)}`

      // Write church document to Firestore
      await setDoc(doc(db, 'churches', churchId), {
        id: churchId,
        name: setupData.step1.name,
        slug: setupData.step1.slug,
        description: setupData.step1.description ?? '',
        plan: 'trial',
        status: 'active',
        ownerId: user.uid,
        branding: {
          logoUrl,
          primaryColor: setupData.step2.primaryColor,
          secondaryColor: setupData.step2.secondaryColor,
          timezone: setupData.step1.timezone ?? 'Africa/Lagos',
          country: setupData.step1.country ?? 'NG',
          currency: 'NGN',
        },
        settings: {
          communicationProviders: {
            whatsapp: { provider: setupData.step4.whatsappProvider ?? 'meta_cloud', config: {}, isActive: false },
            email: { provider: setupData.step4.emailProvider ?? 'resend', config: {}, isActive: false },
            sms: { provider: setupData.step4.smsProvider ?? 'termii', config: {}, isActive: false },
          },
          aiProvider: setupData.step3.aiProvider ?? 'claude',
          aiMode: setupData.step3.aiMode ?? 'autonomous',
          featureFlags: {
            ai_studio: true,
            automation: true,
            communications_whatsapp: true,
            communications_sms: true,
          },
          automationEnabled: true,
          approvalRequired: setupData.step3.aiMode === 'approval',
        },
        metrics: { totalMembers: 0, totalVisitors: 0, totalDonations: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      toast.success('🎉 Church setup complete! Welcome to Church Growth OS.')
      router.push('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Setup failed'
      toast.error(message)
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  // ── Step navigation ────────────────────────────────────────
  const goNext = async () => {
    if (currentStep === 1) {
      const valid = await step1Form.trigger()
      if (!valid) return
      setSetupData((d) => ({ ...d, step1: step1Form.getValues() }))
    }
    if (currentStep === 3) {
      const valid = await step3Form.trigger()
      if (!valid) return
      setSetupData((d) => ({ ...d, step3: step3Form.getValues() }))
    }
    if (currentStep === 4) {
      await completeSetup()
      return
    }
    setCurrentStep((s) => Math.min(s + 1, 5))
  }

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const currentStepData = STEPS[currentStep - 1]!

  return (
    <div className="w-full max-w-2xl">
      <SetupProgress currentStep={currentStep} steps={STEPS} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm"
        >
          {/* Step Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
              {currentStepData.icon && <currentStepData.icon className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-brand-400">
                Step {currentStep} of {STEPS.length}
              </p>
              <h2 className="font-display text-xl font-bold text-white">{currentStepData.title}</h2>
            </div>
          </div>

          {/* ── Step 1: Church Profile ─────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80">Church Name *</label>
                <input
                  type="text"
                  placeholder="Grace Fellowship Church"
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                  {...step1Form.register('name', { onChange: (e) => handleNameChange(e.target.value) })}
                />
                {step1Form.formState.errors.name && (
                  <p className="text-xs text-red-400">{step1Form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80">
                  Church Slug (URL) *
                  <span className="ml-2 text-xs text-white/40">auto-generated from name</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/40">churchgrowth.os/</span>
                  <input
                    type="text"
                    placeholder="grace-fellowship"
                    className="flex h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                    {...step1Form.register('slug')}
                  />
                </div>
                {step1Form.formState.errors.slug && (
                  <p className="text-xs text-red-400">{step1Form.formState.errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80">Church Description (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe your church's vision and mission..."
                  className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 resize-none"
                  {...step1Form.register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Country *</label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:border-brand-400 focus:outline-none appearance-none"
                    {...step1Form.register('country')}
                  >
                    <option value="NG" className="bg-gray-900">Nigeria</option>
                    <option value="GH" className="bg-gray-900">Ghana</option>
                    <option value="KE" className="bg-gray-900">Kenya</option>
                    <option value="ZA" className="bg-gray-900">South Africa</option>
                    <option value="UG" className="bg-gray-900">Uganda</option>
                    <option value="TZ" className="bg-gray-900">Tanzania</option>
                    <option value="US" className="bg-gray-900">United States</option>
                    <option value="GB" className="bg-gray-900">United Kingdom</option>
                    <option value="CA" className="bg-gray-900">Canada</option>
                    <option value="AU" className="bg-gray-900">Australia</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Timezone *</label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:border-brand-400 focus:outline-none appearance-none"
                    {...step1Form.register('timezone')}
                  >
                    <option value="Africa/Lagos" className="bg-gray-900">Africa/Lagos (WAT)</option>
                    <option value="Africa/Accra" className="bg-gray-900">Africa/Accra (GMT)</option>
                    <option value="Africa/Nairobi" className="bg-gray-900">Africa/Nairobi (EAT)</option>
                    <option value="Africa/Johannesburg" className="bg-gray-900">Africa/Johannesburg (SAST)</option>
                    <option value="America/New_York" className="bg-gray-900">America/New_York (EST)</option>
                    <option value="America/Los_Angeles" className="bg-gray-900">America/Los_Angeles (PST)</option>
                    <option value="Europe/London" className="bg-gray-900">Europe/London (GMT)</option>
                    <option value="Australia/Sydney" className="bg-gray-900">Australia/Sydney (AEST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Branding ─────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80">Church Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-20 w-20 rounded-xl object-cover ring-2 ring-brand-400"
                      />
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5">
                      <Upload className="h-6 w-6 text-white/30" />
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {logoPreview ? 'Change logo' : 'Upload logo'}
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoSelect}
                    />
                    <p className="mt-1 text-xs text-white/40">PNG, JPG, WebP, SVG — max 5 MB</p>
                  </div>
                </div>
              </div>

              {/* Brand Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={setupData.step2.primaryColor}
                      onChange={(e) =>
                        setSetupData((d) => ({
                          ...d,
                          step2: { ...d.step2, primaryColor: e.target.value },
                        }))
                      }
                      className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
                    />
                    <input
                      type="text"
                      value={setupData.step2.primaryColor}
                      onChange={(e) =>
                        setSetupData((d) => ({
                          ...d,
                          step2: { ...d.step2, primaryColor: e.target.value },
                        }))
                      }
                      className="flex h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={setupData.step2.secondaryColor}
                      onChange={(e) =>
                        setSetupData((d) => ({
                          ...d,
                          step2: { ...d.step2, secondaryColor: e.target.value },
                        }))
                      }
                      className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
                    />
                    <input
                      type="text"
                      value={setupData.step2.secondaryColor}
                      onChange={(e) =>
                        setSetupData((d) => ({
                          ...d,
                          step2: { ...d.step2, secondaryColor: e.target.value },
                        }))
                      }
                      className="flex h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Brand Preview</p>
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <img src={logoPreview} alt="logo" className="h-10 w-10 rounded-lg object-cover" />
                  )}
                  <div
                    className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white text-center"
                    style={{ background: `linear-gradient(135deg, ${setupData.step2.primaryColor}, ${setupData.step2.secondaryColor})` }}
                  >
                    {setupData.step1.name ?? 'Your Church Name'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: AI Settings ───────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* AI Provider */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80">AI Provider</label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { value: 'claude', label: 'Claude', sub: 'Anthropic (Recommended)', emoji: '🧠' },
                      { value: 'openai', label: 'GPT-4o', sub: 'OpenAI', emoji: '⚡' },
                      { value: 'deepseek', label: 'DeepSeek', sub: 'Budget option', emoji: '🔍' },
                    ] as const
                  ).map((opt) => {
                    const selected = step3Form.watch('aiProvider') === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => step3Form.setValue('aiProvider', opt.value)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          selected
                            ? 'border-brand-400 bg-brand-500/20 ring-2 ring-brand-400/30'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-2xl">{opt.emoji}</div>
                        <div className="mt-2 font-semibold text-white text-sm">{opt.label}</div>
                        <div className="text-xs text-white/50">{opt.sub}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* AI Mode */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80">Automation Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        value: 'autonomous',
                        label: '🤖 Autonomous',
                        desc: 'AI acts automatically. Dashboard reports what was done.',
                        recommended: true,
                      },
                      {
                        value: 'approval',
                        label: '✋ Approval Mode',
                        desc: 'AI drafts content. You review and approve before sending.',
                        recommended: false,
                      },
                    ] as const
                  ).map((opt) => {
                    const selected = step3Form.watch('aiMode') === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => step3Form.setValue('aiMode', opt.value)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          selected
                            ? 'border-brand-400 bg-brand-500/20 ring-2 ring-brand-400/30'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-semibold text-white text-sm">{opt.label}</div>
                        {opt.recommended && (
                          <span className="mt-1 inline-block rounded-full bg-brand-500/30 px-2 py-0.5 text-xs text-brand-300">
                            Recommended
                          </span>
                        )}
                        <p className="mt-2 text-xs text-white/50">{opt.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Communication Providers ──────────────── */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-white/60">
                Select your preferred providers. You can configure API keys in Settings after setup.
              </p>

              {[
                {
                  label: '📱 WhatsApp Provider',
                  key: 'whatsappProvider' as const,
                  options: [
                    { value: 'meta_cloud', label: 'Meta Cloud API', sub: 'Official — recommended' },
                    { value: 'ultramsg', label: 'UltraMsg', sub: 'Easy setup' },
                    { value: 'whatsapp_business', label: 'WhatsApp Business', sub: 'For existing accounts' },
                  ],
                },
                {
                  label: '📧 Email Provider',
                  key: 'emailProvider' as const,
                  options: [
                    { value: 'resend', label: 'Resend', sub: 'Modern & fast — recommended' },
                    { value: 'mailchimp', label: 'Mailchimp', sub: 'Popular choice' },
                    { value: 'sendgrid', label: 'SendGrid', sub: 'Enterprise grade' },
                  ],
                },
                {
                  label: '💬 SMS Provider',
                  key: 'smsProvider' as const,
                  options: [
                    { value: 'termii', label: 'Termii', sub: 'Africa-focused — recommended' },
                    { value: 'africas_talking', label: "Africa's Talking", sub: 'Multi-country Africa' },
                    { value: 'twilio', label: 'Twilio', sub: 'Global coverage' },
                  ],
                },
              ].map(({ label, key, options }) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-white/80">{label}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {options.map((opt) => {
                      const selected = setupData.step4[key] === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setSetupData((d) => ({
                              ...d,
                              step4: { ...d.step4, [key]: opt.value },
                            }))
                          }
                          className={`rounded-xl border p-3 text-left transition-all ${
                            selected
                              ? 'border-brand-400 bg-brand-500/20'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-xs font-semibold text-white">{opt.label}</div>
                          <div className="mt-0.5 text-xs text-white/40">{opt.sub}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 5: Done! ────────────────────────────────── */}
          {currentStep === 5 && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20">
                <CheckCircle2 className="h-8 w-8 text-brand-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">You&apos;re all set!</h3>
                <p className="mt-2 text-sm text-white/60">
                  Your church profile has been created. The AI is already working in the background.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />
                  <span>Church profile saved to Firestore</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />
                  <span>AI Engine activated in {setupData.step3.aiMode ?? 'autonomous'} mode</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />
                  <span>Communication providers configured</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Brain className="h-4 w-4 text-yellow-400 shrink-0" />
                  <span>Add your API keys in Settings to enable sending</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ────────────────────────────── */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-70"
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : currentStep === 4 ? (
                <>
                  Complete Setup
                  <CheckCircle2 className="h-4 w-4" />
                </>
              ) : currentStep === 5 ? (
                <>
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
