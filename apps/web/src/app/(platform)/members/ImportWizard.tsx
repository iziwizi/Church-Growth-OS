'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Download,
  Users,
  ArrowRight,
} from 'lucide-react'
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { toast } from 'sonner'
import { logAuditEvent } from '@/lib/audit/auditLogger'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawRow {
  [key: string]: string
}

interface ParsedPerson {
  rowIndex: number
  fullName: string
  email: string
  phone: string
  tag: string
  branchId: string
  notes: string
  dateOfBirth: string
  status: 'valid' | 'duplicate' | 'error'
  errors: string[]
}

interface Props {
  churchId: string
  onClose: () => void
  onImportComplete: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: RawRow[] } {
  // Detect delimiter
  const firstLine = text.split('\n')[0] ?? ''
  const delimiter =
    firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ','

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length < 2) return { headers: [], rows: [] }

  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0]!)
  const rows: RawRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]!)
    const row: RawRow = {}
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? ''
    })
    rows.push(row)
  }
  return { headers, rows }
}

function autoDetectMapping(headers: string[]): Record<string, string> {
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '')
  const map: Record<string, string> = {
    fullName: '',
    email: '',
    phone: '',
    tag: '',
    branchId: '',
    notes: '',
    dateOfBirth: '',
  }
  const matchers: Record<string, string[]> = {
    fullName: ['fullname', 'name', 'membername', 'firstname', 'full name', 'person'],
    email: ['email', 'emailaddress', 'mail'],
    phone: ['phone', 'phonenumber', 'mobile', 'whatsapp', 'tel'],
    tag: ['tag', 'role', 'type', 'category', 'membertype'],
    branchId: ['branch', 'branchid', 'campus', 'location'],
    notes: ['notes', 'note', 'comment', 'remarks', 'group', 'ministry'],
    dateOfBirth: ['dateofbirth', 'dob', 'birthday', 'birthdate', 'born'],
  }
  headers.forEach((h) => {
    const norm = normalize(h)
    for (const [field, patterns] of Object.entries(matchers)) {
      if (patterns.some((p) => normalize(p) === norm || normalize(p).includes(norm) || norm.includes(normalize(p)))) {
        if (!map[field]) map[field] = h
      }
    }
  })
  return map
}

const CSV_TEMPLATE = `Full Name,Email,Phone,Tag,Branch,Notes,Date of Birth
Brother John Mark,john@church.org,+234 800 000 0001,member,main,Choir,1990-05-12
Sister Grace Eze,grace@church.org,+234 800 000 0002,worker,main,Ushering,1985-03-20
Pastor James Adeyemi,james@church.org,+234 802 000 0003,leader,main,Senior Leadership,1978-11-30
Visitor Taiwo Okonkwo,,+234 803 000 0004,visitor,main,,`

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'church-members-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportWizard({ churchId, onClose, onImportComplete }: Props) {
  const [step, setStep] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [parsedPeople, setParsedPeople] = useState<ParsedPerson[]>([])
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null)
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set())
  const [existingPhones, setExistingPhones] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Step 1: Parse CSV ──────────────────────────────────────────────────────

  const handleFileLoad = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please upload a CSV file (.csv)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5 MB.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers: h, rows: r } = parseCSV(text)
      if (h.length === 0) {
        toast.error('Could not parse CSV. Ensure the file has a header row.')
        return
      }
      setHeaders(h)
      setRawRows(r)
      setMapping(autoDetectMapping(h))
    }
    reader.readAsText(file)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileLoad(file)
    },
    [handleFileLoad]
  )

  // ── Step 2 → 3: Validate & Detect Duplicates ──────────────────────────────

  const runValidation = async () => {
    setImporting(true)
    try {
      // Load existing people from Firestore for duplicate detection
      const snap = await getDocs(collection(db, 'churches', churchId, 'people')).catch(() => null)
      const emails = new Set<string>()
      const phones = new Set<string>()
      snap?.docs.forEach((d) => {
        const data = d.data()
        if (data.email) emails.add(data.email.toLowerCase().trim())
        if (data.phone) phones.add(data.phone.replace(/\s/g, ''))
      })
      setExistingEmails(emails)
      setExistingPhones(phones)

      const getName = (row: RawRow) => (mapping.fullName ? row[mapping.fullName] ?? '' : '').trim()
      const getEmail = (row: RawRow) => (mapping.email ? row[mapping.email] ?? '' : '').trim()
      const getPhone = (row: RawRow) => (mapping.phone ? row[mapping.phone] ?? '' : '').trim()
      const getTag = (row: RawRow) => (mapping.tag ? row[mapping.tag] ?? '' : 'member').trim().toLowerCase() || 'member'
      const getBranch = (row: RawRow) => (mapping.branchId ? row[mapping.branchId] ?? '' : 'main').trim() || 'main'
      const getNotes = (row: RawRow) => (mapping.notes ? row[mapping.notes] ?? '' : '').trim()
      const getDOB = (row: RawRow) => (mapping.dateOfBirth ? row[mapping.dateOfBirth] ?? '' : '').trim()

      const parsed: ParsedPerson[] = rawRows.map((row, idx) => {
        const errors: string[] = []
        const fullName = getName(row)
        const email = getEmail(row)
        const phone = getPhone(row)

        if (!fullName) errors.push('Full Name is required')
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format')

        const isDuplicate =
          (email && emails.has(email.toLowerCase())) ||
          (phone && phones.has(phone.replace(/\s/g, '')))

        let status: ParsedPerson['status'] = 'valid'
        if (errors.length > 0) status = 'error'
        else if (isDuplicate) status = 'duplicate'

        return {
          rowIndex: idx + 2,
          fullName,
          email,
          phone,
          tag: getTag(row),
          branchId: getBranch(row),
          notes: getNotes(row),
          dateOfBirth: getDOB(row),
          status,
          errors,
        }
      })

      setParsedPeople(parsed)
      setStep(3)
    } catch (err) {
      toast.error('Validation failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  // ── Step 4 → 5: Import ────────────────────────────────────────────────────

  const runImport = async () => {
    setImporting(true)
    try {
      const toImport = parsedPeople.filter((p) => {
        if (p.status === 'error') return false
        if (p.status === 'duplicate' && skipDuplicates) return false
        return true
      })

      let imported = 0
      let errors = 0
      const BATCH_SIZE = 499

      for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
        const chunk = toImport.slice(i, i + BATCH_SIZE)
        const batch = writeBatch(db)
        for (const person of chunk) {
          const ref = doc(collection(db, 'churches', churchId, 'people'))
          batch.set(ref, {
            fullName: person.fullName,
            email: person.email || '',
            phone: person.phone || '',
            tags: [person.tag],
            branchId: person.branchId,
            notes: person.notes,
            dateOfBirth: person.dateOfBirth || '',
            churchId,
            engagementScore: 75,
            importedViaCSV: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
          imported++
        }
        await batch.commit()
      }

      const skipped = parsedPeople.filter(
        (p) => p.status === 'duplicate' && skipDuplicates
      ).length
      const errCount = parsedPeople.filter((p) => p.status === 'error').length

      setImportResult({ imported, skipped: skipped + errCount, errors: errCount })
      setStep(5)
      toast.success(`✅ Successfully imported ${imported} records!`)
    } catch (err: any) {
      toast.error(err.message ?? 'Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  // ── Counts ─────────────────────────────────────────────────────────────────

  const validCount = parsedPeople.filter((p) => p.status === 'valid').length
  const dupCount = parsedPeople.filter((p) => p.status === 'duplicate').length
  const errorCount = parsedPeople.filter((p) => p.status === 'error').length
  const willImport = parsedPeople.filter((p) => {
    if (p.status === 'error') return false
    if (p.status === 'duplicate' && skipDuplicates) return false
    return true
  }).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-foreground">
                Bulk Import — Members & Visitors
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Step {step} of 5
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex border-b">
          {['Upload', 'Map', 'Validate', 'Preview', 'Done'].map((label, idx) => (
            <div
              key={label}
              className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition-colors ${
                step === idx + 1
                  ? 'bg-brand-500/10 text-brand-500 border-b-2 border-brand-500'
                  : step > idx + 1
                  ? 'text-emerald-500'
                  : 'text-muted-foreground'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Upload ─────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground">Upload your CSV file</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Supports comma, semicolon, or tab-delimited CSV files. Max 5 MB.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Template
                  </button>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer py-12 transition-all ${
                    isDragging
                      ? 'border-brand-500 bg-brand-500/10'
                      : fileName
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-border bg-muted/10 hover:bg-muted/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileLoad(f)
                    }}
                  />
                  {fileName ? (
                    <>
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">{fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {rawRows.length} rows detected · {headers.length} columns
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">
                          {isDragging ? 'Drop your CSV here' : 'Drag & drop or click to upload'}
                        </p>
                        <p className="text-xs text-muted-foreground">CSV files only (.csv)</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs space-y-1.5">
                  <p className="font-bold text-foreground">Required column:</p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Full Name</span> — any other header name that clearly means &quot;name&quot; will be auto-detected
                  </p>
                  <p className="font-bold text-foreground mt-2">Optional columns (auto-detected):</p>
                  <p className="text-muted-foreground">Email · Phone · Tag (member/worker/visitor/leader) · Branch · Notes · Date of Birth</p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Map Columns ─────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">Map your CSV columns</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We auto-detected the following mappings from your headers. Adjust if needed.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { field: 'fullName', label: 'Full Name', required: true },
                    { field: 'email', label: 'Email Address', required: false },
                    { field: 'phone', label: 'Phone / WhatsApp', required: false },
                    { field: 'tag', label: 'Tag / Role', required: false },
                    { field: 'branchId', label: 'Branch / Campus', required: false },
                    { field: 'notes', label: 'Notes / Ministry Group', required: false },
                    { field: 'dateOfBirth', label: 'Date of Birth', required: false },
                  ].map(({ field, label, required }) => (
                    <div key={field} className="flex items-center gap-3 rounded-xl border bg-muted/10 p-3">
                      <div className="w-40 shrink-0">
                        <span className="font-semibold text-foreground">{label}</span>
                        {required && <span className="ml-1 text-rose-500">*</span>}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <select
                        value={mapping[field] ?? ''}
                        onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                        className="flex-1 rounded-xl border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">(Skip this field)</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Validation Results ──────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">Validation Complete</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rawRows.length} rows parsed from <span className="font-semibold text-foreground">{fileName}</span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-1">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                    <p className="font-display text-2xl font-bold text-emerald-500">{validCount}</p>
                    <p className="text-muted-foreground font-semibold">Ready to Import</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center space-y-1">
                    <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
                    <p className="font-display text-2xl font-bold text-amber-500">{dupCount}</p>
                    <p className="text-muted-foreground font-semibold">Duplicates Found</p>
                  </div>
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center space-y-1">
                    <AlertCircle className="h-6 w-6 text-rose-500 mx-auto" />
                    <p className="font-display text-2xl font-bold text-rose-500">{errorCount}</p>
                    <p className="text-muted-foreground font-semibold">Errors (Skipped)</p>
                  </div>
                </div>

                {dupCount > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-2">
                    <p className="font-bold text-amber-600">Duplicate records detected</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSkipDuplicates(true)}
                        className={`h-7 px-3 rounded-lg font-semibold text-[11px] ${skipDuplicates ? 'bg-amber-500 text-white' : 'border bg-background text-muted-foreground'}`}
                      >
                        Skip Duplicates (Recommended)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkipDuplicates(false)}
                        className={`h-7 px-3 rounded-lg font-semibold text-[11px] ${!skipDuplicates ? 'bg-brand-500 text-white' : 'border bg-background text-muted-foreground'}`}
                      >
                        Import Anyway (Create New Records)
                      </button>
                    </div>
                  </div>
                )}

                {errorCount > 0 && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs space-y-1.5 max-h-36 overflow-y-auto">
                    <p className="font-bold text-rose-500">Rows with errors (will be skipped):</p>
                    {parsedPeople
                      .filter((p) => p.status === 'error')
                      .map((p) => (
                        <div key={p.rowIndex} className="text-muted-foreground">
                          Row {p.rowIndex}: {p.errors.join(', ')}
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 4: Preview ─────────────────────────────────────────── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold text-foreground">Preview & Confirm</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-bold text-brand-500">{willImport} records</span> will be imported
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border overflow-hidden max-h-80 overflow-y-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Tag</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedPeople.map((p) => (
                        <tr
                          key={p.rowIndex}
                          className={`transition-colors ${
                            p.status === 'error'
                              ? 'bg-rose-500/5'
                              : p.status === 'duplicate'
                              ? 'bg-amber-500/5'
                              : 'hover:bg-muted/20'
                          }`}
                        >
                          <td className="p-2.5 font-semibold text-foreground">
                            {p.fullName || <span className="text-rose-500 italic">Missing</span>}
                          </td>
                          <td className="p-2.5 text-muted-foreground">{p.email || '—'}</td>
                          <td className="p-2.5 text-muted-foreground">{p.phone || '—'}</td>
                          <td className="p-2.5">
                            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-500 capitalize">
                              {p.tag}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {p.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                                <CheckCircle2 className="h-3 w-3" /> Import
                              </span>
                            )}
                            {p.status === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                <AlertTriangle className="h-3 w-3" /> {skipDuplicates ? 'Skip' : 'Import'}
                              </span>
                            )}
                            {p.status === 'error' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500">
                                <AlertCircle className="h-3 w-3" /> Skip
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: Done ─────────────────────────────────────────────── */}
            {step === 5 && importResult && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-5 py-8 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">Import Complete!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your congregation database has been updated.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 w-full text-xs">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
                    <p className="font-display text-2xl font-bold text-emerald-500">{importResult.imported}</p>
                    <p className="text-muted-foreground font-semibold">Imported</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1">
                    <p className="font-display text-2xl font-bold text-amber-500">{importResult.skipped}</p>
                    <p className="text-muted-foreground font-semibold">Skipped</p>
                  </div>
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-1">
                    <p className="font-display text-2xl font-bold text-rose-500">{importResult.errors}</p>
                    <p className="text-muted-foreground font-semibold">Errors</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <button
            type="button"
            onClick={() => {
              if (step === 1) onClose()
              else setStep((s) => s - 1)
            }}
            disabled={importing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-xs font-semibold text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step === 5 ? (
            <button
              type="button"
              onClick={() => {
                onImportComplete()
                onClose()
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500"
            >
              <CheckCircle2 className="h-4 w-4" />
              Done — View Directory
            </button>
          ) : step === 4 ? (
            <button
              type="button"
              onClick={runImport}
              disabled={importing || willImport === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing ? 'Importing…' : `Import ${willImport} Records`}
            </button>
          ) : step === 3 ? (
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={validCount === 0 && dupCount === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              Preview Records
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : step === 2 ? (
            <button
              type="button"
              onClick={runValidation}
              disabled={!mapping.fullName || importing}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Validate & Detect Duplicates
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!rawRows.length) {
                  toast.error('Please upload a CSV file first')
                  return
                }
                setStep(2)
              }}
              disabled={!fileName || rawRows.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              Map Columns
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
