import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const offices = [
  { city: 'Dar es Salaam', country: 'Tanzania', address: 'Plot 123, Samora Avenue, Dar es Salaam', phone: '+255 669 254 444' },
  { city: 'Arusha', country: 'Tanzania', address: 'Sokoine Road, Arusha', phone: '+255 669 254 444' },
  { city: 'Mwanza', country: 'Tanzania', address: 'Station Road, Mwanza', phone: '+255 669 254 444' },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Failed to send message')
      setSuccess(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.pexels.com/photos/30677717/pexels-photo-30677717.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">CONTACT</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Get in{' '}
              <span className="text-[#0FD452]">Touch</span>
            </h1>
            <p className="text-gray-300 text-sm mt-6 leading-relaxed max-w-xl">
              Have a question, want a demo, or ready to get started? We're here to help. Reach out to our team.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-black mb-2">Send Us a Message</h2>
              <p className="text-gray-400 text-sm mb-8">We'll get back to you within 24 hours.</p>

              {success ? (
                <div className="bg-[#0FD452]/5 border border-[#0FD452]/20 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-[#0FD452]" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">Message Sent!</h3>
                  <p className="text-gray-500 text-sm mb-6">Thank you for reaching out. We will get back to you within 24 hours.</p>
                  <button onClick={() => setSuccess(false)} className="px-6 py-3 bg-[#0FD452] text-white rounded-full font-bold text-sm hover:bg-[#0cb843] transition-colors">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 transition-all"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div className="mt-5">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Subject</label>
                    <select
                      required
                      value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 transition-all bg-white"
                    >
                      <option value="">Select a subject</option>
                      <option value="Request a Demo">Request a Demo</option>
                      <option value="Sales Inquiry">Sales Inquiry</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mt-5">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Message</label>
                    <textarea
                      rows="5"
                      required
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl text-sm border border-gray-200 focus:outline-none focus:border-[#0FD452] focus:ring-2 focus:ring-[#0FD452]/20 transition-all resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-asaak mt-6 hover:!bg-white hover:!text-black disabled:opacity-50">
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    )}
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-black font-bold text-lg mb-4">Contact Info</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Phone</p>
                      <a href="tel:+255669254444" className="text-black font-bold hover:text-[#0FD452] transition-colors">+255 669 254 444</a>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Email</p>
                      <a href="mailto:support@helix.co.tz" className="text-black font-bold hover:text-[#0FD452] transition-colors">support@helix.co.tz</a>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Hours</p>
                      <p className="text-black font-bold">Mon - Fri, 8AM - 6PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-black font-bold text-lg mb-4">Our Offices</h3>
                <div className="space-y-5">
                  {offices.map((office, i) => (
                    <div key={i}>
                      <p className="font-bold text-black text-sm">{office.city}, <span className="text-gray-400 font-normal">{office.country}</span></p>
                      <p className="text-sm text-gray-400 mt-0.5">{office.address}</p>
                      <p className="text-sm text-gray-400">{office.phone}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-black font-bold text-lg mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <a href="https://www.linkedin.com/in/helix-co-ltd-part-of-allos-holding-co-ltd-299605359" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center text-[#0FD452] hover:bg-[#0FD452] hover:text-white transition-all">
                    <span className="text-xs font-bold">in</span>
                  </a>
                  <a href="https://www.instagram.com/helix_co.ltd" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center text-[#0FD452] hover:bg-[#0FD452] hover:text-white transition-all">
                    <span className="text-xs font-bold">Ig</span>
                  </a>
                  <a href="https://www.youtube.com/@helix_co.ltd" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center text-[#0FD452] hover:bg-[#0FD452] hover:text-white transition-all">
                    <span className="text-xs font-bold">Yt</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">FOLLOW US</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black mb-8">Stay Connected</h2>
            <div className="flex justify-center gap-4">
              <a href="https://www.linkedin.com/in/helix-co-ltd-part-of-allos-holding-co-ltd-299605359" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#0FD452] hover:text-[#0FD452] hover:shadow-lg transition-all">
                <span className="text-xs font-bold">in</span>
              </a>
              <a href="https://www.instagram.com/helix_co.ltd" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#0FD452] hover:text-[#0FD452] hover:shadow-lg transition-all">
                <span className="text-xs font-bold">Ig</span>
              </a>
              <a href="https://www.youtube.com/@helix_co.ltd" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#0FD452] hover:text-[#0FD452] hover:shadow-lg transition-all">
                <span className="text-xs font-bold">Yt</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
