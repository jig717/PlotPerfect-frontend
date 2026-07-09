import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Cloudinary configuration
const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME

export default function PropertyCard({ card, index }) {
  const [fav, setFav] = useState(false)
  const navigate = useNavigate()
  const id = `fav-${index}`

  const toggleFav = (e) => {
    e.stopPropagation()
    setFav(!fav)
    const el = document.getElementById(id)
    if (el) {
      el.textContent = fav ? '🤍' : '❤️'
      el.style.transform = 'scale(1.4)'
      setTimeout(() => (el.style.transform = 'scale(1)'), 300)
    }
  }

  // Helper to build Cloudinary URL
  const getImageUrl = (publicId) => {
    if (!publicId) return null
    // If it's already a full URL, return as is (or you can still transform if it's Cloudinary)
    if (publicId.startsWith('http')) return publicId
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_240,c_fill,q_auto,f_auto/${publicId}`
  }
  return (
    <div
      className={`prop-card bg-[#e8e4ff] border border-[rgba(124,58,237,0.15)] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[rgba(124,58,237,0.4)] r d${index + 1} group`}
      data-reveal
      onClick={() => navigate(`/property/${card._id || card.id}`)}
    >
      <div className="card-img relative h-48 overflow-hidden">
        <div className="card-img-bg w-full h-full flex items-center justify-center transition-transform duration-400">
          {card.images?.[0] ? (
            <img
              src={getImageUrl(card.images[0])}
              alt={card.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
            />
          ) : (
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none" className="opacity-35">
              <path d="M10 70V35L40 10l30 25v35H52V50H28v20H10z" fill="#a78bfa" />
              <rect x="33" y="50" width="14" height="20" rx="2" fill="#c4b5fd" />
              <rect x="20" y="38" width="14" height="14" rx="2" fill="#c4b5fd" />
              <rect x="46" y="38" width="14" height="14" rx="2" fill="#c4b5fd" />
            </svg>
          )}
        </div>
        <span
          className={`cb absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${card.cls}`}
          style={{ background: card.bc }}
        >
          {card.badge}
        </span>
        {card.isNew && (
          <span className="cb cb-new absolute top-2.5 right-11 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
            NEW
          </span>
        )}
        <div
          className="fav absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-sm cursor-pointer backdrop-blur-sm transition-all duration-300 hover:scale-120 hover:bg-[rgba(124,58,237,0.35)] hover:border-[#7c3aed]"
          id={id}
          onClick={toggleFav}
        >
          🤍
        </div>
      </div>

      <div className="card-body p-4">
        <div className="card-price font-serif text-xl font-extrabold text-[#1a0a2e]">
          {card.price} <sub className="text-[11.5px] font-normal text-[rgba(26,10,46,0.4)]">{card.sub}</sub>
        </div>
        <div className="card-title text-sm font-semibold text-[rgba(26,10,46,0.7)] my-1 leading-tight">{card.title}</div>
        <div className="card-loc text-[11.5px] text-[rgba(26,10,46,0.4)] flex items-center gap-0.5 mb-2">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          {card.loc}
        </div>
        <div className="flex gap-1 flex-wrap">
          {card.chips.map((ch, i) => (
            <span key={i} className="chip bg-[rgba(255,255,255,0.06)] border border-[rgba(124,58,237,0.15)] text-[rgba(26,10,46,0.4)] text-[11px] px-2 py-0.5 rounded font-medium">
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div className="card-foot p-4 border-t border-[rgba(124,58,237,0.15)] flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-md"
            style={{ background: card.initC }}
          >
            {card.init}
          </div>
          <span className="text-[11.5px] text-green-600 font-semibold">✓ Verified</span>
        </div>
        <button
          className="card-btn px-3 py-1.5 rounded border border-[rgba(124,58,237,0.45)] text-[#a78bfa] text-[11.5px] font-bold bg-transparent hover:bg-[#7c3aed] hover:text-white transition"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/property/${card._id || card.id}`)
          }}
        >
          Contact
        </button>
      </div>
    </div>
  )
}