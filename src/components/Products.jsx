import { Link } from 'react-router-dom'

export default function Products() {
  const items = [
    {
      title: 'INVENTORY',
      desc: 'Track stock levels and expiration dates in real-time with automated alerts.',
      img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80',
    },
    {
      title: 'POS',
      desc: 'Seamless point-of-sale with integrated payment processing and invoice generation.',
      img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80',
    },
    {
      title: 'PRESCRIPTIONS',
      desc: 'Digital prescription management from patient intake to fulfillment tracking.',
      img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&q=80',
    },
    {
      title: 'ANALYTICS',
      desc: 'Data-driven insights to optimize sales, inventory turnover, and profitability.',
      img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
    },
  ]

  return (
    <section className="bg-[#000F14] py-16 lg:py-24" id="products">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-2">PRODUCTS</p>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-10 max-w-2xl">
          Solutions That Fuel Your{' '}
          <span className="text-[#0FD452]">Pharmacy</span>.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((product, i) => (
            <div key={i} className="group relative overflow-hidden bg-white/5 border border-white/10 hover:border-[#0FD452]/50 transition-colors duration-300">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={product.img}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <h3 className="text-white font-bold text-lg mb-3 pb-3 border-b border-white/20">
                  {product.title}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">{product.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link to="/apply" className="btn-asaak">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            APPLY NOW
          </Link>
        </div>
      </div>
    </section>
  )
}
