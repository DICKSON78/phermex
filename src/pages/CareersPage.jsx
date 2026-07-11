import { Link } from 'react-router-dom'

const jobs = [
  { title: 'Senior Full-Stack Developer', type: 'Full-time', location: 'Dar es Salaam', dept: 'Engineering', tag: 'HOT' },
  { title: 'Software Engineer (React/Node)', type: 'Full-time', location: 'Dar es Salaam', dept: 'Engineering', tag: 'NEW' },
  { title: 'Mobile Developer (Flutter)', type: 'Full-time', location: 'Dar es Salaam', dept: 'Engineering', tag: '' },
  { title: 'UI/UX Designer', type: 'Full-time', location: 'Remote', dept: 'Product', tag: '' },
  { title: 'Product Manager', type: 'Full-time', location: 'Dar es Salaam', dept: 'Product', tag: 'NEW' },
  { title: 'Customer Success Manager', type: 'Full-time', location: 'Dar es Salaam', dept: 'Operations', tag: '' },
  { title: 'Sales Representative', type: 'Full-time', location: 'Arusha', dept: 'Sales', tag: '' },
  { title: 'Marketing Lead', type: 'Full-time', location: 'Dar es Salaam', dept: 'Marketing', tag: 'HOT' },
]

const values = [
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: 'Innovation',
    desc: 'We push boundaries and embrace new ideas to solve real problems.',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'People First',
    desc: 'Our team and our customers are at the heart of everything we do.',
  },
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: 'Integrity',
    desc: 'We do the right thing, even when no one is watching.',
  },
  {
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    title: 'Growth',
    desc: 'We invest in our people and create opportunities for growth.',
  },
]

export default function CareersPage() {
  return (
    <>
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">CAREERS</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
            Join Us in Transforming{' '}
          <span className="text-[#0FD452]">African Pharmacy</span>
          </h1>
          <p className="text-gray-300 text-sm mt-6 max-w-xl mx-auto">
            We're building the future of pharmacy management in Africa. Come make an impact with us.
          </p>
          <div className="mt-10 flex justify-center">
            <a href="#openings" className="btn-asaak hover:!bg-white hover:!text-black">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
              View Openings
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">WHY JOIN US</p>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-black leading-tight">Build the Future of Healthcare</h2>
              <p className="text-gray-500 text-sm mt-6 leading-relaxed">
                At Pharmex, you'll work on meaningful problems that directly impact healthcare delivery across Africa. We're a fast-growing startup where your work matters from day one.
              </p>
              <div className="mt-8 space-y-4">
                {['Competitive salary & equity', 'Flexible working hours', 'Health insurance', 'Annual learning budget', 'Team retreats & social events'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-[#0FD452] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden">
                  <img src="https://images.pexels.com/photos/30689320/pexels-photo-30689320.jpeg?auto=compress&cs=tinysrgb&w=400" alt="" className="w-full h-48 object-cover" loading="lazy" />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img src="https://images.pexels.com/photos/30677719/pexels-photo-30677719.jpeg?auto=compress&cs=tinysrgb&w=400" alt="" className="w-full h-36 object-cover" loading="lazy" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden">
                  <img src="https://images.pexels.com/photos/30688588/pexels-photo-30688588.jpeg?auto=compress&cs=tinysrgb&w=400" alt="" className="w-full h-36 object-cover" loading="lazy" />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img src="https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=400" alt="" className="w-full h-48 object-cover" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={v.icon}/>
                  </svg>
                </div>
                <h3 className="text-black font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="openings" className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">OPEN POSITIONS</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-black">Join Our Team</h2>
          </div>
          <div className="max-w-lg mx-auto text-center bg-gray-50 p-10 lg:p-12 rounded-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-[#0FD452]/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-[#0FD452]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
              </svg>
            </div>
            <h3 className="text-black font-bold text-xl mb-2">No Open Positions Right Now</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              We are not currently hiring, but we are always looking for talented people. Send us your CV and we will keep you in mind for future opportunities.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <a href="mailto:careers@pharmex.com" className="btn-asaak hover:!bg-white hover:!text-black">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Send Your CV
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
