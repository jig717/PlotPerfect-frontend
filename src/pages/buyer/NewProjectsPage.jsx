import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../Components/layout/Navbar'
import Footer from '../../Components/layout/Footer'
import { propertyService } from '../../services'
import { formatPrice } from '../../utils'

export default function NewProjectsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await propertyService.getAll({})
        const list = Array.isArray(res?.data) ? res.data : []
        const sorted = list
          .filter((p) => String(p?.purpose || '').toLowerCase() === 'sale')
          .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
          .slice(0, 12)
        if (mounted) setItems(sorted)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  const cards = useMemo(() => items.map((p) => ({
    id: p._id,
    title: p.title || 'Project',
    city: p?.location?.city || 'City not specified',
    price: Number(p.price) || 0,
  })), [items])

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', background: '#f8f7ff', padding: '40px 6vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: '#1a0a2e', marginBottom: 10 }}>New Projects</h1>
          <p style={{ color: 'rgba(26,10,46,0.65)', marginBottom: 18 }}>Latest sale listings from real property data.</p>
          {loading ? <p>Loading projects...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
              {cards.map((c) => (
                <button key={c.id} type="button" onClick={() => navigate(`/property/${c.id}`)} style={{ textAlign: 'left', background: '#fff', border: '1px solid rgba(124,58,237,0.14)', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, color: '#1a0a2e', marginBottom: 6 }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.55)', marginBottom: 6 }}>{c.city}</div>
                  <div style={{ color: '#7c3aed', fontWeight: 800 }}>{formatPrice(c.price)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
