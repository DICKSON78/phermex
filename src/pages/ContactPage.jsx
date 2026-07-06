import { Link } from 'react-router-dom'

const offices = [
  { city: 'Dar es Salaam', country: 'Tanzania', address: 'Plot 123, Samora Avenue, Dar es Salaam', phone: '+255 800 100 200' },
  { city: 'Arusha', country: 'Tanzania', address: 'Sokoine Road, Arusha', phone: '+255 800 100 201' },
  { city: 'Mwanza', country: 'Tanzania', address: 'Station Road, Mwanza', phone: '+255 800 100 202' },
]

export default function ContactPage() {
  return (
    <>
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80" alt="" className="w-full h-full object-cover" loading="lazy" />
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
              <form>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Email</label>
                    <input type="email" className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="mt-5">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Subject</label>
                  <select className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors bg-white">
                    <option value="">Select a subject</option>
                    <option value="demo">Request a Demo</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Customer Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="mt-5">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Message</label>
                  <textarea rows="5" className="w-full px-4 py-3 rounded-2xl text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors resize-none" placeholder="Tell us how we can help..."></textarea>
                </div>
                <button type="submit" className="btn-asaak mt-6 hover:!bg-white hover:!text-black">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Send Message
                </button>
              </form>
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
                      <a href="tel:+255800100200" className="text-black font-bold hover:text-[#0FD452] transition-colors">+255 800 100 200</a>
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
                      <a href="mailto:info@phermex.com" className="text-black font-bold hover:text-[#0FD452] transition-colors">info@phermex.com</a>
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
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">FOLLOW US</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">Stay Connected</h2>
          </div>
          <div className="flex justify-center gap-4">
            {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map((social, i) => (
              <a key={i} href="#" className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#0FD452] hover:text-[#0FD452] hover:shadow-lg transition-all">
                <span className="text-xs font-bold">{social[0]}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
