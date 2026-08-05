import { NextResponse } from 'next/server'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export async function POST() {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    const auth = getAuth(app)
    const db = getFirestore(app)

    const email = 'admin@mujteknify.com'
    const password = 'AdminPassword2026!'

    let uid = ''

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      uid = cred.user.uid
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        uid = cred.user.uid
      } else {
        throw err
      }
    }

    if (uid) {
      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email,
          fullName: 'MUJTEKNIFY Platform Super Admin',
          role: 'super_admin',
          churchId: null,
          emailVerified: true,
          status: 'active',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Super Admin user bootstrap successful!',
      credentials: { email, password, uid },
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message ?? 'Failed to bootstrap Super Admin user.',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}
