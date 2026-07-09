const CATS = [
  { icon: '🏢', name: 'Apartments', count: '2.4L' },
  { icon: '🏠', name: 'Independent House', count: '85K' },
  { icon: '🏡', name: 'Villas', count: '32K' },
  { icon: '🌳', name: 'Plots / Land', count: '1.2L' },
 //{ icon: '🏗️', name: 'Under Construction', count: '67K' },
  { icon: '🏬', name: 'Commercial', count: '45K' },
  { icon: '🛏️', name: 'PG / Hostel', count: '18K' },
  { icon: '🏪', name: 'Office Space', count: '22K' }
]

export default function Categories() {
  return (
    <section className="sec py-16 px-6">
      <div className="wrap max-w-7xl mx-auto">
        <div className="sec-head flex justify-between items-end mb-8 r" data-reveal>
          <div>
            <h2 className="sec-h font-serif text-2xl font-extrabold text-[#1a0a2e]">
              Browse by <span className="bg-linear-to-r7c3aed] to-[#a78bfa] bg-clip-text text-transparent">Category</span>
            </h2>
            <p className="sec-sub text-sm text-[rgba(26,10,46,0.4)] mt-1">What kind of property are you looking for?</p>
          </div>
          <button className="see-all text-sm font-semibold text-[#a78bfa] hover:text-[#7c3aed] hover:underline">View All →</button>
        </div>

        <div className="cat-grid grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3" id="cat-grid">
          {CATS.map((cat, i) => (
            <div
              key={cat.name}
              className={`cat-card bg-[#e8e4ff] border border-[rgba(124,58,237,0.15)] rounded-[14px] p-5 text-center cursor-pointer transition-all duration-300 hover:border-[#7c3aed] hover:bg-[rgba(124,58,237,0.1)] hover:-translate-y-1.5 hover:scale-104 hover:shadow-xl r d${i+1}`}
              data-reveal
            >
              <span className="cat-icon text-3xl block mb-2 transition-transform group-hover:scale-120 group-hover:-rotate-6">{cat.icon}</span>
              <div className="cat-name text-sm font-bold text-[#1a0a2e]">{cat.name}</div>
              <div className="cat-count text-[11.5px] text-[rgba(26,10,46,0.4)] mt-0.5">{cat.count} listings</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}