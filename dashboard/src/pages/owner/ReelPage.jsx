import { useState, useEffect } from 'react'
import { Loader2, Upload, Trash2, Film, ImageIcon, Save, Info } from 'lucide-react'
import { reels } from '../../services/api'
import { useLanguage } from '../../contexts/LanguageContext'

const MAX_IMAGE_MB = 5
const MAX_VIDEO_MB = 50
const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime'

/**
 * Lets a pharmacy publish its promotional reel.
 *
 * A pharmacy can only have one reel: saving again replaces the existing reel
 * rather than adding another, so this page always edits a single record.
 */
export default function ReelPage() {
  const { t } = useLanguage()
  const [reel, setReel] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', status: 'published' })
  const [media, setMedia] = useState(null)
  const [mediaType, setMediaType] = useState('image')
  const [existingMediaUrl, setExistingMediaUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await reels.mine()
      const data = res.data?.data ?? null
      if (data) {
        setReel(data)
        setForm({ title: data.title ?? '', description: data.description ?? '', status: data.status ?? 'published' })
        setExistingMediaUrl(data.mediaUrl ?? '')
        setMediaType(data.mediaType ?? 'image')
      }
    } catch (err) {
      setError(err.response?.data?.message || t('people.reel.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    const isVideo = file.type.startsWith('video/')
    const limitMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB
    if (file.size > limitMb * 1024 * 1024) {
      setError(`${t('people.reel.fileTooLarge')} ${limitMb} MB.`)
      event.target.value = ''
      return
    }

    setUploading(true)
    try {
      const res = await reels.upload(file)
      setMedia(file)
      setMediaType(isVideo ? 'video' : 'image')
      setExistingMediaUrl(res.data?.data?.url ?? '')
    } catch (err) {
      setError(err.response?.data?.message || t('people.reel.uploadFailed'))
      event.target.value = ''
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    if (!existingMediaUrl) {
      setError(t('people.reel.addMediaFirst'))
      return
    }
    if (!form.title.trim()) {
      setError(t('people.reel.addTitle'))
      return
    }

    setSaving(true)
    try {
      const res = await reels.save({
        title: form.title.trim(),
        description: form.description.trim() || null,
        mediaType,
        mediaUrl: existingMediaUrl,
        status: form.status,
      })
      setReel(res.data?.data ?? reel)
      setSuccess(res.data?.message || t('people.reel.saved'))
    } catch (err) {
      setError(err.response?.data?.message || t('people.reel.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setError('')
    setSaving(true)
    try {
      await reels.remove()
      setReel(null)
      setMedia(null)
      setExistingMediaUrl('')
      setForm({ title: '', description: '', status: 'published' })
      setSuccess(t('people.reel.removed'))
    } catch (err) {
      setError(err.response?.data?.message || t('people.reel.removeFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('people.reel.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('people.reel.subtitle')}
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-900">
          {t('people.reel.infoBefore')} <strong>{t('people.reel.oneReel')}</strong>. {t('people.reel.infoAfter')}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">{t('people.reel.media')}</h2>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {t('people.reel.imageOrVideo')} {mediaType === 'video' ? t('people.reel.videoSuffix') : t('people.reel.imageSuffix')}
            </span>
            <input
              type="file"
              accept={ACCEPTED}
              onChange={handleFile}
              disabled={uploading}
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-700"
            />
            <span className="text-xs text-slate-400">
              {t('people.reel.imagesUpTo')} {MAX_IMAGE_MB} MB, {t('people.reel.videosUpTo')} {MAX_VIDEO_MB} MB.
            </span>
          </label>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('people.reel.uploading')}
            </div>
          )}

          {existingMediaUrl && (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-xs font-medium text-slate-600 border-b border-slate-200">
                {mediaType === 'video' ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                {reel ? t('people.reel.currentReel') : t('people.reel.newReel')}
              </div>
              <img
                src={existingMediaUrl}
                alt="Reel preview"
                className="w-full h-56 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">{t('people.reel.details')}</h2>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">{t('people.reel.titleField')}</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={150}
              placeholder={t('people.reel.titlePlaceholder')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">{t('people.reel.descriptionField')}</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              maxLength={1000}
              placeholder={t('people.reel.descriptionPlaceholder')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">{t('people.reel.visibility')}</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="published">{t('people.reel.published')}</option>
              <option value="draft">{t('people.reel.draftOption')}</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {reel ? t('people.reel.replaceReel') : t('people.reel.publishReel')}
            </button>

            {reel && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {t('people.reel.remove')}
              </button>
            )}
          </div>

          {reel && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              {t('people.reel.replaceNote')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
