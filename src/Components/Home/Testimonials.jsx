import { useEffect, useMemo, useState } from 'react'
import { reviewService } from '../../services'

const FALLBACK_TESTIS = [
  {
    name: 'Rahul Khanna',
    role: 'Buyer - Bangalore',
    stars: 5,
    text: 'Found my dream apartment quickly. Listings were genuine and communication was smooth.',
    c: '#7c3aed',
  },
  {
    name: 'Sunita Patel',
    role: 'Property Owner - Pune',
    stars: 5,
    text: 'Listed my flat and got strong responses in a few days. Dashboard experience is very easy.',
    c: '#059669',
  },
  {
    name: 'Arun Mehta',
    role: 'Agent - Mumbai',
    stars: 4,
    text: 'The platform helps me track and manage property leads clearly and efficiently.',
    c: '#0891b2',
  },
]

const palette = ['#7c3aed', '#059669', '#0891b2', '#ea580c', '#dc2626', '#0ea5e9']
const FILLED_STAR = String.fromCodePoint(0x2605)
const EMPTY_STAR = String.fromCodePoint(0x2606)

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'PP'
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

const toTitleCase = (value = '') => {
  const text = String(value || '').trim().toLowerCase()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const resolveUserRole = (review) => {
  const fromUser = toTitleCase(review?.user?.role)
  if (fromUser) return fromUser

  const fromSnapshot = toTitleCase(review?.reviewerRole)
  if (fromSnapshot) return fromSnapshot

  return 'User'
}

const resolveCity = (review) => {
  return review?.property?.location?.city || 'India'
}

const resolveReviewerName = (review) => {
  const fromUser = review?.user?.name && String(review.user.name).trim()
  if (fromUser) return fromUser

  const fromSnapshot = review?.reviewerName && String(review.reviewerName).trim()
  if (fromSnapshot) return fromSnapshot

  if (typeof review?.user === 'string' && review.user.length >= 4) {
    return `User ${review.user.slice(-4)}`
  }

  return 'Verified User'
}

const mapReviewToTestimonial = (review, index) => {
  const name = resolveReviewerName(review)
  const rating = Number(review?.rating)
  const stars = Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating))) : 5

  return {
    id: review?._id || `review-${index}`,
    init: getInitials(name),
    name,
    role: `${resolveUserRole(review)} - ${resolveCity(review)}`,
    stars,
    text: review?.comment || 'Great platform experience.',
    c: palette[index % palette.length],
  }
}

export default function Testimonials() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadReviews = async () => {
      try {
        setLoading(true)
        const response = await reviewService.getLatest({ limit: 6 })
        const list = Array.isArray(response?.data) ? response.data : []

        if (mounted) {
          setReviews(list)
        }
      } catch {
        if (mounted) {
          setReviews([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadReviews()
    return () => {
      mounted = false
    }
  }, [])

  const testimonials = useMemo(() => {
    if (reviews.length) {
      return reviews.map(mapReviewToTestimonial)
    }

    return FALLBACK_TESTIS.map((item, index) => ({
      id: `fallback-${index}`,
      init: getInitials(item.name),
      ...item,
    }))
  }, [reviews])

  return (
    <section className="sec alt py-16 px-6 bg-[#f9f9ff]">
      <div className="wrap max-w-7xl mx-auto">
        <div className="r text-center mb-10" data-reveal>
          <h2 className="sec-h font-serif text-2xl font-extrabold text-[#1a0a2e]">
            What Users <span className="bg-linear-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">Say</span>
          </h2>
          <p className="sec-sub text-sm text-[rgba(26,10,46,0.4)] mt-1">
            {loading ? 'Loading latest feedback...' : 'Trusted by buyers, sellers and renters'}
          </p>
        </div>

        <div className="testi-grid grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5" id="testi-grid">
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              className={`testi bg-[#f0eeff] border border-[rgba(124,58,237,0.15)] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(124,58,237,0.3)] hover:shadow-xl r d${i + 1}`}
              data-reveal
            >
              <div className="stars text-[#a78bfa] text-sm tracking-widest mb-3">
                {FILLED_STAR.repeat(t.stars)}{EMPTY_STAR.repeat(5 - t.stars)}
              </div>
              <div className="overflow-hidden">
                <span className="quote-mark text-4xl text-[rgba(124,58,237,0.25)] font-serif leading-none float-left mr-2 mt-1">"</span>
                <p className="text-sm text-[rgba(26,10,46,0.7)] leading-relaxed italic">{t.text}</p>
              </div>
              <div className="mt-4 flex items-center gap-2.5">
                <div
                  className="av w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white shadow-md transition-transform group-hover:scale-110"
                  style={{ background: t.c }}
                >
                  {t.init}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#1a0a2e]">{t.name}</div>
                  <div className="text-xs text-[rgba(26,10,46,0.4)]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
