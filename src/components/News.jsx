export default function News() {
  const articles = [
    {
      title: 'Phermex Raises $5M to Expand Pharmacy Tech Across Tanzania',
      source: 'TechCrunch',
      img: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&q=80',
    },
    {
      title: 'How Digital Tools Are Transforming Pharmacy Management',
      source: 'Reuters',
      img: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&q=80',
    },
    {
      title: 'Phermex Partners with Major Pharma Distributors',
      source: 'Bloomberg',
      img: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80',
    },
  ]

  return (
    <section className="bg-gray-50 py-16 lg:py-24" id="newsroom">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl lg:text-4xl font-extrabold text-black mb-10">Making The News</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {articles.map((article, i) => (
            <article key={i} className="group cursor-pointer">
              <div className="aspect-[16/10] bg-gray-100 overflow-hidden mb-4">
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-gray-400 font-semibold tracking-[1px] uppercase mb-1">{article.source}</p>
              <h3 className="text-sm font-bold text-black leading-relaxed">{article.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
