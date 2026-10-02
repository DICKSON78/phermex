import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'

const STORAGE_KEY = 'helix_lang'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
]

/**
 * Website language control.
 *
 * Writes the same `helix_lang` key the dashboard reads, so choosing a language
 * here also applies to the login screen and the rest of the system.
 */
export default function LanguageSwitcher() {
  const [lang, setLang] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore write failures
    }
    // Same-origin tabs (login/dashboard) listen for this.
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: lang }))
  }, [lang])

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-white/10 p-0.5" role="group" aria-label="Language">
      <Globe className="w-4 h-4 text-white/70 ml-2 mr-0.5" aria-hidden="true" />
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            lang === l.code ? 'bg-[#0FD452] text-black' : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
