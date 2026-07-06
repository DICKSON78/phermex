import { Link } from 'react-router-dom'

export default function Story() {
  return (
    <section className="bg-white py-20 lg:py-28 overflow-hidden" id="story">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80"
                alt="Pharmacy"
                className="w-full h-80 lg:h-96 object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-5 -right-5 bg-[#0FD452] p-5 rounded-2xl shadow-lg hidden sm:block">
              <p className="text-white text-3xl font-extrabold">500+</p>
              <p className="text-white/80 text-xs font-semibold">Pharmacies Served</p>
            </div>
          </div>
          <div>
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">OUR STORY</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-black leading-tight">
              The Road to Health Management.
            </h2>
            <div className="mt-6 space-y-4 text-gray-500 text-sm leading-relaxed max-w-lg">
              <p>
                We are on a mission to digitize pharmacies across Tanzania, providing the tools needed to manage inventory, process prescriptions, and serve patients better.
              </p>
              <p>
                Our platform empowers pharmacy owners to focus on what matters most — delivering quality healthcare to their communities.
              </p>
            </div>
            <div className="mt-8">
              <Link to="/about" className="btn-asaak hover:!bg-white hover:!text-black">
                ABOUT US
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
