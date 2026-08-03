// ============================================================
// PEOPLE SERVICE — Firestore CRUD for /churches/{churchId}/people
// Unified People Engine: every individual exists only once.
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  type DocumentSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type {
  Person,
  PersonTag,
  PeopleFilterOptions,
  AIEngagementProfile,
} from '@church-growth-os/shared'

// ── Collection reference helper ───────────────────────────────
function peopleCol(churchId: string) {
  return collection(db, 'churches', churchId, 'people')
}

function personDoc(churchId: string, personId: string) {
  return doc(db, 'churches', churchId, 'people', personId)
}

// ── Create ────────────────────────────────────────────────────
export async function createPerson(
  churchId: string,
  data: Omit<Person, 'id' | 'churchId' | 'createdAt' | 'updatedAt' | 'displayName'>,
  createdBy: string
): Promise<Person> {
  const ref = doc(peopleCol(churchId))
  const displayName = `${data.firstName} ${data.lastName}`.trim()
  const now = new Date().toISOString()

  const person: Person = {
    ...data,
    id: ref.id,
    churchId,
    displayName,
    createdAt: now,
    updatedAt: now,
    createdBy,
  }

  await setDoc(ref, {
    ...person,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return person
}

// ── Read one ──────────────────────────────────────────────────
export async function getPerson(churchId: string, personId: string): Promise<Person | null> {
  const snap = await getDoc(personDoc(churchId, personId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Person
}

// ── List with filters ─────────────────────────────────────────
export async function listPeople(
  churchId: string,
  options: PeopleFilterOptions = {}
): Promise<{ people: Person[]; nextCursor?: string }> {
  let q = query(
    peopleCol(churchId),
    orderBy('updatedAt', 'desc'),
    firestoreLimit(options.limit ?? 50)
  )

  // Tag filter — Firestore array-contains for single tag
  if (options.tags?.length === 1) {
    q = query(q, where('tags', 'array-contains', options.tags[0]))
  }

  if (options.followUpStatus) {
    q = query(q, where('followUpStatus', '==', options.followUpStatus))
  }

  if (options.riskLevel) {
    q = query(q, where('aiEngagement.riskLevel', '==', options.riskLevel))
  }

  // Pagination
  if (options.cursor) {
    const cursorSnap = await getDoc(personDoc(churchId, options.cursor))
    if (cursorSnap.exists()) {
      q = query(q, startAfter(cursorSnap as DocumentSnapshot))
    }
  }

  const snapshot = await getDocs(q)
  const people = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Person)

  // Client-side search filter (Firestore doesn't support full-text)
  const filtered = options.searchQuery
    ? people.filter((p) => {
        const term = options.searchQuery!.toLowerCase()
        return (
          p.displayName.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.phone?.includes(term) ||
          p.whatsapp?.includes(term)
        )
      })
    : people

  const lastDoc = snapshot.docs[snapshot.docs.length - 1]
  const nextCursor = snapshot.docs.length === (options.limit ?? 50) ? lastDoc?.id : undefined

  return { people: filtered, nextCursor }
}

// ── Update ────────────────────────────────────────────────────
export async function updatePerson(
  churchId: string,
  personId: string,
  updates: Partial<Omit<Person, 'id' | 'churchId' | 'createdAt'>>,
  updatedBy: string
): Promise<void> {
  const patch: Record<string, unknown> = {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy,
  }

  // Recompute displayName if name fields changed
  if (updates.firstName ?? updates.lastName) {
    const existing = await getPerson(churchId, personId)
    if (existing) {
      patch.displayName = `${updates.firstName ?? existing.firstName} ${updates.lastName ?? existing.lastName}`.trim()
    }
  }

  await updateDoc(personDoc(churchId, personId), patch)
}

// ── Add/Remove Tags ───────────────────────────────────────────
export async function addTag(
  churchId: string,
  personId: string,
  tag: PersonTag,
  updatedBy: string
): Promise<void> {
  const person = await getPerson(churchId, personId)
  if (!person) throw new Error(`Person ${personId} not found`)

  if (person.tags.includes(tag)) return // already tagged

  await updatePerson(churchId, personId, {
    tags: [...person.tags, tag],
    // First tag becomes primaryTag if not set
    primaryTag: person.primaryTag ?? tag,
  }, updatedBy)
}

export async function removeTag(
  churchId: string,
  personId: string,
  tag: PersonTag,
  updatedBy: string
): Promise<void> {
  const person = await getPerson(churchId, personId)
  if (!person) throw new Error(`Person ${personId} not found`)

  const newTags = person.tags.filter((t) => t !== tag)
  const newPrimary = newTags[0] ?? 'member'

  await updatePerson(churchId, personId, {
    tags: newTags,
    primaryTag: newPrimary,
  }, updatedBy)
}

// ── AI Engagement Profile ─────────────────────────────────────
export async function updateEngagementProfile(
  churchId: string,
  personId: string,
  profile: AIEngagementProfile
): Promise<void> {
  await updateDoc(personDoc(churchId, personId), {
    aiEngagement: profile,
    updatedAt: serverTimestamp(),
  })
}

// ── Delete ────────────────────────────────────────────────────
export async function deletePerson(churchId: string, personId: string): Promise<void> {
  await deleteDoc(personDoc(churchId, personId))
}

// ── Statistics ────────────────────────────────────────────────
export async function getPeopleStats(churchId: string): Promise<{
  total: number
  byTag: Partial<Record<PersonTag, number>>
}> {
  const snapshot = await getDocs(peopleCol(churchId))
  const byTag: Partial<Record<PersonTag, number>> = {}

  let total = 0
  for (const d of snapshot.docs) {
    total++
    const person = d.data() as Person
    for (const tag of person.tags) {
      byTag[tag] = (byTag[tag] ?? 0) + 1
    }
  }

  return { total, byTag }
}
