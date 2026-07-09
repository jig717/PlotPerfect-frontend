import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { propertyService } from '../../services'

const BASE_CITIES = [
  { city: 'Mumbai', icon: 0x1F30A },
  { city: 'Bangalore', icon: 0x1F33F },
  { city: 'Delhi NCR', icon: 0x1F3DB },
  { city: 'Hyderabad', icon: 0x1F48E },
  { city: 'Pune', icon: 0x1F393 },
  { city: 'Chennai', icon: 0x1F334 },
  { city: 'Ahmedabad', icon: 0x1F3FA },
  { city: 'Kolkata', icon: 0x1F338 },
]

const CITY_ALIASES = {
  Mumbai: ['mumbai'],
  Bangalore: ['bangalore', 'bengaluru'],
  'Delhi NCR': ['delhi', 'gurgaon', 'gurugram', 'noida', 'ghaziabad', 'faridabad'],
  Hyderabad: ['hyderabad'],
  Pune: ['pune'],
  Chennai: ['chennai', 'madras'],
  Ahmedabad: ['ahmedabad'],
  Kolkata: ['kolkata', 'calcutta'],
}

const formatCount = (count) => {
  if (count >= 100000) return `${(count / 100000).toFixed(1).replace(/\.0$/, '')}L`
  if (count >= 1000) return `${Math.round(count / 1000)}K`
  return `${count}`
}

const resolveCityKey = (rawCity) => {
  const cityText = String(rawCity || '').toLowerCase().trim()
  if (!cityText) return null

  for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.some((alias) => cityText.includes(alias))) {
      return city
    }
  }

  return null
}

export default function Cities() {
  const navigate = useNavigate()
  const [cityCounts, setCityCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadCityCounts = async () => {
      try {
        setLoading(true)
        const response = await propertyService.getAll({})
        const list = Array.isArray(response?.data) ? response.data : []

        const counts = list.reduce((acc, property) => {
          const rawCity = property?.city || property?.location?.city || ''
          const mappedCity = resolveCityKey(rawCity)
          if (!mappedCity) return acc
          acc[mappedCity] = (acc[mappedCity] || 0) + 1
          return acc
        }, {})

        if (mounted) {
          setCityCounts(counts)
        }
      } catch {
        if (mounted) {
          setCityCounts({})
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadCityCounts()
    return () => {
      mounted = false
    }
  }, [])

  const cities = useMemo(() => {
    return BASE_CITIES.map((entry) => {
      const count = cityCounts[entry.city] || 0
      return {
        ...entry,
        count,
        countLabel: formatCount(count),
      }
    })
  }, [cityCounts])

  return (
    <section className="sec py-16 px-6">
      <div className="wrap max-w-7xl mx-auto">
        <div className="sec-head flex justify-between items-end mb-8 r" data-reveal>
          <div>
            <h2 className="sec-h font-serif text-2xl font-extrabold text-[#1a0a2e]">
              Top <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">Cities</span>
            </h2>
            <p className="sec-sub text-sm text-[rgba(26,10,46,0.4)] mt-1">
              {loading ? 'Loading live city data...' : 'Find properties in your city'}
            </p>
          </div>
        </div>

        <div className="cities-grid grid grid-cols-[repeat(auto-fill,minmax(195px,1fr))] gap-3" id="cities-grid">
          {cities.map((c, i) => (
            <button
              key={c.city}
              type="button"
              onClick={() => navigate(`/properties?city=${encodeURIComponent(c.city)}`)}
              className={`city-card bg-[#f0eeff] border border-[rgba(124,58,237,0.15)] rounded-[14px] p-4 cursor-pointer flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:scale-102 hover:border-[rgba(124,58,237,0.45)] hover:bg-[#e8e4ff] hover:shadow-lg r d${i + 1}`}
              data-reveal
              aria-label={`View properties in ${c.city}`}
            >
              <span className="city-emoji text-2xl">{String.fromCodePoint(c.icon)}</span>
              <div className="text-left">
                <div className="text-sm font-bold text-[#1a0a2e]">{c.city}</div>
                <div className="text-xs text-[rgba(26,10,46,0.4)] mt-0.5">{c.countLabel} properties</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
