import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropertyCard from '../property/PropertyCard'
import { propertyService } from '../../services'

export default function FeaturedProperties() {
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadFeatured = async () => {
      try {
        setLoading(true)
        const response = await propertyService.getAll({ page: 1, limit: 4, sort: 'newest' })
        const list = Array.isArray(response?.data) ? response.data : []
        if (isMounted) {
          setCards(list)
        }
      } catch {
        if (isMounted) {
          setCards([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadFeatured()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="sec alt bg-[#f8f7ff] px-4 py-16 sm:px-6">
      <div className="wrap mx-auto max-w-7xl">
        <div className="sec-head mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" data-reveal>
          <div>
            <h2 className="font-serif text-2xl font-extrabold text-[#1a0a2e] sm:text-3xl">
              Featured <span className="text-[#7c3aed]">Stays & Homes</span>
            </h2>
            <p className="mt-1 text-sm text-[rgba(26,10,46,0.55)]">Fresh listings loaded from verified property data.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/properties')}
            className="text-sm font-semibold text-[#7c3aed] transition hover:text-[#5b21b6] hover:underline"
          >
            View All →
          </button>
        </div>

        <div
          className="cards-row flex snap-x snap-mandatory flex-nowrap gap-6 overflow-x-auto pb-2 scroll-smooth"
          id="cards-grid"
          aria-label="Featured properties list"
        >
          {loading && (
            <div className="text-sm text-[rgba(26,10,46,0.55)]">Loading featured properties...</div>
          )}
          {!loading && cards.length > 0 && cards.map((property, index) => (
            <div key={property._id || property.id || index} className="max-w-[370px] min-w-[320px] shrink-0 snap-start">
              <PropertyCard property={property} index={index} />
            </div>
          ))}
          {!loading && cards.length === 0 && (
            <div className="text-sm text-[rgba(26,10,46,0.55)]">No featured properties available right now.</div>
          )}
        </div>
      </div>
    </section>
  )
}
