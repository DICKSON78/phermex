import { Globe } from 'lucide-react'
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext'

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, t } = useLanguage()

  if (compact) {
    return (
      <button
        onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
        title={t('language.changeLanguage')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase">{lang}</span>
      </button>
    )
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {t('language.language')}
      </label>
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
        <Globe className="w-4 h-4 text-gray-400 ml-1.5 flex-shrink-0" />
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              lang === l.code
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {l.nativeLabel}
          </button>
        ))}
      </div>
    </div>
  )
}