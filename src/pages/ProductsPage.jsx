import { Link } from 'react-router-dom'
import HowItWorks from '../components/HowItWorks'
import MainCta from '../components/MainCta'

const features = [
  {
    title: 'Inventory Management',
    desc: 'Track stock levels, expiration dates, and reorder points in real-time. Get alerts when stock is running low.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',
  },
  {
    title: 'Point of Sale (POS)',
    desc: 'Fast, intuitive POS system with support for multiple payment methods, invoice generation, and receipt printing.',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80',
  },
  {
    title: 'Prescription Management',
    desc: 'Digital prescription processing from patient intake to fulfillment. Track prescription history and automate refills.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&q=80',
  },
  {
    title: 'Analytics & Reports',
    desc: 'Data-driven insights on sales trends, inventory turnover, and profitability. Make informed business decisions.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
  },
]

const benefits = [
  { title: 'Cloud-Based', desc: 'Access your data from anywhere, anytime. No installation needed.' },
  { title: 'Real-Time Sync', desc: 'Inventory and sales update instantly across all devices.' },
  { title: '24/7 Support', desc: 'Our team is always available to help you succeed.' },
  { title: 'Secure', desc: 'Bank-level encryption keeps your data safe and protected.' },
  { title: 'Easy Setup', desc: 'Get started in minutes with our simple onboarding process.' },
  { title: 'Scalable', desc: 'Grows with your business — from single store to multi-location.' },
]

export default function ProductsPage() {
  return (
    <>
      <section className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1920&q=80" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">PRODUCTS</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Everything You Need to Run Your{' '}
              <span className="text-[#0FD452]">Pharmacy</span>
            </h1>
            <p className="text-gray-300 text-sm mt-6 leading-relaxed max-w-xl">
              From inventory to prescriptions, Phermex provides all the tools you need to manage your pharmacy efficiently and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/apply" className="btn-asaak hover:!bg-white hover:!text-black">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">FEATURES</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">Powerful Tools for Your Pharmacy</h2>
          </div>
          <div className="space-y-24">
            {features.map((feature, i) => (
              <div key={i}              className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                  <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">FEATURE 0{i + 1}</p>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-black mb-4">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">{feature.desc}</p>
                  <ul className="space-y-3">
                    {['Real-time tracking', 'Automated alerts', 'Detailed reports'].map((item, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-[#0FD452] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="rounded-2xl overflow-hidden shadow-xl">
                    <img src={feature.img} alt={feature.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">BENEFITS</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">Why Choose Phermex</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#0FD452]/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#0FD452]/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h3 className="text-black font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-gray-500 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <MainCta />
    </>
  )
}
