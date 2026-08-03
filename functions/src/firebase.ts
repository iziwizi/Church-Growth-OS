import * as admin from 'firebase-admin'
import { initializeApp, getApps } from 'firebase-admin/app'

if (getApps().length === 0) {
  initializeApp()
}

export const db = admin.firestore()
export const auth = admin.auth()
export const storage = admin.storage()

export default admin
