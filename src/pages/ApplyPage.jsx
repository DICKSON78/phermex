import { Link } from 'react-router-dom'
import deliveryVideo from '../Deliverymedication.mp4'

const services = [
  {
    title: 'Inventory Management',
    desc: 'Track stock levels in real-time, manage expirations, set automated reorder points, and never run out of essential medications.',
    features: ['Real-time stock tracking', 'Expiry date alerts', 'Automated reorder points', 'Multi-location support'],
    img: 'https://images.pexels.com/photos/7490839/pexels-photo-7490839.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'Point of Sale (POS)',
    desc: 'Process sales quickly with an intuitive POS system designed for pharmacy workflows. Supports multiple payment methods.',
    features: ['Fast checkout flow', 'Receipt printing', 'Multi-payment support', 'Sales history'],
      img: 'https://images.pexels.com/photos/30688588/pexels-photo-30688588.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'Prescription Management',
    desc: 'Digitize prescription processing from intake to fulfillment. Track history, manage refills, and reduce medication errors.',
    features: ['Digital prescription intake', 'Patient history', 'Refill reminders', 'Drug interaction checks'],
      img: 'https://images.pexels.com/photos/30677717/pexels-photo-30677717.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'Analytics & Reporting',
    desc: 'Understand your business with data-driven insights. Track sales trends, profit margins, and make informed decisions.',
    features: ['Sales dashboards', 'Inventory analytics', 'Profit reports', 'Custom export'],
    img: 'https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'Customer Management',
    desc: 'Build patient profiles, track purchase history, manage loyalty programs, and communicate effectively with your customers.',
    features: ['Patient profiles', 'Purchase history', 'Loyalty program', 'SMS notifications'],
    img: 'https://images.pexels.com/photos/30677719/pexels-photo-30677719.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'Staff & Access Control',
    desc: 'Manage your team with role-based permissions. Track activity logs and ensure accountability across your pharmacy.',
    features: ['Role-based access', 'Activity logs', 'Staff scheduling', 'Performance tracking'],
      img: 'https://images.pexels.com/photos/30689320/pexels-photo-30689320.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
]

export default function ApplyPage() {
  return (
    <>
      <section className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video src={deliveryVideo} autoPlay muted loop playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">PHARMEX</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Don't Wait,{' '}
              <span className="text-[#0FD452]">Apply Today</span>
            </h1>
            <p className="text-gray-300 text-sm mt-6 leading-relaxed max-w-xl">
              The all-in-one pharmacy management platform built for African pharmacies. Streamline operations, serve patients better, and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a href="#services" className="btn-asaak hover:!bg-white hover:!text-black">
                Explore Services
              </a>
              <a href="#steps" className="btn-asaak hover:!bg-white hover:!text-black">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Apply Now
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">WHAT WE OFFER</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">All-in-One Pharmacy Platform</h2>
            <p className="text-gray-500 text-sm mt-4 max-w-xl mx-auto">
              Six integrated modules that work together seamlessly to run your entire pharmacy.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <div key={i} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={service.img} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-6">
                  <h3 className="text-black font-bold text-lg mb-2">{service.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{service.desc}</p>
                  <ul className="space-y-2">
                    {service.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-4 h-4 text-[#0FD452] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">Get Started in 3 Simple Steps</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              { num: '01', title: 'Tell Us About Your Pharmacy', desc: 'Fill out a quick form and let us know your needs. We\'ll match you with the right plan.', img: 'https://images.pexels.com/photos/30677719/pexels-photo-30677719.jpeg?auto=compress&cs=tinysrgb&w=600' },
              { num: '02', title: 'Onboarding & Setup', desc: 'We schedule a call, set up your account, import your data, and train your team.', img: 'https://images.pexels.com/photos/30689320/pexels-photo-30689320.jpeg?auto=compress&cs=tinysrgb&w=600' },
              { num: '03', title: 'Go Live & Grow', desc: 'Start serving patients on day one with 24/7 support from our team whenever you need it.', img: 'https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=600' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="rounded-2xl overflow-hidden mb-5">
                  <img src={step.img} alt={step.title} className="w-full h-52 object-cover" loading="lazy" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-[#0FD452] font-bold text-sm">{step.num}</span>
                </div>
                <h3 className="text-black font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">GET STARTED</p>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-black leading-tight">Ready to Transform Your Pharmacy?</h2>
              <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                Fill out the form and our team will get back to you within 24 hours with a personalized demo and pricing.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { title: 'Free personalized demo', desc: 'See exactly how Pharmex works for your pharmacy.' },
                  { title: 'Quick 48-hour setup', desc: 'From sign-up to live in under two days.' },
                  { title: '24/7 support', desc: 'We are always here when you need us.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <svg className="w-5 h-5 text-[#0FD452] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-black">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <form className="bg-white p-8 lg:p-10 rounded-2xl shadow-sm border border-gray-100">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Email</label>
                    <input type="email" className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors" placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone</label>
                    <input type="tel" className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors" placeholder="+255 7XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Pharmacy Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors" placeholder="Your pharmacy" />
                  </div>
                </div>
                <div className="mt-5">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">What service are you interested in?</label>
                  <select className="w-full px-4 py-3 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors bg-white">
                    <option value="">Select a service</option>
                    <option value="all">Full Platform</option>
                    <option value="inventory">Inventory Management</option>
                    <option value="pos">Point of Sale</option>
                    <option value="prescription">Prescription Management</option>
                    <option value="analytics">Analytics & Reporting</option>
                  </select>
                </div>
                <div className="mt-5">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Message</label>
                  <textarea rows="4" className="w-full px-4 py-3 rounded-2xl text-sm border border-gray-200 focus:outline-none focus:border-black transition-colors resize-none" placeholder="Tell us about your pharmacy and what you need..."></textarea>
                </div>
                <button type="submit" className="btn-asaak mt-6 w-full hover:!bg-white hover:!text-black">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Request Demo
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
