import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from '../i18n/en'
import sw from '../i18n/sw'

const dictionaries = { en, sw }

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili' },
]

const STORAGE_KEY = 'helix_lang'

const LanguageContext = createContext(null)

function detectInitialLanguage() {
  if (typeof window === 'undefined') return 'en'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && dictionaries[saved]) return saved
  } catch {
    // localStorage unavailable (private mode) — fall through to browser detection
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : ''
  if (/^sw/i.test(nav)) return 'sw'
  return 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Keep the dashboard in step when the language is changed on the website.
  useEffect(() => {
    function onStorage(event) {
      if (event.key !== STORAGE_KEY) return
      const next = event.newValue
      if (next && dictionaries[next]) setLangState(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /**
   * Persist and broadcast only on an explicit choice. Writing on mount would
   * make every newly opened tab overwrite the language the user picked.
   */
  const persist = useCallback((next) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore write failures
    }
    // Same-origin tabs (login/dashboard) listen for this.
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: next }))
  }, [])

  const setLang = useCallback(
    (next) => {
      if (!dictionaries[next]) return
      setLangState(next)
      persist(next)
    },
    [persist]
  )

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'en' ? 'sw' : 'en'
      persist(next)
      return next
    })
  }, [persist])

  const t = useCallback(
    (path, fallback) => {
      const value = path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), dictionaries[lang])
      if (typeof value === 'string') return value
      return fallback !== undefined ? fallback : path
    },
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    // Render outside a provider without crashing — fall back to English.
    return { lang: 'en', setLang: () => {}, toggleLang: () => {}, t: (p) => p, languages: LANGUAGES }
  }
  return ctx
}