import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center bg-white">
      <div className="text-center px-6">
        <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">404</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-black mb-4">Page Not Found</h1>
        <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-asaak inline-flex items-center gap-2 hover:!bg-white hover:!text-black">
          Back to Home
        </Link>
      </div>
    </section>
  )
}
