import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { formatPrice, getBadgeLabel } from '../../utils'

const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME

const TYPE_ACCENTS = {
  sale: {
    badge: 'bg-[#7c3aed]',
    glow: 'from-[#1d0e32]/85 via-[#28124a]/25 to-transparent',
    button: 'from-[#6d28d9] to-[#8b5cf6]',
    ring: 'shadow-[0_18px_36px_rgba(109,40,217,0.18)]',
  },
  rent: {
    badge: 'bg-[#0284c7]',
    glow: 'from-[#08253f]/80 via-[#0c4a6e]/20 to-transparent',
    button: 'from-[#0369a1] to-[#38bdf8]',
    ring: 'shadow-[0_18px_36px_rgba(3,105,161,0.18)]',
  },
  pg: {
    badge: 'bg-[#15803d]',
    glow: 'from-[#0f2f1e]/80 via-[#166534]/18 to-transparent',
    button: 'from-[#166534] to-[#22c55e]',
    ring: 'shadow-[0_18px_36px_rgba(22,101,52,0.18)]',
  },
  lease: {
    badge: 'bg-[#c2410c]',
    glow: 'from-[#40200e]/80 via-[#9a3412]/18 to-transparent',
    button: 'from-[#c2410c] to-[#fb923c]',
    ring: 'shadow-[0_18px_36px_rgba(194,65,12,0.18)]',
  },
}

const statIconClass = 'h-4 w-4 text-[#7c3aed]'
const fallbackAmenities = ['Parking', 'Security', 'Lift']

const getImageUrl = (image, width = 900, height = 700) => {
  if (!image) return null
  if (String(image).startsWith('http')) return image
  if (!CLOUD_NAME) return null
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/${image}`
}

const getFavoritesList = (response) => {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.message)) return response.message
  if (Array.isArray(response)) return response
  return []
}

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'PP'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

const toTitleCase = (value = '') =>
  String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')

const getLocationText = (property) => {
  const city = property.city || property.location?.city || ''
  const locality = property.locality || property.location?.address || property.address || ''
  return [locality, city].filter(Boolean).join(', ') || 'Pune, India'
}

const getAmenityText = (property) => {
  const amenities = Array.isArray(property.amenities) ? property.amenities.filter(Boolean) : []
  return amenities.slice(0, 3).join(', ') || fallbackAmenities.join(', ')
}

const getListingType = (property) => {
  const raw = String(property.listingType || property.purpose || 'sale').toLowerCase()
  return ['sale', 'rent', 'pg', 'lease'].includes(raw) ? raw : 'sale'
}

const firstFilled = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')

const getDisplayNumber = (...values) => {
  const value = firstFilled(...values)
  if (value === undefined) return 'N/A'

  const match = String(value).match(/\d+(\.\d+)?/)
  return match ? match[0] : String(value)
}

const getBedroomCount = (property) =>
  getDisplayNumber(
    property.bedrooms,
    property.bedroom,
    property.beds,
    property.bed,
    property.bhk,
    property.configuration
  )

const getBathroomCount = (property) =>
  getDisplayNumber(
    property.bathrooms,
    property.bathroom,
    property.baths,
    property.bath,
    property.toilets
  )

const getGuestCount = (property) => {
  const explicit = firstFilled(
    property.guestCount,
    property.guests,
    property.maxGuests,
    property.capacity,
    property.occupancy,
    property.maxOccupancy,
    property.guestCapacity
  )

  if (explicit !== undefined) return getDisplayNumber(explicit)

  return 'N/A'
}

const getPropertyTypeLabel = (property, listingType) => {
  if (listingType === 'pg') return 'Stay'
  return toTitleCase(property.propertyType || property.type || 'Property')
}

const resolvePropertyId = (property) => property._id || property.id || null

export default function PropertyCard({
  property,
  index = 0,
  isFavorite,
  onToggleFavorite,
  className = '',
  showFavorite = true,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)
  const [saving, setSaving] = useState(false)

  const propertyId = resolvePropertyId(property || {})
  const listingType = getListingType(property || {})
  const accent = TYPE_ACCENTS[listingType] || TYPE_ACCENTS.sale
  const normalizedStatus = String(property?.status || '').toUpperCase()
  const isBooked = normalizedStatus === 'BOOKED'
  const imageUrl = getImageUrl(property?.images?.[0] || property?.image)
  const locationText = getLocationText(property || {})
  const title = property?.title || `${getPropertyTypeLabel(property || {}, listingType)} in ${locationText}`
  const description = property?.description || `${getPropertyTypeLabel(property || {}, listingType)} with premium stay experience, modern interiors, and a beautiful setting in ${locationText}.`
  const hostName = property?.owner?.name || property?.contactName || property?.postedBy?.name || 'Verified Host'
  const hostInitials = getInitials(hostName)
  const hostVerified = Boolean(property?.owner?.isVerified || property?.isVerified)
  const bedrooms = getBedroomCount(property || {})
  const bathrooms = getBathroomCount(property || {})
  const guests = getGuestCount(property || {})
  const amenityText = getAmenityText(property || {})
  const propertyType = getPropertyTypeLabel(property || {}, listingType)

  const reviewCount = Number(property?.reviewCount || property?.ratingsCount || property?.reviewsCount || 0)
  const ratingValue = Number(property?.rating || property?.avgRating || property?.averageRating || 4.9)
  const ratingText = Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : '4.9'
  const badgeLabel = isBooked
    ? (property?.badge || property?.listingLabel || 'Booked')
    : (property?.listingLabel || getBadgeLabel(listingType))
  const badgeStyle = isBooked ? 'bg-[#0f766e]' : accent.badge

  const savedState = typeof isFavorite === 'boolean' ? isFavorite : saved

  useEffect(() => {
    if (typeof isFavorite === 'boolean') {
      setSaved(isFavorite)
    }
  }, [isFavorite])

  useEffect(() => {
    let cancelled = false

    const syncFavoriteState = async () => {
      if (typeof isFavorite === 'boolean' || !user?._id || !propertyId || String(propertyId).length !== 24) {
        if (!cancelled && typeof isFavorite !== 'boolean') {
          setSaved(false)
          setFavoriteId(null)
        }
        return
      }

      try {
        const response = await api.get(`/favorite/${user._id}`)
        const favorites = getFavoritesList(response)
        const found = favorites.find(
          (item) =>
            item?.property?._id?.toString() === String(propertyId) ||
            item?.property?.toString() === String(propertyId)
        )

        if (!cancelled) {
          setSaved(Boolean(found))
          setFavoriteId(found?._id || null)
        }
      } catch {
        if (!cancelled) {
          setSaved(false)
          setFavoriteId(null)
        }
      }
    }

    syncFavoriteState()
    return () => {
      cancelled = true
    }
  }, [user?._id, propertyId, isFavorite])

  const statItems = useMemo(() => ([
    ...(guests !== 'N/A' ? [{ label: 'Guests', value: guests, icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={statIconClass}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3.2" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M14 3.25a3.2 3.2 0 0 1 0 6.5" />
      </svg>
    ) }] : []),
    { label: 'Bedrooms', value: bedrooms, icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={statIconClass}>
        <path d="M3 11V6.8A1.8 1.8 0 0 1 4.8 5h3.4A1.8 1.8 0 0 1 10 6.8V11" />
        <path d="M14 11V8.8A1.8 1.8 0 0 1 15.8 7h3.4A1.8 1.8 0 0 1 21 8.8V11" />
        <path d="M3 11h18v5H3z" />
        <path d="M5 16v3M19 16v3" />
      </svg>
    ) },
    { label: 'Bathrooms', value: bathrooms, icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={statIconClass}>
        <path d="M7 4h3a2 2 0 0 1 2 2v8" />
        <path d="M5 13h11a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-3z" />
        <path d="M7 8h5" />
      </svg>
    ) },
  ]), [bathrooms, bedrooms, guests])

  const openProperty = () => {
    if (!propertyId) return
    navigate(`/property/${propertyId}`)
  }

  const handleFavoriteToggle = async (event) => {
    event.stopPropagation()

    if (onToggleFavorite) {
      onToggleFavorite(propertyId)
      return
    }

    if (!user) {
      toast.info('Please login to save properties')
      navigate('/login')
      return
    }

    if (!propertyId || String(propertyId).length !== 24) {
      toast.error('This property is not available yet.')
      return
    }

    if (saving) return
    setSaving(true)

    try {
      if (savedState) {
        const removeId = favoriteId
        if (!removeId) {
          const response = await api.get(`/favorite/${user._id}`)
          const favorites = getFavoritesList(response)
          const found = favorites.find(
            (item) =>
              item?.property?._id?.toString() === String(propertyId) ||
              item?.property?.toString() === String(propertyId)
          )
          if (!found?._id) {
            toast.error('Saved item was not found.')
            return
          }
          await api.delete(`/favorite/${found._id}`)
        } else {
          await api.delete(`/favorite/${removeId}`)
        }

        setSaved(false)
        setFavoriteId(null)
        toast.success('Removed from saved properties')
      } else {
        await api.post('/favorite', { userId: user._id, propertyId })
        const response = await api.get(`/favorite/${user._id}`)
        const favorites = getFavoritesList(response)
        const found = favorites.find(
          (item) =>
            item?.property?._id?.toString() === String(propertyId) ||
            item?.property?.toString() === String(propertyId)
        )

        setSaved(Boolean(found))
        setFavoriteId(found?._id || null)
        toast.success('Property saved')
      }
    } catch (error) {
      if (error?.response?.status === 400 && error?.response?.data?.message === 'Already in favorites') {
        setSaved(true)
        toast.info('Property is already saved.')
      } else {
        toast.error('Could not update saved property.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <article
      className={`group overflow-hidden rounded-lg border border-[rgba(124,58,237,0.14)] bg-white text-[#1a0a2e] shadow-[0_18px_45px_rgba(26,10,46,0.07)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(124,58,237,0.28)] hover:shadow-[0_24px_60px_rgba(26,10,46,0.12)] ${className}`}
      role="button"
      tabIndex={0}
      onClick={openProperty}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openProperty()
        }
      }}
    >
      <div className="relative h-72 overflow-hidden bg-[#f4f0ff]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f5f3ff,#ffffff)]">
            <svg width="88" height="88" viewBox="0 0 80 80" fill="none" className="opacity-55">
              <path d="M10 70V35L40 10l30 25v35H52V50H28v20H10z" fill="#7c3aed" />
              <rect x="33" y="50" width="14" height="20" rx="2" fill="#c4b5fd" />
              <rect x="20" y="38" width="14" height="14" rx="2" fill="#ddd6fe" />
              <rect x="46" y="38" width="14" height="14" rx="2" fill="#ddd6fe" />
            </svg>
          </div>
        )}

        <div className={`absolute inset-0 bg-gradient-to-t ${accent.glow}`} />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className={`rounded ${badgeStyle} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white`}>
            {badgeLabel}
          </span>
          {property?.isVerified && (
            <span className="rounded bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#15803d] shadow-sm backdrop-blur">
              Verified
            </span>
          )}
        </div>

        {showFavorite && (
          <button
            type="button"
            onClick={handleFavoriteToggle}
            disabled={saving}
            aria-label={savedState ? 'Remove from saved properties' : 'Save property'}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/45 bg-white/85 text-lg shadow-lg backdrop-blur transition hover:scale-105 disabled:opacity-70"
          >
            {savedState ? '♥' : '♡'}
          </button>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">{propertyType}</div>
            <div className="mt-1 font-serif text-[2rem] font-bold leading-none text-white">
              {formatPrice(Number(property?.price) || 0)}
              <span className="ml-1.5 text-sm font-medium text-white/75">
                {listingType === 'rent' || listingType === 'pg' ? '/night' : '/listing'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded bg-[#1a0a2e]/78 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-[#f7c85a]">
              <path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span>{ratingText}</span>
            <span className="text-white/70">({reviewCount || 0})</span>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 pb-5 pt-4">
        <div>
          <h3 className="font-serif text-[1.7rem] leading-tight text-[#1a0a2e]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[rgba(26,10,46,0.62)]">
            {description.length > 108 ? `${description.slice(0, 105)}...` : description}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-[rgba(26,10,46,0.52)]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#7c3aed]">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
            <span>{locationText}</span>
          </div>
        </div>

        <div className={`grid ${statItems.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} rounded-lg border border-[rgba(124,58,237,0.14)] bg-[#f8f7ff] px-3 py-3`}>
          {statItems.map((item, itemIndex) => (
            <div
              key={item.label}
              className={`flex flex-col items-center justify-center gap-1.5 px-2 text-center ${itemIndex < statItems.length - 1 ? 'border-r border-[rgba(124,58,237,0.14)]' : ''}`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(26,10,46,0.45)]">{item.label}</span>
              <span className="text-base font-semibold text-[#1a0a2e]">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-[#f8f7ff] px-3 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7c3aed] text-sm font-bold text-white">
            {hostInitials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#1a0a2e]">
              Hosted by {hostVerified ? 'Verified Host' : hostName}
            </div>
            <div className="truncate text-xs text-[rgba(26,10,46,0.52)]">
              {hostVerified ? hostName : amenityText}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[rgba(124,58,237,0.12)] pt-4">
          <div>
            <div className="font-serif text-[1.9rem] font-bold leading-none text-[#1a0a2e]">
              {formatPrice(Number(property?.price) || 0)}
            </div>
            <div className="mt-1 text-sm text-[rgba(26,10,46,0.52)]">
              {listingType === 'rent' || listingType === 'pg' ? 'per night' : 'starting price'}
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              openProperty()
            }}
            className={`rounded-lg bg-gradient-to-r px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 ${accent.button} ${accent.ring}`}
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  )
}
