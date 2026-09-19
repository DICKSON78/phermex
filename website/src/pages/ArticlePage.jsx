import { useParams, Link } from 'react-router-dom'
import { articles } from '../data/articles'

export default function ArticlePage() {
  const { slug } = useParams()
  const article = articles.find(a => a.slug === slug)

  if (!article) {
    return (
      <section className="bg-white py-28 lg:py-36 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-extrabold text-black">Article Not Found</h1>
          <p className="text-gray-500 mt-4 mb-8">The article you are looking for does not exist.</p>
          <Link to="/newsroom" className="btn-asaak hover:!bg-white hover:!text-black">
            Back to Newsroom
          </Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={article.img} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <Link
              to="/newsroom"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back to Newsroom
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold text-[#0FD452] bg-[#0FD452]/10 px-2.5 py-1 rounded-full">
                {article.category}
              </span>
              <span className="text-gray-400 text-xs">{article.date}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {article.title}
            </h1>
            <p className="text-gray-300 text-sm mt-4">
              By <span className="text-white font-semibold">{article.author}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
            {article.content.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#000F14] flex items-center justify-center text-white text-xs font-bold">
                {article.author.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-black font-bold text-sm">{article.author}</p>
                <p className="text-gray-400 text-xs">{article.date}</p>
              </div>
            </div>
            <Link to="/newsroom" className="btn-asaak hover:!bg-white hover:!text-black">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              All Articles
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
