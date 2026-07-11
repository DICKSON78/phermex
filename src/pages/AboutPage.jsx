import { Link } from 'react-router-dom'
import WhyChoose from '../components/WhyChoose'
import MainCta from '../components/MainCta'
import isackMahozi from '../Isack Mahozi.jpeg'
import fredTom from '../Fred Tom  co-founder & CSO.jpeg'
import michaelMaduhu from '../Michael Maduhu Co-founder & COO.jpeg'
import dicksonSteven from '../Dickson Steven CTO.png'

const milestones = [
  {
    year: '2023', title: 'The Beginning',
    desc: 'Pharmex was founded in Dar es Salaam with a vision to digitize pharmacies across Africa.',
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  },
  {
    year: '2024', title: 'First 100 Pharmacies',
    desc: 'Reached our first 100 pharmacy partners and expanded to 3 regions in Africa.',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    year: '2025', title: 'Regional Expansion',
    desc: 'Expanded to 5 regions across Africa and secured $2M in seed funding to accelerate growth.',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    year: '2026', title: 'National Expansion',
    desc: 'Now serving 500+ pharmacies across Africa with a team of 50+ employees.',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
]

const team = [
  { name: 'Isack Mahozi', role: 'CEO & Co-Founder', img: isackMahozi },
  { name: 'Fred Tom', role: 'Co-Founder & CSO', img: fredTom },
  { name: 'Michael Maduhu', role: 'Co-Founder & COO', img: michaelMaduhu },
  { name: 'Dickson Steven', role: 'Software Engineer & CTO', img: dicksonSteven },
]

export default function AboutPage() {
  return (
    <>
      <section className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">ABOUT PHARMEX</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Empowering Pharmacies Across{' '}
              <span className="text-[#0FD452]">Africa</span>
            </h1>
            <p className="text-gray-300 text-sm mt-6 leading-relaxed max-w-xl">
              Pharmex is building the digital backbone for African pharmacies. We provide a complete management platform that helps pharmacy owners streamline operations, serve patients better, and grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/products" className="btn-asaak hover:!bg-white hover:!text-black">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Explore Products
              </Link>
              <Link to="/careers" className="btn-asaak hover:!bg-white hover:!text-black">
                Join Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="lg:order-2">
              <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">OUR STORY</p>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-black leading-tight">Built by Pharmacists, for Pharmacists</h2>
              <div className="mt-6 space-y-4 text-gray-500 text-sm leading-relaxed">
                <p>Pharmex started in 2023 when our founder, Isack Mahozi, saw firsthand the challenges pharmacy owners face managing their businesses — from inventory tracking to prescription management.</p>
                <p>What began as a simple inventory tool has grown into a comprehensive pharmacy management platform used by hundreds of pharmacies across Africa.</p>
                <p>Today, we're a team of 50+ passionate individuals working to make pharmacy management simple, efficient, and accessible for every pharmacy in Africa.</p>
              </div>
            </div>
            <div className="relative lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-[3/4]">
                <img src={isackMahozi} alt="Isack Mahozi - CEO & Co-Founder" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="absolute -bottom-5 -right-5 bg-[#0FD452] p-5 rounded-2xl shadow-lg">
                <p className="text-white text-3xl font-extrabold">500+</p>
                <p className="text-white/80 text-xs font-semibold">Pharmacies Served</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhyChoose />

      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-white/85" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#0FD452 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#0FD452]/[0.04] blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#0FD452]/[0.03] blur-[80px] pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#0FD452]/[0.03] blur-[80px] pointer-events-none" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">OUR JOURNEY</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">Key Milestones</h2>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#0FD452] via-[#0FD452]/40 to-transparent -translate-x-1/2" />

            <div className="space-y-12 lg:space-y-16">
              {milestones.map((m, i) => (
                <div key={i} className={`relative flex items-start gap-6 lg:gap-0 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-[#0FD452] border-[3px] border-gray-50 shadow" />
                    </div>
                  </div>

                    <div className={`hidden lg:block w-1/2 ${i % 2 === 0 ? 'pr-14' : 'pl-14'}`}>
                      <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-[#0FD452]/30 transition-colors ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                        <div className={`flex items-center gap-4 mb-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                          <div className="w-10 h-10 rounded-full bg-[#000F14] flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d={m.icon}/>
                            </svg>
                          </div>
                          <span className="text-[#0FD452] text-xs font-bold">{m.year}</span>
                        </div>
                        <h3 className="text-black font-bold text-lg mb-2">{m.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{m.desc}</p>
                      </div>
                    </div>

                  <div className="lg:hidden flex items-start gap-4 w-full">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-[#0FD452] border-[3px] border-gray-50 shadow shrink-0 mt-1" />
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-[#0FD452]/40 to-transparent" />
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#000F14] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={m.icon}/>
                          </svg>
                        </div>
                        <span className="text-[#0FD452] text-xs font-bold">{m.year}</span>
                      </div>
                      <h3 className="text-black font-bold text-base mb-1.5">{m.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0FD452]/[0.02] py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#0FD452]/[0.03] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#0FD452]/[0.03] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">LEADERSHIP</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">Meet the Team</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {team.map((member, i) => (
              <div key={i} className="group">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl mb-4 ring-1 ring-[#0FD452]/10 group-hover:ring-[#0FD452]/30 transition-all">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <h3 className="text-black font-bold text-lg">{member.name}</h3>
                <p className="text-gray-400 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#000F14] py-16 lg:py-20 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-2">OUR MISSION</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white max-w-3xl mx-auto leading-tight">
            Making pharmacy management simple, efficient, and accessible for every pharmacy in Africa.
          </h2>
        </div>
      </section>

      <MainCta />
    </>
  )
}
