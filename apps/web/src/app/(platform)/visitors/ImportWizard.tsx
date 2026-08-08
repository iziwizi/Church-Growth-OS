'use client'

import { useState, useCallback, useRef } from 'react'
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
  Users,
  UserCheck,
  Calendar,
  Phone,
  Mail,
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

interface RawRow {
  [key: string]: string
}

interface ParsedVisitor {
  rowIndex: number
  fullName: string
  email: string
  phone: string
  gender: string
  dateOfBirth: string
  visitDate: string
  firstVisitDate: string
  followUpStatus: string
  followUpStage: string
  invitedBy: string
  notes: string
  source: string
  address: string
  status: 'valid' | 'duplicate' | 'error'
  errors: string[]
}

interface Props {
  churchId: string
  onClose: () => void
  onImportComplete: () => void
}

function parseCSV(text: string): { headers: string[]; rows: RawRow[] } {
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

function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/[^\d+]/g, '')
  if (!cleaned) return ''
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '+234' + cleaned.slice(1)
  } else if (!cleaned.startsWith('+') && cleaned.length === 10) {
    cleaned = '+1' + cleaned
  }
  return cleaned
}

function autoDetectField(header: string): string {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (h.includes('name') || h.includes('visitor') || h.includes('person') || h.includes('contact')) return 'fullName'
  if (h.includes('first') && !h.includes('visit')) return 'firstName'
  if (h.includes('last') && !h.includes('visit')) return 'lastName'
  if (h.includes('email') || h.includes('mail')) return 'email'
  if (h.includes('phone') || h.includes('mobile') || h.includes('whatsapp') || h.includes('tel') || h.includes('cell')) return 'phone'
  if (h.includes('gender') || h.includes('sex')) return 'gender'
  if (h.includes('visitdate') || h.includes('datevisited') || h.includes('date') || h.includes('service')) return 'visitDate'
  if (h.includes('firstvisit')) return 'firstVisitDate'
  if (h.includes('followup') || h.includes('stage') || h.includes('status')) return 'followUpStatus'
  if (h.includes('invited') || h.includes('brought') || h.includes('inviter')) return 'invitedBy'
  if (h.includes('note') || h.includes('prayer') || h.includes('comment') || h.includes('detail')) return 'notes'
  if (h.includes('source') || h.includes('channel') || h.includes('howheard')) return 'source'
  if (h.includes('address') || h.includes('street') || h.includes('residence') || h.includes('city')) return 'address'
  return '__ignore__'
}

const VISITOR_FIELDS = [
  { key: '__ignore__', label: '— Ignore Column —' },
  { key: 'fullName', label: 'Full Name *' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'gender', label: 'Gender (Male / Female)' },
  { key: 'visitDate', label: 'Visit Date' },
  { key: 'firstVisitDate', label: 'First Visit Date' },
  { key: 'followUpStatus', label: 'Follow-Up Status' },
  { key: 'invitedBy', label: 'Invited By (Member Name)' },
  { key: 'source', label: 'How They Heard (Walk-in / Social / Friend)' },
  { key: 'address', label: 'Home Address / City' },
  { key: 'notes', label: 'Pastoral Notes / Prayer Needs' },
]

export default function VisitorImportWizard({ churchId, onClose, onImportComplete }: Props) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'summary'>('upload')
  const [pasteData, setPasteData] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [parsedVisitors, setParsedVisitors] = useState<ParsedVisitor[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState({ total: 0, imported: 0, skipped: 0, errors: 0 })
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'duplicate' | 'error'>('all')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = (event.target?.result as string) ?? ''
      processParsedText(text)
    }
    reader.readAsText(file)
  }

  const handlePastedData = () => {
    if (!pasteData.trim()) {
      toast.error('Please paste tabular or CSV text first.')
      return
    }
    processParsedText(pasteData.trim())
  }

  const processParsedText = (text: string) => {
    const { headers: h, rows: r } = parseCSV(text)
    if (h.length === 0 || r.length === 0) {
      toast.error('Could not detect valid data. Please ensure header row is included.')
      return
    }
    setHeaders(h)
    setRawRows(r)

    const initialMap: Record<string, string> = {}
    h.forEach((header) => {
      initialMap[header] = autoDetectField(header)
    })
    setMapping(initialMap)
    setStep('mapping')
  }

  const validateAndBuildPreview = useCallback(async () => {
    const existingVisitors = new Set<string>()

    try {
      // 1. Check existing visitors subcollection
      const visSnap = await getDocs(collection(db, 'churches', churchId, 'visitors'))
      visSnap.docs.forEach((d) => {
        const data = d.data()
        if (data.email) existingVisitors.add(data.email.toLowerCase().trim())
        if (data.phone) existingVisitors.add(normalizePhone(data.phone))
      })

      // 2. Check existing people subcollection
      const peopleSnap = await getDocs(collection(db, 'churches', churchId, 'people'))
      peopleSnap.docs.forEach((d) => {
        const data = d.data()
        if (data.email) existingVisitors.add(data.email.toLowerCase().trim())
        if (data.phone) existingVisitors.add(normalizePhone(data.phone))
      })
    } catch (err) {
      console.warn('Could not check existing records:', err)
    }

    const seenInBatch = new Set<string>()
    const parsed: ParsedVisitor[] = []

    rawRows.forEach((row, idx) => {
      let fullName = ''
      let firstName = ''
      let lastName = ''
      let email = ''
      let phone = ''
      let gender = ''
      let dateOfBirth = ''
      let visitDate = ''
      let firstVisitDate = ''
      let followUpStatus = 'new'
      let followUpStage = 'stage_1'
      let invitedBy = ''
      let notes = ''
      let source = 'Walk-in'
      let address = ''

      Object.entries(mapping).forEach(([header, fieldKey]) => {
        const val = (row[header] ?? '').trim()
        if (fieldKey === 'fullName') fullName = val
        if (fieldKey === 'firstName') firstName = val
        if (fieldKey === 'lastName') lastName = val
        if (fieldKey === 'email') email = val.toLowerCase()
        if (fieldKey === 'phone') phone = val
        if (fieldKey === 'gender') gender = val
        if (fieldKey === 'dateOfBirth') dateOfBirth = val
        if (fieldKey === 'visitDate') visitDate = val
        if (fieldKey === 'firstVisitDate') firstVisitDate = val
        if (fieldKey === 'followUpStatus') followUpStatus = val
        if (fieldKey === 'invitedBy') invitedBy = val
        if (fieldKey === 'notes') notes = val
        if (fieldKey === 'source') source = val
        if (fieldKey === 'address') address = val
      })

      if (!fullName && (firstName || lastName)) {
        fullName = `${firstName} ${lastName}`.trim()
      }

      const errors: string[] = []
      if (!fullName) errors.push('Missing Full Name')

      const cleanPhone = normalizePhone(phone)
      if (phone && !cleanPhone) errors.push('Invalid phone format')

      let status: 'valid' | 'duplicate' | 'error' = 'valid'
      if (errors.length > 0) {
        status = 'error'
      } else {
        const lookupKey = (email || cleanPhone || fullName).toLowerCase()
        if (existingVisitors.has(email) || (cleanPhone && existingVisitors.has(cleanPhone))) {
          status = 'duplicate'
        } else if (seenInBatch.has(lookupKey)) {
          status = 'duplicate'
        } else {
          if (email) seenInBatch.add(email)
          if (cleanPhone) seenInBatch.add(cleanPhone)
        }
      }

      parsed.push({
        rowIndex: idx + 1,
        fullName: fullName || 'Unnamed Visitor',
        email,
        phone: cleanPhone || phone,
        gender,
        dateOfBirth,
        visitDate: visitDate || new Date().toISOString().split('T')[0]!,
        firstVisitDate: firstVisitDate || visitDate || new Date().toISOString().split('T')[0]!,
        followUpStatus: followUpStatus || 'new',
        followUpStage,
        invitedBy,
        notes,
        source,
        address,
        status,
        errors,
      })
    })

    setParsedVisitors(parsed)
    setStep('preview')
  }, [churchId, rawRows, mapping])

  const executeBatchImport = async () => {
    setImporting(true)
    setStep('importing')
    setImportProgress(0)

    const validVisitors = parsedVisitors.filter((v) => v.status === 'valid')
    const totalToImport = validVisitors.length

    if (totalToImport === 0) {
      toast.error('No valid visitor records to import.')
      setImporting(false)
      setStep('preview')
      return
    }

    const CHUNK_SIZE = 400
    let importedCount = 0

    try {
      for (let i = 0; i < totalToImport; i += CHUNK_SIZE) {
        const chunk = validVisitors.slice(i, i + CHUNK_SIZE)
        const batch = writeBatch(db)

        chunk.forEach((visitor) => {
          // Write to unified people subcollection with 'visitor' tag
          const personRef = doc(collection(db, 'churches', churchId, 'people'))
          batch.set(personRef, {
            fullName: visitor.fullName,
            email: visitor.email || null,
            phone: visitor.phone || null,
            gender: visitor.gender || null,
            dateOfBirth: visitor.dateOfBirth || null,
            tags: ['visitor'],
            tag: 'visitor',
            visitDate: visitor.visitDate,
            firstVisitDate: visitor.firstVisitDate,
            followUpStatus: visitor.followUpStatus,
            invitedBy: visitor.invitedBy || null,
            notes: visitor.notes || null,
            source: visitor.source,
            address: visitor.address || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })

          // Also write to dedicated visitors subcollection
          const visitorRef = doc(collection(db, 'churches', churchId, 'visitors'))
          batch.set(visitorRef, {
            fullName: visitor.fullName,
            email: visitor.email || null,
            phone: visitor.phone || null,
            gender: visitor.gender || null,
            visitDate: visitor.visitDate,
            firstVisitDate: visitor.firstVisitDate,
            followUpStatus: visitor.followUpStatus,
            followUpStage: visitor.followUpStage,
            invitedBy: visitor.invitedBy || null,
            notes: visitor.notes || null,
            source: visitor.source,
            address: visitor.address || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        })

        await batch.commit()
        importedCount += chunk.length
        setImportProgress(Math.round((importedCount / totalToImport) * 100))
      }

      await logAuditEvent({
        churchId,
        actorUid: 'admin',
        role: 'admin',
        action: 'MEMBERS_IMPORTED',
        target: 'visitors',
        metadata: { count: importedCount },
      })

      const duplicatesCount = parsedVisitors.filter((v) => v.status === 'duplicate').length
      const errorsCount = parsedVisitors.filter((v) => v.status === 'error').length

      setImportStats({
        total: parsedVisitors.length,
        imported: importedCount,
        skipped: duplicatesCount,
        errors: errorsCount,
      })

      toast.success(`🎉 Successfully imported ${importedCount} first-time visitors!`)
      setStep('summary')
      onImportComplete()
    } catch (err: any) {
      console.error('Visitor batch import error:', err)
      toast.error(`Import failed: ${err.message}`)
      setStep('preview')
    } finally {
      setImporting(false)
    }
  }

  const filteredPreview = parsedVisitors.filter((v) => {
    if (previewFilter === 'all') return true
    return v.status === previewFilter
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border bg-card p-6 shadow-2xl space-y-6 text-xs max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Import First-Time Visitors Wizard
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Upload CSV, TSV, or paste records from spreadsheets for automated guest follow-up.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Steps Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* 1. UPLOAD STEP */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center hover:border-purple-500 hover:bg-purple-500/5 transition-all space-y-3 flex flex-col items-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-foreground text-sm">Choose a CSV or Spreadsheet file</p>
                  <p className="text-muted-foreground text-xs">Supports .csv, .tsv, comma-delimited export</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-foreground">Or Paste Tabular Text directly:</label>
                <textarea
                  rows={5}
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder="Full Name, Phone, Email, Visit Date, Invited By&#10;Brother Samuel, 08012345678, samuel@email.com, 2026-08-03, Sister Mary&#10;Sister Grace, +2349087654321, grace@email.com, 2026-08-03, Social Media"
                  className="w-full rounded-xl border bg-background p-3 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={handlePastedData}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-purple-600 px-4 font-semibold text-white hover:bg-purple-500"
                >
                  <FileText className="h-4 w-4" />
                  Parse Tabular Text
                </button>
              </div>
            </div>
          )}

          {/* 2. MAPPING STEP */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="font-bold text-foreground">Map Imported Columns to Visitor Profile Fields</p>
                <p className="text-[11px] text-muted-foreground">Verify that each detected column matches the correct database attribute.</p>
              </div>

              <div className="space-y-3">
                {headers.map((h) => (
                  <div key={h} className="grid grid-cols-1 gap-2 sm:grid-cols-2 items-center rounded-xl border p-3 bg-card">
                    <div>
                      <p className="font-bold text-foreground">{h}</p>
                      <p className="text-[10px] text-muted-foreground truncate">Sample: {rawRows[0]?.[h] || '—'}</p>
                    </div>
                    <div>
                      <select
                        value={mapping[h] ?? '__ignore__'}
                        onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                        className="w-full h-8 rounded-lg border bg-background px-2 font-semibold text-purple-500"
                      >
                        {VISITOR_FIELDS.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border px-4 font-semibold"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={validateAndBuildPreview}
                  className="inline-flex h-9 items-center gap-1 rounded-xl bg-purple-600 px-5 font-semibold text-white hover:bg-purple-500"
                >
                  Validate &amp; Preview <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* 3. PREVIEW STEP */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('all')}
                    className={`rounded-lg px-2.5 py-1 font-semibold ${
                      previewFilter === 'all' ? 'bg-foreground text-background' : 'border'
                    }`}
                  >
                    All ({parsedVisitors.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('valid')}
                    className={`rounded-lg px-2.5 py-1 font-semibold ${
                      previewFilter === 'valid' ? 'bg-emerald-600 text-white' : 'border text-emerald-600'
                    }`}
                  >
                    Valid ({parsedVisitors.filter((v) => v.status === 'valid').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('duplicate')}
                    className={`rounded-lg px-2.5 py-1 font-semibold ${
                      previewFilter === 'duplicate' ? 'bg-amber-600 text-white' : 'border text-amber-600'
                    }`}
                  >
                    Duplicate ({parsedVisitors.filter((v) => v.status === 'duplicate').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('error')}
                    className={`rounded-lg px-2.5 py-1 font-semibold ${
                      previewFilter === 'error' ? 'bg-rose-600 text-white' : 'border text-rose-600'
                    }`}
                  >
                    Invalid ({parsedVisitors.filter((v) => v.status === 'error').length})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/30 font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Full Name</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Visit Date</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPreview.slice(0, 50).map((v) => (
                      <tr key={v.rowIndex} className="hover:bg-muted/20">
                        <td className="p-2.5 font-mono text-[10px] text-muted-foreground">#{v.rowIndex}</td>
                        <td className="p-2.5 font-bold text-foreground">{v.fullName}</td>
                        <td className="p-2.5 font-mono text-[11px] text-muted-foreground">{v.phone || '—'}</td>
                        <td className="p-2.5 text-muted-foreground">{v.email || '—'}</td>
                        <td className="p-2.5">{v.visitDate}</td>
                        <td className="p-2.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              v.status === 'valid'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : v.status === 'duplicate'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-rose-500/10 text-rose-500'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border px-4 font-semibold"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Mapping
                </button>
                <button
                  type="button"
                  onClick={executeBatchImport}
                  disabled={parsedVisitors.filter((v) => v.status === 'valid').length === 0}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-purple-600 px-6 font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  Confirm &amp; Import ({parsedVisitors.filter((v) => v.status === 'valid').length} Visitors)
                </button>
              </div>
            </div>
          )}

          {/* 4. IMPORTING PROGRESS STEP */}
          {step === 'importing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto" />
              <h3 className="font-display text-base font-bold text-foreground">
                Writing Records to Firestore...
              </h3>
              <p className="text-muted-foreground text-xs">{importProgress}% complete</p>
              <div className="h-2 w-64 rounded-full bg-muted mx-auto overflow-hidden">
                <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${importProgress}%` }} />
              </div>
            </div>
          )}

          {/* 5. SUMMARY STEP */}
          {step === 'summary' && (
            <div className="py-8 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">Import Complete!</h3>
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center">
                <div className="rounded-xl border p-3 bg-muted/20">
                  <p className="text-xl font-bold text-emerald-500">{importStats.imported}</p>
                  <p className="text-[10px] text-muted-foreground">Imported</p>
                </div>
                <div className="rounded-xl border p-3 bg-muted/20">
                  <p className="text-xl font-bold text-amber-500">{importStats.skipped}</p>
                  <p className="text-[10px] text-muted-foreground">Duplicates Skipped</p>
                </div>
                <div className="rounded-xl border p-3 bg-muted/20">
                  <p className="text-xl font-bold text-rose-500">{importStats.errors}</p>
                  <p className="text-[10px] text-muted-foreground">Invalid Rows</p>
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-purple-600 px-6 font-semibold text-white hover:bg-purple-500"
                >
                  Done &amp; View Visitors
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
