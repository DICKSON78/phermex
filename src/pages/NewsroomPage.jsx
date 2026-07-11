import { Link } from 'react-router-dom'
import { articles, featured } from '../data/articles'

const categories = ['All', 'Press', 'Industry', 'Tips', 'Customer Story']

export default function NewsroomPage() {
  return (
    <>
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.pexels.com/photos/30689114/pexels-photo-30689114.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">NEWSROOM</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Latest News &{' '}
              <span className="text-[#0FD452]">Stories</span>
            </h1>
            <p className="text-gray-300 text-sm mt-6 leading-relaxed max-w-xl">
              Stay up to date with the latest from Pharmex — company updates, industry insights, and customer success stories.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 mb-20 items-center">
            <div className="rounded-2xl overflow-hidden">
              <img src={featured.img} alt={featured.title} className="w-full h-72 lg:h-96 object-cover" loading="lazy" />
            </div>
            <div>
              <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-3">FEATURED STORY</p>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-black leading-tight mb-4">{featured.title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <span className="font-semibold text-black">{featured.author}</span> &middot; {featured.date}
                </div>
                <Link to={`/newsroom/${featured.slug}`} className="btn-asaak hover:!bg-white hover:!text-black !text-xs !px-6 !py-2.5">
                  Read More
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat, i) => (
              <button key={i} className={`px-5 py-2 rounded-full text-xs font-bold transition-colors ${i === 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <div key={i} className="group rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={article.img} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-[#0FD452] bg-[#0FD452]/10 px-2.5 py-1 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-400">{article.date}</span>
                  </div>
                  <h3 className="text-black font-bold text-base mb-2 leading-snug">{article.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{article.excerpt}</p>
                  <Link to={`/newsroom/${article.slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-black mt-4 group-hover:text-[#0FD452] transition-colors">
                    Read Article
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="btn-asaak hover:!bg-white hover:!text-black">
              Load More Articles
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#000F14] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white mb-3">Stay in the Loop</h2>
            <p className="text-gray-400 text-sm mb-6">Get the latest news and updates delivered to your inbox.</p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-full text-sm bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#0FD452]" />
              <button className="btn-asaak shrink-0 hover:!bg-white hover:!text-black">Subscribe</button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
