import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden" id="hero">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.pexels.com/photos/30677719/pexels-photo-30677719.jpeg?auto=compress&cs=tinysrgb&w=1920"
          className="w-full h-full object-cover"
        >
          <source src="https://assets.mixkit.co/videos/16420/16420-720.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/65" />
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">PHARMEX</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              DON'T WAIT,<br />
              <span className="text-[#0FD452]">APPLY TODAY</span>
            </h1>
            <p className="text-gray-300 text-sm mt-6 leading-relaxed max-w-md">
              The all-in-one pharmacy management platform built for African pharmacies. Streamline operations, serve patients better, and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/apply" className="btn-asaak hover:!bg-white hover:!text-black">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Get Started
              </Link>
              <Link to="/apply" className="btn-asaak hover:!bg-white hover:!text-black">
                Apply Here
              </Link>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-xl p-5 min-h-[200px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0FD452">
                      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0FD452"/>
                      <path d="M12 6l4 6h-8l4-6z" fill="white" fillOpacity="0.3"/>
                      <path d="M10 13h4v5h-4z" fill="white"/>
                    </svg>
                    <span className="text-black font-bold text-sm">Pharmex</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                      </svg>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0FD452] to-emerald-600 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">JD</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Good morning,</p>
                <p className="text-black font-extrabold text-xl">Jane's Pharmacy</p>
              </div>
              <div className="bg-[#000F14] rounded-2xl shadow-xl p-5 min-h-[140px] flex flex-col justify-center">
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Today's Sales</p>
                <p className="text-white text-3xl font-extrabold">USD 2,400</p>
                <p className="text-[#0FD452] text-xs mt-1 font-semibold">&uarr; 12% vs yesterday</p>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="bg-white rounded-2xl shadow-xl p-5 min-h-[140px] flex items-center">
                <div className="w-full">
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-3">Quick Stats</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-2xl font-extrabold text-black">47</p>
                      <p className="text-gray-400 text-[10px]">Prescriptions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-black">1,284</p>
                      <p className="text-gray-400 text-[10px]">Items</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-5 min-h-[200px]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-xs font-semibold">Recent Transactions</p>
                  <span className="text-[#0FD452] text-[10px] font-semibold cursor-pointer">View all</span>
                </div>
                <div className="space-y-2">
                  {[
                    { drug: 'Amoxicillin 500mg', time: '2 min ago', amount: 'USD 18', status: 'Completed' },
                    { drug: 'Metformin 850mg', time: '15 min ago', amount: 'USD 7', status: 'Completed' },
                    { drug: 'Paracetamol 500mg', time: '1 hr ago', amount: 'USD 10', status: 'Pending' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Completed' ? 'bg-[#0FD452]' : 'bg-yellow-400'}`} />
                        <div>
                          <p className="text-black text-xs font-medium">{item.drug}</p>
                          <p className="text-gray-400 text-[10px]">{item.time}</p>
                        </div>
                      </div>
                      <p className="text-black font-bold text-xs">{item.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="bg-white rounded-2xl shadow-xl p-4 min-h-[180px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0FD452">
                      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0FD452"/>
                      <path d="M12 6l4 6h-8l4-6z" fill="white" fillOpacity="0.3"/>
                      <path d="M10 13h4v5h-4z" fill="white"/>
                    </svg>
                    <span className="text-black font-bold text-xs">Pharmex</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                      </svg>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0FD452] to-emerald-600 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">JD</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider mb-0.5">Good morning,</p>
                <p className="text-black font-extrabold text-base">Jane's Pharmacy</p>
              </div>
              <div className="bg-gray-50 rounded-2xl shadow-sm p-4 min-h-[100px] flex flex-col justify-center">
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Quick Stats</p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-extrabold text-black">47</p>
                    <p className="text-gray-400 text-[10px]">Prescriptions</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-black">1,284</p>
                    <p className="text-gray-400 text-[10px]">Items</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-6">
              <div className="bg-[#000F14] rounded-2xl shadow-xl p-4 min-h-[100px] flex flex-col justify-center">
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1">Today's Sales</p>
                <p className="text-white text-2xl font-extrabold">USD 2,400</p>
                <p className="text-[#0FD452] text-[10px] mt-0.5 font-semibold">&uarr; 12% vs yesterday</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-4 min-h-[180px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-500 text-[10px] font-semibold">Recent Transactions</p>
                  <span className="text-[#0FD452] text-[10px] font-semibold cursor-pointer">View all</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { drug: 'Amoxicillin 500mg', time: '2 min ago', amount: 'USD 18', status: 'Completed' },
                    { drug: 'Metformin 850mg', time: '15 min ago', amount: 'USD 7', status: 'Completed' },
                    { drug: 'Paracetamol 500mg', time: '1 hr ago', amount: 'USD 10', status: 'Pending' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Completed' ? 'bg-[#0FD452]' : 'bg-yellow-400'}`} />
                        <div>
                          <p className="text-black text-[11px] font-medium">{item.drug}</p>
                          <p className="text-gray-400 text-[9px]">{item.time}</p>
                        </div>
                      </div>
                      <p className="text-black font-bold text-[11px]">{item.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
