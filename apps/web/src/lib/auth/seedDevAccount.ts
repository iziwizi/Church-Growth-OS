import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'

export const DEV_ADMIN_EMAIL = 'admin@churchgrowthos.local'
export const DEV_ADMIN_PASSWORD = 'Admin@12345'
export const DEV_CHURCH_ID = 'grace-fellowship-dev'

export async function seedDevAccountAndChurch(): Promise<{ uid: string; churchId: string }> {
  let user = auth.currentUser

  if (!user) {
    try {
      // Attempt sign in first
      const cred = await signInWithEmailAndPassword(auth, DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD)
      user = cred.user
    } catch {
      // Create user if not existing
      const cred = await createUserWithEmailAndPassword(auth, DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD)
      user = cred.user
      await updateProfile(user, { displayName: 'Pastor Admin' })
    }
  }

  // Ensure user doc exists in /users
  const userDocRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userDocRef)
  if (!userSnap.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: DEV_ADMIN_EMAIL,
      displayName: 'Pastor Admin',
      churchMemberships: [
        {
          churchId: DEV_CHURCH_ID,
          role: 'owner',
          joinedAt: serverTimestamp(),
          status: 'active',
        },
      ],
      createdAt: serverTimestamp(),
    })
  }

  // Ensure default dev church exists in /churches
  const churchDocRef = doc(db, 'churches', DEV_CHURCH_ID)
  const churchSnap = await getDoc(churchDocRef)

  if (!churchSnap.exists()) {
    await setDoc(churchDocRef, {
      id: DEV_CHURCH_ID,
      name: 'Grace Fellowship Church',
      slug: 'grace-fellowship',
      description: 'Dev seed church for Church Growth OS automated growth engine',
      plan: 'enterprise',
      status: 'active',
      ownerId: user.uid,
      branding: {
        logoUrl: '',
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        timezone: 'Africa/Lagos',
        country: 'NG',
        currency: 'NGN',
      },
      settings: {
        communicationProviders: {
          whatsapp: { provider: 'meta_cloud', config: {}, isActive: true },
          email: { provider: 'resend', config: {}, isActive: true },
          sms: { provider: 'termii', config: {}, isActive: true },
        },
        aiProvider: 'claude',
        aiMode: 'autonomous',
        featureFlags: {
          ai_studio: true,
          automation: true,
          communications_whatsapp: true,
          communications_sms: true,
          donations: true,
          live_service: true,
        },
        automationEnabled: true,
        approvalRequired: false,
      },
      metrics: {
        totalMembers: 318,
        totalVisitors: 94,
        totalDonations: 2400000,
        lastUpdated: serverTimestamp(),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  return { uid: user.uid, churchId: DEV_CHURCH_ID }
}
