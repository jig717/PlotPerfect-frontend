import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { propertyService, userService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { useDebounce } from '../../hooks'
import { CardSkeleton } from '../../Components/skeletons/CardSkeleton'
import PropertyCard from '../../Components/property/PropertyCard'

const BHK = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK']
const BUDGETS = [
  { label: 'Any', value: '' },
  { label: 'Under Rs30L', value: '0-3000000' },
  { label: 'Rs30L-Rs60L', value: '3000000-6000000' },
  { label: 'Rs60L-Rs1Cr', value: '6000000-10000000' },
  { label: 'Rs1Cr-Rs2Cr', value: '10000000-20000000' },
  { label: 'Above Rs2Cr', value: '20000000+' },
]
const SORT_OPTS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price Up', value: 'price_asc' },
  { label: 'Price Down', value: 'price_desc' },
  { label: 'Most Popular', value: 'popular' },
]

function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedLabel = options.find((option) => (option.value ?? option) === value)?.label ?? (value || 'Any')

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        style={{
          width: '100%',
          height: 44,
          background: '#ffffff',
          border: `1px solid ${isOpen ? '#7c3aed' : 'rgba(124,58,237,0.15)'}`,
          borderRadius: 12,
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(124,58,237,0.08)' : 'none',
        }}
      >
        <span style={{ fontSize: 13.5, color: value ? '#1a0a2e' : 'rgba(26,10,46,0.4)', fontWeight: 500 }}>
          {selectedLabel}
        </span>
        <svg
          style={{ transform: `rotate(${isOpen ? 180 : 0}deg)`, transition: 'transform 0.2s', color: 'rgba(26,10,46,0.3)' }}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            background: '#ffffff',
            border: '1px solid rgba(124,58,237,0.1)',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(26,10,46,0.12)',
            zIndex: 100,
            maxHeight: 240,
            overflowY: 'auto',
            padding: 6,
          }}
        >
          {options.map((option) => {
            const optionValue = option.value ?? option
            const optionLabel = option.label ?? (option || 'Any')
            const active = optionValue === value

            return (
              <div
                key={optionValue}
                onMouseDown={() => {
                  onChange(optionValue)
                  setIsOpen(false)
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#7c3aed' : 'rgba(26,10,46,0.7)',
                  background: active ? 'rgba(124,58,237,0.06)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {optionLabel}
                {active && <span style={{ color: '#7c3aed' }}>OK</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterSidebar({ filters, onChange, onReset, priceRange, setPriceRange, selectedAmenities, setSelectedAmenities, amenitiesList, dynamicOptions }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(124,58,237,0.1)', borderRadius: 16, padding: 20, position: 'sticky', top: 80, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }}>Filters</span>
        <button onClick={onReset} style={{ fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reset All</button>
      </div>

      <FilterGroupLight title="Listing Type">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ v: 'sale', l: 'For Sale' }, { v: 'rent', l: 'For Rent' }, { v: 'pg', l: 'PG' }, { v: 'lease', l: 'Lease' }].map((type) => (
            <button
              key={type.v}
              onClick={() => onChange('listingType', filters.listingType === type.v ? '' : type.v)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: `1px solid ${filters.listingType === type.v ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`,
                background: filters.listingType === type.v ? 'rgba(124,58,237,0.08)' : 'none',
                color: filters.listingType === type.v ? '#7c3aed' : 'rgba(26,10,46,0.6)',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {type.l}
            </button>
          ))}
        </div>
      </FilterGroupLight>

      <FilterGroupLight title="City">
        <CustomSelect value={filters.city} onChange={(nextValue) => onChange('city', nextValue)} options={['Any', ...dynamicOptions.cities]} />
      </FilterGroupLight>

      <FilterGroupLight title="Property Type">
        <CustomSelect value={filters.propertyType} onChange={(nextValue) => onChange('propertyType', nextValue)} options={['Any', ...dynamicOptions.types]} />
      </FilterGroupLight>

      <FilterGroupLight title="BHK">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {BHK.map((item) => (
            <button
              key={item}
              onClick={() => onChange('bhk', filters.bhk === item.replace(' BHK', '') ? '' : item.replace(' BHK', ''))}
              style={{
                padding: '5px 10px',
                borderRadius: 7,
                fontSize: 11.5,
                fontWeight: 600,
                border: `1px solid ${filters.bhk === item.replace(' BHK', '') ? '#7c3aed' : 'rgba(124,58,237,0.2)'}`,
                background: filters.bhk === item.replace(' BHK', '') ? 'rgba(124,58,237,0.08)' : 'none',
                color: filters.bhk === item.replace(' BHK', '') ? '#7c3aed' : 'rgba(26,10,46,0.6)',
                cursor: 'pointer',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </FilterGroupLight>

      <FilterGroupLight title="Budget">
        <CustomSelect value={filters.budget} onChange={(nextValue) => onChange('budget', nextValue)} options={BUDGETS} />
      </FilterGroupLight>

      <FilterGroupLight title="Price Range (Rs)">
        <div style={{ padding: '0 8px' }}>
          <Slider
            range
            min={0}
            max={20000000}
            step={100000}
            value={priceRange}
            onChange={setPriceRange}
            trackStyle={{ backgroundColor: '#7c3aed' }}
            handleStyle={{ borderColor: '#7c3aed', backgroundColor: '#7c3aed' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, fontWeight: 600, color: 'rgba(26,10,46,0.5)' }}>
            <span>Rs{(priceRange[0] / 100000).toFixed(1)}L</span>
            <span>Rs{(priceRange[1] / 100000).toFixed(1)}L</span>
          </div>
        </div>
      </FilterGroupLight>

      <FilterGroupLight title="Amenities">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {amenitiesList.map((amenity) => (
            <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={(event) => {
                  if (event.target.checked) {
                    setSelectedAmenities([...selectedAmenities, amenity])
                  } else {
                    setSelectedAmenities(selectedAmenities.filter((item) => item !== amenity))
                  }
                }}
                style={{ width: 15, height: 15, accentColor: '#7c3aed' }}
              />
              <span style={{ fontSize: 12.5, color: 'rgba(26,10,46,0.7)', fontWeight: 500 }}>{amenity}</span>
            </label>
          ))}
        </div>
      </FilterGroupLight>
    </div>
  )
}

function FilterGroupLight({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(26,10,46,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

export default function PropertyListPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  const [priceRange, setPriceRange] = useState([0, 20000000])
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const amenitiesList = ['Parking', 'Gym', 'Swimming Pool', 'Security', 'Lift', 'Power Backup']
  const [dynamicOptions, setDynamicOptions] = useState({ cities: [], types: [] })

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    listingType: searchParams.get('type') || '',
    bhk: searchParams.get('bhk') || '',
    budget: searchParams.get('budget') || '',
  })

  const debouncedSearch = useDebounce(search, 500)
  const perPage = 12

  useEffect(() => {
    const loadFilterMetadata = async () => {
      try {
        const response = await propertyService.getFilters()
        if (response.data) {
          setDynamicOptions({
            cities: response.data.cities || [],
            types: response.data.types || [],
          })
        }
      } catch (error) {
        console.warn('Failed to load filter metadata', error)
      }
    }

    loadFilterMetadata()
  }, [])

  useEffect(() => {
    if (!user?._id) {
      setFavorites([])
      return
    }

    const loadFavorites = async () => {
      try {
        const response = await userService.getSaved(user._id)
        const list = Array.isArray(response.data) ? response.data : []
        const favoriteIds = list.map((item) => item.property?._id || item.property)
        setFavorites(favoriteIds)
      } catch (error) {
        console.warn('Failed to load favorites', error)
      }
    }

    loadFavorites()
  }, [user?._id])

  const fetchProperties = useCallback(async () => {
    setLoading(true)

    try {
      const params = {
        ...filters,
        search: debouncedSearch,
        sort,
        page,
        limit: perPage,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        amenities: selectedAmenities.join(','),
      }

      if (params.city === 'Any') params.city = ''
      if (params.propertyType === 'Any') params.propertyType = ''

      Object.keys(params).forEach((key) => (params[key] === '' || params[key] == null) && delete params[key])

      const data = await propertyService.getAll(params)
      setProperties(data.data || [])
      setTotal(data.total || (data.data || []).length)
    } catch {
      toast.error('Failed to load properties')
      setProperties([])
    } finally {
      setLoading(false)
    }
  }, [filters, debouncedSearch, sort, page, priceRange, selectedAmenities])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const toggleFavorite = async (propertyId) => {
    if (!propertyId) return

    if (!user) {
      toast.info('Please log in to save properties')
      navigate('/login')
      return
    }

    const isFavorite = favorites.includes(propertyId)
    setFavorites((current) => (isFavorite ? current.filter((id) => id !== propertyId) : [...current, propertyId]))

    try {
      if (isFavorite) {
        const response = await userService.getSaved(user._id)
        const record = response.data?.find((item) => (item.property?._id || item.property) === propertyId)
        if (record) {
          await userService.unsave(record._id)
          toast.success('Removed from saved')
        }
      } else {
        await userService.saveProperty(user._id, propertyId)
        toast.success('Saved to your list')
      }
    } catch {
      setFavorites((current) => (isFavorite ? [...current, propertyId] : current.filter((id) => id !== propertyId)))
      toast.error('Failed to update favorites')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    setFilters({ city: '', propertyType: '', listingType: '', bhk: '', budget: '' })
    setSearch('')
    setPage(1)
    setPriceRange([0, 20000000])
    setSelectedAmenities([])
  }

  const totalPages = Math.ceil(total / perPage)
  const activeFilters = Object.values(filters).filter(Boolean).length + (priceRange[0] > 0 || priceRange[1] < 20000000 ? 1 : 0) + selectedAmenities.length

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing:border-box; }
        .search-inp::placeholder { color: rgba(26,10,46,0.3); }
        .search-inp:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.1) !important; }
        @media (max-width: 768px) {
          .list-layout { grid-template-columns: 1fr !important; }
          .filter-sidebar { display: none; }
          .filter-sidebar.open { display: block; position: fixed; inset: 0; z-index: 100; overflow-y: auto; padding: 20px; background: #fff; }
        }
      `}</style>

      <div style={{ background: '#ffffff', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.08)', padding: '12px 6vw', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 14px', borderRadius: 9, transition: 'all 0.2s' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>

          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(26,10,46,0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="search-inp"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search city, area, or property name..."
              style={{ width: '100%', height: 44, paddingLeft: 42, paddingRight: 14, background: '#f9f9ff', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, color: '#1a0a2e', fontSize: 13.5, outline: 'none', transition: 'all 0.2s', fontFamily: "'DM Sans',sans-serif" }}
            />
          </div>

          <div style={{ width: 180 }}>
            <CustomSelect value={sort} onChange={(nextValue) => setSort(nextValue)} options={SORT_OPTS} />
          </div>

          <button
            onClick={() => setShowFilters((current) => !current)}
            style={{ height: 44, padding: '0 16px', background: activeFilters > 0 ? 'rgba(124,58,237,0.1)' : '#f9f9ff', border: `1px solid ${activeFilters > 0 ? '#7c3aed' : 'rgba(124,58,237,0.15)'}`, borderRadius: 12, color: activeFilters > 0 ? '#7c3aed' : 'rgba(26,10,46,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans',sans-serif" }}
          >
            Filters
            {activeFilters > 0 && <span style={{ background: '#7c3aed', color: 'white', width: 18, height: 18, borderRadius: '50%', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilters}</span>}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 6vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: '#1a0a2e', margin: 0 }}>
            {filters.city ? `Properties in ${filters.city}` : 'Find Your Dream Home'}
          </h1>
          <span style={{ fontSize: 13, color: 'rgba(26,10,46,0.4)', fontWeight: 600 }}>{loading ? 'Searching...' : `${total.toLocaleString()} results`}</span>
        </div>

        <div className="list-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
          <aside className={`filter-sidebar${showFilters ? ' open' : ''}`}>
            <FilterSidebar
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedAmenities={selectedAmenities}
              setSelectedAmenities={setSelectedAmenities}
              amenitiesList={amenitiesList}
              dynamicOptions={dynamicOptions}
            />
          </aside>

          <main>
            {loading && properties.length === 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
                {Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={index} />)}
              </div>
            ) : properties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', background: '#fff', borderRadius: 20, border: '1px solid rgba(124,58,237,0.06)' }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>Home</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: '#1a0a2e', marginBottom: 12 }}>No matching properties</h3>
                <p style={{ color: 'rgba(26,10,46,0.4)', fontSize: 15, maxWidth: 400, margin: '0 auto 28px' }}>We could not find anything matching your current filters. Try broadening your search.</p>
                <button onClick={handleReset} style={{ padding: '12px 32px', background: '#7c3aed', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 16px rgba(124,58,237,0.2)' }}>Clear All Filters</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 24 }}>
                  {properties.map((property, index) => (
                    <PropertyCard
                      key={property._id || property.id || index}
                      property={property}
                      index={index}
                      isFavorite={favorites.includes(property._id || property.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page === 1}
                      style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(124,58,237,0.15)', background: '#fff', color: page === 1 ? 'rgba(26,10,46,0.2)' : '#7c3aed', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}
                    >
                      Prev
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      const pageNumber = totalPages <= 5 ? index + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + index
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setPage(pageNumber)}
                          style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: page === pageNumber ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#fff', color: page === pageNumber ? '#fff' : '#7c3aed', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: page === pageNumber ? '0 4px 12px rgba(124,58,237,0.2)' : 'none' }}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page === totalPages}
                      style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(124,58,237,0.15)', background: '#fff', color: page === totalPages ? 'rgba(26,10,46,0.2)' : '#7c3aed', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
