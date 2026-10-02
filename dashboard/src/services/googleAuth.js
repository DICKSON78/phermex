import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import api from './api'

/**
 * Sign in with Google for the dashboard.
 *
 * The browser gets a Firebase ID token from Google, and the API exchanges it for
 * a Helix session token. Helix never sees the Google password, and the token is
 * verified server side before any account is touched.
 */

// Firebase web app configuration (Firebase console > Project settings).
const firebaseConfig = {
  apiKey: 'AIzaSyCa66ZgPt5xPkqYK-hOrf3y0ChgrXLpyIs',
  authDomain: 'trcticket-b6b01.firebaseapp.com',
  projectId: 'trcticket-b6b01',
  storageBucket: 'trcticket-b6b01.firebasestorage.app',
  messagingSenderId: '841872361333',
  appId: '1:841872361333:web:40e79d57b84fe7b6e1b53c',
}

let authInstance = null

function auth() {
  if (!authInstance) {
    authInstance = getAuth(initializeApp(firebaseConfig))
  }
  return authInstance
}

/**
 * Returns a Google ID token for the signed-in user, or throws.
 * Falls back to a redirect flow when a popup is blocked.
 */
export async function getGoogleIdToken() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  let result
  try {
    result = await signInWithPopup(auth(), provider)
  } catch (error) {
    // Popups are blocked in some browsers/embedded webviews; a full page
    // redirect still completes the flow.
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth(), provider)
      return new Promise(() => {})
    }
    throw error
  }

  const idToken = await result.user.getIdToken()
  if (!idToken) throw new Error('Google did not return an ID token.')
  return idToken
}

/** Turns a Google ID token into a Helix session and returns the API payload. */
export async function loginWithGoogle() {
  const idToken = await getGoogleIdToken()
  const response = await api.post('/auth/google', { id_token: idToken })
  return response.data
}
