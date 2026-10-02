import { useState, useEffect } from 'react'

const API_BASE = '/api'

const TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
}

const values = [
  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Innovation', desc: 'We push boundaries and embrace new ideas to solve real problems.' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'People First', desc: 'Our team and our customers are at the heart of everything we do.' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Integrity', desc: 'We do the right thing, even when no one is watching.' },
  { icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', title: 'Growth', desc: 'We invest in our people and create opportunities for growth.' },
]

export default function CareersPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({ full_name: '', email: '', phone: '', cover_letter: '', portfolio_url: '', linkedin_url: '' })
  const [applyLoading, setApplyLoading] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/jobs`)
      .then((res) => res.json())
      .then((json) => setJobs(json.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  const openApply = (job) => {
    setSelectedJob(job)
    setApplyForm({ full_name: '', email: '', phone: '', cover_letter: '', portfolio_url: '', linkedin_url: '' })
    setApplySuccess(false)
    setApplyError('')
    setShowApplyModal(true)
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    if (!applyForm.full_name.trim() || !applyForm.email.trim()) {
      setApplyError('Name and email are required.')
      return
    }
    setApplyLoading(true)
    setApplyError('')
    try {
      const res = await fetch(`${API_BASE}/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(applyForm),
      })
      const json = await res.json()
      if (res.ok) {
        setApplySuccess(true)
      } else {
        setApplyError(json.message || json.errors?.email?.[0] || 'Failed to submit application.')
      }
    } catch {
      setApplyError('Network error. Please try again.')
    } finally {
      setApplyLoading(false)
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">CAREERS</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
            Join Us in Transforming{' '}<span className="text-[#0FD452]">African Pharmacy</span>
          </h1>
          <p className="text-gray-300 text-sm mt-6 max-w-xl mx-auto">
            We are building the future of pharmacy management in Africa. Come make an impact with us.
          </p>
          <div className="mt-10 flex justify-center">
            <a href="#openings" className="btn-asaak hover:!bg-white hover:!text-black">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
              View Openings
            </a>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">WHY JOIN US</p>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-black leading-tight">Build the Future of Healthcare</h2>
              <p className="text-gray-500 text-sm mt-6 leading-relaxed">
                At Helix, you will work on meaningful problems that directly impact healthcare delivery across Africa. We are a fast-growing startup where your work matters from day one.
              </p>
              <div className="mt-8 space-y-4">
                {['Competitive salary & equity', 'Flexible working hours', 'Health insurance', 'Annual learning budget', 'Team retreats & social events'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-[#0FD452] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden"><img src="https://images.pexels.com/photos/30689320/pexels-photo-30689320.jpeg?auto=compress&cs=tinysrgb&w=400" alt="" className="w-full h-48 object-cover" loading="lazy" /></div>
                <div className="rounded-2xl overflow-hidden"><img src="https://images.pexels.com/photos/30677719/pexels-photo-30677719.jpeg?auto=compress&cs=tinysrgb&w=400" alt="" className="w-full h-36 object-cover" loading="lazy" /></div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden"><img src="https://images.pexels.com/photos/30688588/pexels-photo-30688588.jpeg?auto=compress&cs=tinysrgb&w=400" alt="" className="w-full h-36 object-cover" loading="lazy" /></div>
                <div className="rounded-2xl overflow-hidden"><img src="https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=400" alt="" className="w-full h-48 object-cover" loading="lazy" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">OUR VALUES</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">What We Stand For</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-[#000F14] flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={v.icon}/></svg>
                </div>
                <h3 className="text-black font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="openings" className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">OPEN POSITIONS</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">Join Our Team</h2>
          </div>
          {loading ? (
            <div className="text-center py-12"><p className="text-gray-400">Loading positions...</p></div>
          ) : jobs.length === 0 ? (
            <div className="max-w-lg mx-auto text-center bg-gray-50 p-10 lg:p-12 rounded-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
              </div>
              <h3 className="text-black font-bold text-xl mb-2">No Open Positions Right Now</h3>
              <p className="text-gray-500 text-sm leading-relaxed">We are not currently hiring, but we are always looking for talented people. Send us your CV and we will keep you in mind for future opportunities.</p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <a href="mailto:support@helix.co.tz" className="btn-asaak hover:!bg-white hover:!text-black">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Send Your CV
                </a>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-black">{job.title}</h3>
                        {job.is_hot && <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">HOT</span>}
                        {job.is_new && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">NEW</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>{job.department}</span>
                        <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>{job.location}</span>
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">{TYPE_LABELS[job.type] || job.type}</span>
                        {job.salary_range && <span className="text-[#0FD452] font-semibold text-xs">{job.salary_range}</span>}
                      </div>
                    </div>
                    <button onClick={() => openApply(job)} className="btn-asaak hover:!bg-white hover:!text-black shrink-0">
                      Apply Now
                    </button>
                  </div>
                  {job.description && (
                    <p className="text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed">{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowApplyModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-black">Apply for Position</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedJob?.title}</p>
                </div>
                <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              {applySuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">Application Submitted!</h3>
                  <p className="text-sm text-gray-500">Thank you for your interest. We will review your application and get back to you soon.</p>
                  <button onClick={() => setShowApplyModal(false)} className="mt-6 px-6 py-3 bg-[#0FD452] text-white rounded-xl font-semibold text-sm hover:bg-[#0cb843] transition-colors">Done</button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  {applyError && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{applyError}</div>}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" value={applyForm.full_name} onChange={(e) => setApplyForm({ ...applyForm, full_name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 outline-none" placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" value={applyForm.email} onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 outline-none" placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Phone</label>
                    <input type="tel" value={applyForm.phone} onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 outline-none" placeholder="+255 ..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Cover Letter</label>
                    <textarea value={applyForm.cover_letter} onChange={(e) => setApplyForm({ ...applyForm, cover_letter: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 outline-none resize-none" placeholder="Tell us why you are a great fit..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Portfolio URL</label>
                    <input type="url" value={applyForm.portfolio_url} onChange={(e) => setApplyForm({ ...applyForm, portfolio_url: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">LinkedIn URL</label>
                    <input type="url" value={applyForm.linkedin_url} onChange={(e) => setApplyForm({ ...applyForm, linkedin_url: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 outline-none" placeholder="https://linkedin.com/in/..." />
                  </div>
                  <button type="submit" disabled={applyLoading} className="w-full py-3 bg-[#0FD452] text-white rounded-xl font-semibold text-sm hover:bg-[#0cb843] transition-colors disabled:opacity-50">
                    {applyLoading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
