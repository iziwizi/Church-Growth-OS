import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type { Church } from '@church-growth-os/shared'

export async function getUserChurch(userId: string): Promise<Church | null> {
  if (!userId) return null

  try {
    const q = query(
      collection(db, 'churches'),
      where('ownerId', '==', userId),
      limit(1)
    )
    const snap = await getDocs(q)

    if (!snap.empty) {
      const docData = snap.docs[0]!
      return { id: docData.id, ...docData.data() } as Church
    }

    return null
  } catch (error) {
    console.error('Error fetching user church:', error)
    return null
  }
}
