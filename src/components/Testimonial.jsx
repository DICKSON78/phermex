import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function Testimonial() {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef(null)

  const handlePlay = () => {
    setPlaying(true)
    setTimeout(() => videoRef.current?.play(), 100)
  }

  const handleClose = () => {
    videoRef.current?.pause()
    videoRef.current?.load()
    setPlaying(false)
  }

  return (
    <section className="bg-[#000F14] py-16 lg:py-24" id="testimonial">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Become your own boss just like{' '}
              <span className="text-[#0FD452]">Grace</span>.
            </h2>
            <p className="text-gray-300 text-base mt-6 leading-relaxed max-w-md">
              &ldquo;Phermex completely transformed how I run my pharmacy. I can manage everything from one dashboard.&rdquo;
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
            {!playing ? (
              <div
                className="relative border border-gray-600 rounded-lg overflow-hidden w-full max-w-md aspect-video bg-gray-800 flex items-center justify-center group cursor-pointer"
                onClick={handlePlay}
              >
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                  loading="lazy"
                />
                <div className="relative w-16 h-16 rounded-full bg-[#0FD452]/90 flex items-center justify-center group-hover:bg-[#0FD452] group-hover:scale-110 transition-all">
                  <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            ) : (
              <div className="relative border border-gray-600 rounded-lg overflow-hidden w-full max-w-md aspect-video bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  onEnded={handleClose}
                >
                  <source src="https://assets.mixkit.co/videos/40835/40835-720.mp4" type="video/mp4" />
                </video>
                <button
                  onClick={handleClose}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
