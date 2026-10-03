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
// authDomain is not only the name Google's account chooser shows. It decides
// the host that serves Firebase's auth handler at /__/auth/handler, and that
// host becomes the redirect_uri Google's OAuth layer checks. Changing it needs
// three things at once, and missing any one of them breaks sign-in:
//
//   1. the host must serve /__/auth/handler (only Firebase Hosting does);
//   2. it must be listed in Firebase Auth > Settings > Authorized domains;
//   3. its handler URL must be in the OAuth client's authorized redirect URIs
//      in Google Cloud Console, or Google answers redirect_uri_mismatch.
//
// This project's OAuth client is the one Google generated for the project, so
// it only has the trcticket project's own domains registered. helix.firebaseapp.com
// loads the handler but is not registered, and the apex helix.co.tz runs the
// Laravel app on LiteSpeed and answers with the SPA instead of the handler.
// Keep authDomain aligned with the project until those registrations are done.
const firebaseConfig = {
  apiKey: 'AIzaSyCa66ZgPt5xPkqYK-hOrf3y0ChgrXLpyIs',
  authDomain: 'trcticket-b6b01.firebaseapp.com',
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
