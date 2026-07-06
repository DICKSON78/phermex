import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    q: 'What is Phermex?',
    a: 'Phermex is a web-based pharmacy management system designed for pharmacies in Tanzania. It helps you manage inventory, process prescriptions, handle sales, and generate business insights — all from one platform.',
    cat: 'General',
  },
  {
    q: 'How much does Phermex cost?',
    a: 'We offer flexible pricing plans tailored to pharmacies of all sizes. Contact our sales team for a custom quote based on your pharmacy needs.',
    cat: 'Pricing',
  },
  {
    q: 'Is Phermex cloud-based?',
    a: 'Yes! Phermex is fully cloud-based — accessible from any device with an internet connection. Your data is securely stored and backed up automatically.',
    cat: 'General',
  },
  {
    q: 'Do I need special hardware to use Phermex?',
    a: 'No special hardware is required. Phermex works on any device with a modern web browser — computers, tablets, and smartphones.',
    cat: 'Technical',
  },
  {
    q: 'How long does it take to set up?',
    a: 'Most pharmacies are up and running within 1-2 days. Our onboarding team guides you through the entire setup process step by step.',
    cat: 'General',
  },
  {
    q: 'Can I import my existing inventory data?',
    a: 'Absolutely. We support bulk data import from CSV/Excel files. Our team will help you migrate your existing data seamlessly.',
    cat: 'Technical',
  },
  {
    q: 'Is my data secure?',
    a: 'Security is our top priority. We use bank-level encryption (SSL/TLS) for all data in transit and at rest. Your pharmacy and patient data is always protected.',
    cat: 'Security',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'We provide 24/7 customer support via phone, email, and live chat. Our team is always ready to help with any questions or issues.',
    cat: 'General',
  },
  {
    q: 'Can I use Phermex on my phone?',
    a: 'Yes, Phermex is fully responsive and works on mobile browsers. We also have a dedicated mobile interface optimized for pharmacy staff on the go.',
    cat: 'Technical',
  },
  {
    q: 'Does Phermex work offline?',
    a: 'Currently, Phermex requires an internet connection. However, we have taken measures to ensure it works well even on slower connections common in some areas.',
    cat: 'Technical',
  },
  {
    q: 'Can I add multiple users?',
    a: 'Yes, you can create unlimited user accounts for your staff. Each user gets role-based access permissions for security.',
    cat: 'General',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept mobile money (M-Pesa, Tigo Pesa, Airtel Money), bank transfers, and card payments.',
    cat: 'Pricing',
  },
]

const categories = ['All', 'General', 'Pricing', 'Technical', 'Security']

export default function FAQPage() {
  const [active, setActive] = useState(null)
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? faqs : faqs.filter(f => f.cat === filter)

  return (
    <>
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">FAQ</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Frequently Asked{' '}
              <span className="text-[#0FD452]">Questions</span>
            </h1>
            <p className="text-gray-300 text-sm mt-6 max-w-lg mx-auto">
              Everything you need to know about Phermex. Can't find what you're looking for? Get in touch.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-colors ${filter === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setActive(active === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-bold text-black pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${active === i ? 'rotate-45' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
                {active === i && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                    <span className="inline-block mt-3 text-[10px] font-bold text-[#0FD452] bg-[#0FD452]/10 px-2.5 py-1 rounded-full">
                      {faq.cat}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-14 bg-gray-50 p-8 lg:p-10 rounded-2xl">
            <h3 className="text-black font-bold text-xl mb-2">Still Have Questions?</h3>
            <p className="text-gray-400 text-sm mb-6">Our team is here to help you.</p>
            <Link to="/apply" className="btn-asaak hover:!bg-white hover:!text-black">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
