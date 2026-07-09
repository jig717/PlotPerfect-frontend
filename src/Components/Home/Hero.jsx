import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { useInView, useCounter } from '../../hooks'
import CitySearch from '../ui/CitySearch'

export default function Hero() {
  const starsRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('buy')
  const [city, setCity] = useState('Mumbai')
  const [propertyType, setPropertyType] = useState('Apartment')
  const [bhk, setBhk] = useState('Any')
  const [budget, setBudget] = useState('Any Budget')

  const cityOptions = ['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Pune', 'Chennai']

  // Inside Hero component, replace the stats div:
  const [statsRef, statsInView] = useInView(0.3)
  const activeListings = useCounter(500000, 2400, statsInView)
  const happyUsers = useCounter(2000000, 2400, statsInView)
  const verifiedAgents = useCounter(50000, 2400, statsInView)

  const formatCount = (num) => {
    if (num >= 1000000) return (num/1000000).toFixed(1) + 'M'
    if (num >= 1000) return Math.floor(num/1000) + 'K'
    return num
  }

  useEffect(() => {
    const stars = starsRef.current
    if (!stars) return
    for (let i = 0; i < 55; i++) {
      const star = document.createElement('div')
      const size = Math.random() * 2.5 + 0.5
      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(124, 58, 237, ${Math.random() * 0.5 + 0.1});
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: starTwinkle ${Math.random() * 3 + 2}s ease-in-out infinite ${Math.random() * 3}s;
      `
      stars.appendChild(star)
    }
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    const tabMap = {
      buy: { listingType: 'sale', propertyType: '' },
      rent: { listingType: 'rent', propertyType: '' },
      pg: { listingType: 'pg', propertyType: 'PG' },
      plot: { listingType: 'sale', propertyType: 'Plot' },
      commercial: { listingType: 'sale', propertyType: 'Commercial' },
    }
    const selectedTabConfig = tabMap[activeTab] || tabMap.buy

    params.set('city', city)
    params.set('type', selectedTabConfig.listingType)
    params.set('propertyType', selectedTabConfig.propertyType || propertyType)
    if (bhk !== 'Any') params.set('bhk', bhk.replace(' BHK', ''))
    if (budget !== 'Any Budget') params.set('budget', budget)
    params.set('search', city)
    navigate(`/properties?${params.toString()}`)
  }

  const handleExploreProperties = () => {
    navigate('/properties')
  }

  const handlePostProperty = () => {
    if (!user) {
      toast.info('Create an owner or agent account to post a property.')
      navigate('/signup')
      return
    }

    if (user.role === 'agent' || user.role === 'owner') {
      navigate('/protected/agent')
      return
    }

    toast.info('Posting is available for owner or agent accounts only.')

    if (user.role === 'buyer') {
      navigate('/dashboard/buyer')
      return
    }

    if (user.role === 'support') {
      navigate('/support')
      return
    }

    if (user.role === 'admin') {
      navigate('/admin')
      return
    }

    navigate('/')
  }

  return (
    <section className="hero min-h-[92vh] py-16 sm:py-20 px-4 sm:px-6 relative overflow-hidden flex items-center bg-[radial-gradient(ellipse_at_70%_30%,#e0d6ff_0%,#f0eeff_35%,#ffffff_70%)] bg-size-[200%_200%] animate-[gradShift_10s_ease_infinite]">
      {/* Grid overlay */}
      <div className="hero-grid absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.08)_1px,transparent_1px)] bg-size-[56px_56px] pointer-events-none"></div>

      {/* Orbs */}
      <div className="orb1 absolute w-140 h-140 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.1)_0%,transparent_70%)] -top-35 -right-25 animate-[orbFloat_8s_ease-in-out_infinite]"></div>
      <div className="orb2 absolute w-95 h-95 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.08)_0%,transparent_70%)] bottom-5 -left-20 animate-[orbFloat_10s_ease-in-out_infinite_0.6s]"></div>
      <div className="orb3 absolute w-50 h-50 rounded-full bg-[radial-gradient(circle,rgba(196,181,253,0.06)_0%,transparent_70%)] top-[30%] left-[42%] animate-[orbFloat_12s_ease-in-out_infinite_1.2s]"></div>

      {/* Stars */}
      <div className="stars absolute inset-0 pointer-events-none overflow-hidden" ref={starsRef}></div>

      <div className="hero-inner max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-15 items-center relative z-10">
        {/* Left column */}
        <div>
          <div className="badge inline-flex items-center gap-2 bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] rounded-full py-1 px-3.5 mb-5 animate-[fadeUp_0.6s_ease_both_0.1s]">
            <span className="badge-dot w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-[pulse_1.8s_infinite]"></span>
            <span className="badge-txt text-xs font-semibold text-[#7c3aed]">India's Premium Property Platform</span>
          </div>

          <h1 className="hero-h font-serif text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.13] text-[#1a0a2e] mb-4 animate-[slideR_0.8s_ease_both_0.2s]">
            Find Your<br />
            <em className="not-italic bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">Dream Home</em>,<br />
            Without Hassle
          </h1>

          <p className="hero-sub text-[15.5px] text-[rgba(26,10,46,0.7)] leading-relaxed max-w-md mb-7 animate-[fadeUp_0.8s_ease_both_0.35s]">
            Search 5 lakh+ verified properties across India. Connect directly with owners — zero brokerage, zero stress.
          </p>

          <div className="hero-ctas flex gap-3 flex-wrap animate-[fadeUp_0.8s_ease_both_0.45s]">
            <button
              type="button"
              onClick={handleExploreProperties}
              className="btn-p px-6 py-3 bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-[10px] font-bold inline-flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-xl transition"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              Explore Properties
            </button>
            <button
              type="button"
              onClick={handlePostProperty}
              className="btn-ghost px-6 py-3 bg-[rgba(124,58,237,0.06)] border border-[rgba(124,58,237,0.3)] rounded-[10px] text-[#1a0a2e] font-semibold hover:bg-[rgba(124,58,237,0.12)] hover:-translate-y-0.5 transition"
            >
              Post Property Free
            </button>
          </div>

          <div ref={statsRef} className="hero-stats flex flex-wrap gap-5 sm:gap-8 mt-10 animate-[fadeUp_0.8s_ease_both_0.55s]">
            <div className="min-w-23">
              <div className="hstat-num font-serif text-3xl font-extrabold text-[#1a0a2e] leading-none" id="c1">
                {formatCount(activeListings)}
                <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">+</span>
              </div>
              <div className="hstat-lbl text-xs text-[rgba(26,10,46,0.4)] mt-0.5">Active Listings</div>
            </div>
            <div className="min-w-23">
              <div className="hstat-num font-serif text-3xl font-extrabold text-[#1a0a2e] leading-none" id="c2">
                {formatCount(happyUsers)}
                <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">+</span>
              </div>
              <div className="hstat-lbl text-xs text-[rgba(26,10,46,0.4)] mt-0.5">Happy Users</div>
            </div>
            <div className="min-w-23">
              <div className="hstat-num font-serif text-3xl font-extrabold text-[#1a0a2e] leading-none" id="c3">
                {formatCount(verifiedAgents)}
                <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">+</span>
              </div>
              <div className="hstat-lbl text-xs text-[rgba(26,10,46,0.4)] mt-0.5">Verified Agents</div>
            </div>
          </div>
        </div>

        {/* Right column - Search Card */}
        <div>
          <div className="sc bg-white border border-[rgba(124,58,237,0.2)] rounded-[20px] p-4 sm:p-6 shadow-2xl shadow-[rgba(124,58,237,0.15)] animate-[slideL_0.9s_cubic-bezier(0.34,1.2,0.64,1)_both_0.3s]">
            <div className="sc-inner animate-[floatY_5s_ease-in-out_infinite]">
              <div className="flex items-center gap-2 text-[#1a0a2e] font-bold text-base mb-4">
                <span className="sc-dot w-2 h-2 bg-[#7c3aed] rounded-full animate-[pulse_2s_infinite]"></span>
                Search Properties
              </div>

              {/* Tabs */}
              <div className="sc-tabs grid grid-cols-2 sm:grid-cols-5 gap-1 mb-4" id="sc-tabs">
                {[
                  { label: 'Buy', value: 'buy' },
                  { label: 'Rent', value: 'rent' },
                  { label: 'PG', value: 'pg' },
                  { label: 'Plot', value: 'plot' },
                  { label: 'Commercial', value: 'commercial' },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveTab(value)}
                    aria-pressed={activeTab === value}
                    className={`sc-tab py-2 px-1.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                      activeTab === value
                        ? 'on bg-linear-to-r from-[#7c3aed] to-[#6d28d9] border-[#7c3aed] text-white'
                        : 'border-[rgba(124,58,237,0.15)] text-[rgba(26,10,46,0.4)] hover:border-[#7c3aed] hover:text-[#7c3aed]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* City */}
              <div className="sc-mb mb-3">
                <CitySearch cities={cityOptions} onSelect={setCity} />
              </div>

              {/* Row: Type & BHK */}
              <div className="sc-row grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                <div>
                  <label className="sc-lbl block text-[10.5px] font-bold uppercase tracking-wide text-[rgba(26,10,46,0.4)] mb-1">Type</label>
                  <select
                    value={propertyType}
                    onChange={(event) => setPropertyType(event.target.value)}
                    className="sc-inp w-full h-11 bg-white border border-[rgba(124,58,237,0.2)] rounded-[10px] px-3 text-sm text-[#1a0a2e] outline-none"
                  >
                    <option>Apartment</option>
                    <option>Villa</option>
                    <option>House</option>
                    <option>Plot</option>
                    <option>Office</option>
                  </select>
                </div>
                <div>
                  <label className="sc-lbl block text-[10.5px] font-bold uppercase tracking-wide text-[rgba(26,10,46,0.4)] mb-1">BHK</label>
                  <select
                    value={bhk}
                    onChange={(event) => setBhk(event.target.value)}
                    className="sc-inp w-full h-11 bg-white border border-[rgba(124,58,237,0.2)] rounded-[10px] px-3 text-sm text-[#1a0a2e] outline-none"
                  >
                    <option>Any</option>
                    <option>1 BHK</option>
                    <option>2 BHK</option>
                    <option>3 BHK</option>
                    <option>4+ BHK</option>
                  </select>
                </div>
              </div>

              {/* Budget */}
              <div className="sc-mb mb-3">
                <label className="sc-lbl block text-[10.5px] font-bold uppercase tracking-wide text-[rgba(26,10,46,0.4)] mb-1">Budget</label>
                <select
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="sc-inp w-full h-11 bg-white border border-[rgba(124,58,237,0.2)] rounded-[10px] px-3 text-sm text-[#1a0a2e] outline-none"
                >
                  <option>Any Budget</option>
                  <option>Under ₹30L</option>
                  <option>₹30L–₹60L</option>
                  <option>₹60L–₹1Cr</option>
                  <option>₹1Cr–₹2Cr</option>
                  <option>Above ₹2Cr</option>
                </select>
              </div>

              {/* Search button */}
              <button
                type="button"
                onClick={handleSearch}
                className="btn-p w-full h-12 bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-[10px] font-bold flex items-center justify-center gap-2 text-sm sm:text-base hover:-translate-y-0.5 hover:shadow-xl transition"
                id="search-btn"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <span id="search-btn-txt" className="truncate">Search {city} Properties</span>
              </button>

              {/* Trending chips */}
              <div className="pop-row flex items-center gap-1.5 flex-wrap mt-3">
                <span className="pop-lbl text-xs text-[rgba(26,10,46,0.4)] font-medium">Trending:</span>
                {['Mumbai', 'Bangalore', 'Pune', 'Hyderabad'].map(city => (
                  <button
                    key={city}
                    type="button"
                    className="pop-chip px-2.5 py-1 rounded-full border border-[rgba(124,58,237,0.15)] bg-transparent text-[rgba(26,10,46,0.4)] text-[11.5px] hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[rgba(124,58,237,0.05)] hover:scale-105 transition"
                    onClick={() => setCity(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
