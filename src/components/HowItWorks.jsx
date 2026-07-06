import { Link } from 'react-router-dom'

export default function HowItWorks() {
  const steps = [
    {
      title: 'Create Your Account',
      desc: 'Sign up in minutes with your pharmacy details and verify your business information.',
    },
    {
      title: 'Set Up Your Pharmacy',
      desc: 'Add your inventory, staff, and customize your system settings to match your workflow.',
    },
    {
      title: 'Process Transactions',
      desc: 'Manage sales, prescriptions, and stock all from one unified dashboard.',
    },
    {
      title: 'Grow Your Business',
      desc: 'Access analytics and insights to optimize your pharmacy operations and profitability.',
    },
  ]

  return (
    <section className="bg-white py-16 lg:py-24" id="how">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-2">HOW IT WORKS</p>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-black mb-12">4 Simple Steps</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#0FD452] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-gray-700 font-bold text-sm">{i + 1}</span>
                </div>
              </div>
              <h3 className="text-black font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed max-w-[260px] mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link to="/apply" className="btn-asaak">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            GET STARTED
          </Link>
        </div>
      </div>
    </section>
  )
}
