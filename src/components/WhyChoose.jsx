import { Link } from 'react-router-dom'

const reasons = [
  {
    title: 'Built for African Pharmacies',
    desc: 'Designed specifically for the African market with support for local currencies, mobile money payments, and offline-capable workflows.',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    title: 'Real-Time Insights',
    desc: 'Make data-driven decisions with live dashboards showing sales trends, inventory levels, and prescription volumes at a glance.',
    icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    title: 'Hassle-Free Setup',
    desc: 'Go from sign-up to live in under 48 hours. We handle data migration, staff training, and provide 24/7 support.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    title: 'Trusted by 500+ Pharmacies',
    desc: 'Join a growing community of pharmacy owners across Africa who rely on Pharmex to run their businesses every day.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

export default function WhyChoose() {
  return (
    <section className="bg-gray-50 py-20 lg:py-28" id="about">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">WHY CHOOSE PHARMEX</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-black">Built for Your Pharmacy</h2>
          <p className="text-gray-500 text-sm mt-4 max-w-xl mx-auto">
            We are a trustworthy partner that helps you grow your pharmacy business and unlock more opportunities.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#0FD452]/30 transition-all group">
              <div className="w-12 h-12 rounded-full bg-[#000F14] flex items-center justify-center mb-5 group-hover:bg-[#0FD452] transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                </svg>
              </div>
              <h3 className="text-black font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/about" className="btn-asaak hover:!bg-white hover:!text-black">
            LEARN MORE
          </Link>
        </div>
      </div>
    </section>
  )
}
