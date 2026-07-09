const STEPS = [
  { icon: '🔍', n: '01', title: 'Search Your City', desc: 'Use smart filters — city, locality, budget, property type — to find exactly what you need.' },
  { icon: '🏘', n: '02', title: 'Explore Listings', desc: 'Browse high-quality photos, floor plans, amenities and verified property details.' },
  { icon: '📞', n: '03', title: 'Connect Directly', desc: 'Call, WhatsApp or message verified owners and agents. Zero brokerage, no middlemen.' },
  { icon: '🔑', n: '04', title: 'Close the Deal', desc: 'Schedule site visits, negotiate, sign agreements and pay securely on the platform.' }
]

export default function HowItWorks() {
  return (
    <section className="sec py-16 px-6 bg-[#ffffff] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.05)_0%,transparent_60%)] pointer-events-none"></div>
      <div className="wrap max-w-7xl mx-auto relative">
        <div className="r text-center mb-12" data-reveal>
          <h2 className="sec-h font-serif text-2xl font-extrabold text-[#1a0a2e]">
            How It <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="sec-sub text-sm text-[rgba(26,10,46,0.4)] mt-1">4 simple steps to your perfect property</p>
        </div>

        <div className="steps-grid grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6" id="steps-grid">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`step bg-[#f0eeff] border border-[rgba(124,58,237,0.15)] rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(124,58,237,0.35)] hover:shadow-xl relative overflow-hidden r d${i+1}`}
              data-reveal
            >
              <div className="step-num-box w-11 h-11 rounded-xl bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.28)] flex items-center justify-center text-xl mb-4 transition-all group-hover:bg-[rgba(124,58,237,0.22)] group-hover:scale-110">
                {step.icon}
              </div>
              <span className="step-n font-serif text-4xl font-extrabold text-[rgba(124,58,237,0.15)] absolute top-3 right-4">
                {step.n}
              </span>
              <div className="step-title text-base font-bold text-[#1a0a2e] mb-2">{step.title}</div>
              <div className="step-desc text-sm text-[rgba(26,10,46,0.4)] leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}