import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function JobDetailPage() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showApply, setShowApply] = useState(false)
  const [applyForm, setApplyForm] = useState({ full_name: '', email: '', phone: '', cover_letter: '', portfolio_url: '', linkedin_url: '' })
  const [applyLoading, setApplyLoading] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${id}`)
        if (!res.ok) throw new Error('Not found')
        const json = await res.json()
        setJob(json?.data || json)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  const handleApply = async (e) => {
    e.preventDefault()
    setApplyLoading(true)
    setApplyError('')
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(applyForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Failed to submit application')
      setApplySuccess(true)
    } catch (err) {
      setApplyError(err.message)
    } finally {
      setApplyLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="w-8 h-8 text-[#0FD452] animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
        <h1 className="text-2xl font-bold text-gray-900">Job Not Found</h1>
        <p className="text-gray-500 text-center max-w-md">The job listing you're looking for doesn't exist or has been removed.</p>
        <Link to="/careers" className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-[#0FD452] text-white rounded-full font-semibold hover:bg-[#0cb843] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
          Back to Careers
        </Link>
      </div>
    )
  }

  const daysLeft = job.closes_at ? Math.max(0, Math.ceil((new Date(job.closes_at) - new Date()) / (1000 * 60 * 60 * 24))) : null

  return (
    <>
      <section className="relative py-20 lg:py-28 overflow-hidden bg-[#000F14]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Link to="/careers" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
            Back to all positions
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">{job.title}</h1>
                {job.is_hot && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">HOT</span>}
                {job.is_new && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">NEW</span>}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mt-2">
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg> {job.department}</span>
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg> {job.location}</span>
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> {TYPE_LABELS[job.type] || job.type}</span>
                {job.salary_range && <span className="font-medium text-gray-300">{job.salary_range}</span>}
              </div>
            </div>
            <button onClick={() => setShowApply(true)} className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#0FD452] text-white rounded-full font-bold hover:bg-[#0cb843] transition-colors shrink-0">
              Apply Now
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-2xl font-extrabold text-black mb-4">About This Role</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
              {job.requirements && (
                <div>
                  <h2 className="text-2xl font-extrabold text-black mb-4">Requirements</h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{job.requirements}</div>
                </div>
              )}
              {job.responsibilities && (
                <div>
                  <h2 className="text-2xl font-extrabold text-black mb-4">Responsibilities</h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{job.responsibilities}</div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-black mb-4">Job Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Department</span>
                    <span className="text-sm font-semibold text-gray-900">{job.department}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Location</span>
                    <span className="text-sm font-semibold text-gray-900">{job.location}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="text-sm font-semibold text-gray-900">{TYPE_LABELS[job.type] || job.type}</span>
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Salary</span>
                      <span className="text-sm font-semibold text-gray-900">{job.salary_range}</span>
                    </div>
                  )}
                  {job.closes_at && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Closing Date</span>
                      <span className="text-sm font-semibold text-gray-900">{formatDate(job.closes_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={() => setShowApply(true)} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0FD452] text-white rounded-full font-bold hover:bg-[#0cb843] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                Apply for This Position
              </button>

              {daysLeft !== null && daysLeft > 0 && (
                <div className={`text-center text-sm font-medium px-4 py-3 rounded-xl ${daysLeft <= 7 ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                  <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
                  {daysLeft} days left to apply
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowApply(false); setApplySuccess(false); setApplyError('') }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8">
            {applySuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
                <p className="text-gray-500 text-sm mb-6">We will review your application and get back to you soon.</p>
                <button onClick={() => { setShowApply(false); setApplySuccess(false); setApplyForm({ full_name: '', email: '', phone: '', cover_letter: '', portfolio_url: '', linkedin_url: '' }) }} className="px-6 py-3 bg-[#0FD452] text-white rounded-full font-bold hover:bg-[#0cb843] transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Apply for {job.title}</h3>
                  <button onClick={() => { setShowApply(false); setApplyError('') }} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {applyError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">{applyError}</div>
                )}

                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Full Name *</label>
                    <input type="text" required value={applyForm.full_name} onChange={e => setApplyForm(p => ({ ...p, full_name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Email *</label>
                    <input type="email" required value={applyForm.email} onChange={e => setApplyForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Phone</label>
                    <input type="text" value={applyForm.phone} onChange={e => setApplyForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="+255 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Cover Letter</label>
                    <textarea rows={4} value={applyForm.cover_letter} onChange={e => setApplyForm(p => ({ ...p, cover_letter: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452] resize-none" placeholder="Tell us why you're a great fit..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Portfolio URL</label>
                    <input type="url" value={applyForm.portfolio_url} onChange={e => setApplyForm(p => ({ ...p, portfolio_url: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="https://yourportfolio.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">LinkedIn URL</label>
                    <input type="url" value={applyForm.linkedin_url} onChange={e => setApplyForm(p => ({ ...p, linkedin_url: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0FD452] focus:border-[#0FD452]" placeholder="https://linkedin.com/in/you" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setShowApply(false); setApplyError('') }} className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={applyLoading} className="flex-1 px-4 py-3 bg-[#0FD452] text-white rounded-full font-bold text-sm hover:bg-[#0cb843] transition-colors disabled:opacity-50">
                      {applyLoading ? (
                        <svg className="w-4 h-4 animate-spin inline" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      ) : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
