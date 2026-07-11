import { Link } from 'react-router-dom'

export default function MainCta() {
  return (
    <section className="bg-[#000F14] py-20 lg:py-28 text-center" id="cta">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">DON'T WAIT</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Apply{' '}
            <span className="text-[#0FD452]">Today</span>
          </h2>
          <p className="text-gray-400 text-sm mt-6 leading-relaxed max-w-xl mx-auto">
            Take control of your pharmacy operations with our all-in-one management platform. Join 500+ pharmacies already using Pharmex.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link to="/apply" className="btn-asaak hover:!bg-white hover:!text-black">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              APPLY NOW
            </Link>
            <Link to="/contact" className="btn-asaak hover:!bg-white hover:!text-black">
              Contact Us
            </Link>
          </div>

          <p className="text-[#0FD452] text-sm font-bold mt-8 tracking-wider">#Transform Your Pharmacy</p>
        </div>
      </div>
    </section>
  )
}
