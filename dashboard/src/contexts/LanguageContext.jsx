import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from '../i18n/en'
import sw from '../i18n/sw'

function deepMerge(base, extra) {
  const out = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    const current = out[key]
    const isObject = value && typeof value === 'object' && !Array.isArray(value)
    const baseIsObject = current && typeof current === 'object' && !Array.isArray(current)
    out[key] = isObject && baseIsObject ? deepMerge(current, value) : value
  }
  return out
}

// Per-page groups live in their own files under i18n/extra/ so pages can be
// translated independently without three edits to en.js/sw.js colliding.
function collectExtra(files) {
  return Object.values(files).map((mod) => mod.default ?? mod).filter(Boolean)
}

const dictionaries = {
  en: collectExtra(import.meta.glob('../i18n/extra/*.en.js', { eager: true })).reduce(deepMerge, en),
  sw: collectExtra(import.meta.glob('../i18n/extra/*.sw.js', { eager: true })).reduce(deepMerge, sw),
}

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
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore write failures
    }
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

  const setLang = useCallback((next) => {
    if (dictionaries[next]) setLangState(next)
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'sw' : 'en'))
  }, [])

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