export default function AsSeenOn() {
  const logos = ['CNBC Africa', 'Yahoo Finance', 'TechCrunch', 'TechCabal']

  return (
    <section className="bg-[#0A1A22] py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-[#0FD452] text-xs font-bold tracking-[2px] uppercase mb-6">AS SEEN ON</p>
        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-14">
          {logos.map((name) => (
            <div key={name} className="text-gray-500 font-bold text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
