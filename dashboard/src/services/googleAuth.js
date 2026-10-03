import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import api from './api'

/**
 * Sign in with Google for the dashboard.
 *
 * The browser gets a Firebase ID token from Google, and the API exchanges it for
 * a Helix session token. Helix never sees the Google password, and the token is
 * verified server side before any account is touched.
 */

// Firebase web app configuration (Firebase console > Project settings).
//
// authDomain is the origin that serves Firebase's auth handler at
// /__/auth/handler, and it is what Google's account chooser names when it
// asks the user to continue. It is not just a label: point it at a host that
// does not serve that handler and the popup never completes.
//
// The apex helix.co.tz cannot be used here. It resolves to 184.94.213.218,
// which runs the Laravel app on LiteSpeed, and its /__/auth/handler returns
// the SPA rather than the Firebase handler. Only a host on Firebase Hosting
// can serve it, so the project's Helix Hosting site is used and the chooser
// names Helix instead of the old trcticket project.
const firebaseConfig = {
  apiKey: 'AIzaSyCa66ZgPt5xPkqYK-hOrf3y0ChgrXLpyIs',
  authDomain: 'helix.firebaseapp.com',
  projectId: 'trcticket-b6b01',
  storageBucket: 'trcticket-b6b01.firebasestorage.app',
  messagingSenderId: '841872361333',
  appId: '1:841872361333:web:40e79d57b84fe7b6e1b53c',
}


let authInstance = null

// Set right before a redirect sign-in leaves the page, so the app only reaches
// for Firebase on boot when there is genuinely a redirect to finish.
const REDIRECT_FLAG = 'pharmex_google_redirect'

export function markGoogleRedirectPending() {
  try {
    sessionStorage.setItem(REDIRECT_FLAG, '1')
  } catch {
    // Private mode: the redirect just will not be auto-completed.
  }
}

/** True when this page load could be the return leg of a redirect sign-in. */
export function isGoogleRedirectPending() {
  try {
    return sessionStorage.getItem(REDIRECT_FLAG) === '1'
  } catch {
    return false
  }
}

export function clearGoogleRedirectPending() {
  try {
    sessionStorage.removeItem(REDIRECT_FLAG)
  } catch {
    // Nothing to clean up.
  }
}

function auth() {
  if (!authInstance) {
    authInstance = getAuth(initializeApp(firebaseConfig))
  }
  return authInstance
}

/**
 * Returns a Google ID token for the signed-in user, or throws.
 *
 * Only a popup that was *blocked* falls back to a full page redirect; a popup
 * the user closed on purpose must not hijack the page.
 */
export async function getGoogleIdToken() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  let result
  try {
    result = await signInWithPopup(auth(), provider)
  } catch (error) {
    if (error?.code === 'auth/popup-blocked') {
      markGoogleRedirectPending()
      await signInWithRedirect(auth(), provider)
      // The page navigates away here, so this promise never settles.
      return new Promise(() => {})
    }
    throw error
  }

  const idToken = await result.user.getIdToken()
  if (!idToken) throw new Error('Google did not return an ID token.')
  return idToken
}

/**
 * Finishes a sign-in that was started as a redirect instead of a popup.
 *
 * Firebase stashes the credential in the browser, so this has to run on mount
 * after the page comes back from accounts.google.com. Returns the API payload,
 * or null when there is no redirect to complete.
 */
export async function completeGoogleRedirect() {
  const result = await getRedirectResult(auth())
  if (!result) return null

  const idToken = await result.user.getIdToken()
  if (!idToken) throw new Error('Google did not return an ID token.')

  const response = await api.post('/auth/google', { id_token: idToken })
  return response.data
}

/** Turns a Google ID token into a Helix session and returns the API payload. */
export async function loginWithGoogle() {
  const idToken = await getGoogleIdToken()
  const response = await api.post('/auth/google', { id_token: idToken })
  return response.data
}
