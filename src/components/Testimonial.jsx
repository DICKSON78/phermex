import { Link } from 'react-router-dom'
import deliveryVideo from '../Deliverymedication.mp4'

export default function Testimonial() {
  return (
    <section className="bg-[#000F14] py-16 lg:py-24" id="testimonial">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Fast & Reliable{' '}
              <span className="text-[#0FD452]">Medication Delivery</span>.
            </h2>
            <p className="text-gray-300 text-base mt-6 leading-relaxed max-w-md">
              &ldquo;Pharmex transformed how I deliver medications to my patients. From order to doorstep, everything is seamless and tracked in real-time.&rdquo;
            </p>
            <div className="mt-8">
              <Link to="/apply" className="btn-asaak">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                GET STARTED
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative border border-gray-600 rounded-lg overflow-hidden w-full max-w-md aspect-video bg-black">
              <video
                src={deliveryVideo}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
