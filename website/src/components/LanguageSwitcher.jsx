import { Globe } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

/**
 * Website language control.
 *
 * Reads and writes the shared LanguageContext rather than holding its own
 * state, so every `t()` call on the page re-renders when the choice changes.
 * The context persists to the same `helix_lang` key the dashboard reads, so
 * choosing a language here also applies to the login screen and the rest of
 * the system.
 */
export default function LanguageSwitcher() {
  const { lang, setLang, languages, t } = useLanguage()

  return (
    <div
      className="flex items-center gap-0.5 rounded-full bg-white/10 p-0.5"
      role="group"
      aria-label={t('language.language', 'Language')}
    >
      <Globe className="w-4 h-4 text-white/70 ml-2 mr-0.5" aria-hidden="true" />
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            lang === l.code ? 'bg-[#0FD452] text-black' : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          {l.nativeLabel || l.label}
        </button>
      ))}
    </div>
  )
}