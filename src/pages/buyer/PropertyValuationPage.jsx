import { useEffect, useMemo, useState } from 'react'
import Navbar from '../../Components/layout/Navbar'
import Footer from '../../Components/layout/Footer'
import { propertyService } from '../../services'
import { formatPrice } from '../../utils'

const topCityRows = (properties) => {
  const map = {}
  properties.forEach((p) => {
    const city = p?.location?.city || p?.city
    const price = Number(p?.price) || 0
    if (!city || !price) return
    if (!map[city]) map[city] = { total: 0, count: 0 }
    map[city].total += price
    map[city].count += 1
  })
  return Object.entries(map)
    .map(([city, stat]) => ({ city, avg: stat.total / stat.count, count: stat.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

export default function PropertyValuationPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await propertyService.getAll({})
        const list = Array.isArray(res?.data) ? res.data : []
        if (mounted) setRows(topCityRows(list))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  const totalSample = useMemo(() => rows.reduce((acc, row) => acc + row.count, 0), [rows])

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', background: '#f8f7ff', padding: '40px 6vw' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 18, padding: 24 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: '#1a0a2e', marginBottom: 10 }}>Property Valuation</h1>
          <p style={{ color: 'rgba(26,10,46,0.65)', lineHeight: 1.7, marginBottom: 12 }}>
            Live city-level average prices derived from current listings.
          </p>
          {loading ? <p>Calculating valuation data...</p> : (
            <>
              <p style={{ fontSize: 13, color: 'rgba(26,10,46,0.55)', marginBottom: 12 }}>Sample size: {totalSample} listings</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(124,58,237,0.12)' }}>City</th>
                      <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(124,58,237,0.12)' }}>Listings</th>
                      <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(124,58,237,0.12)' }}>Average Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.city}>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(124,58,237,0.08)' }}>{row.city}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(124,58,237,0.08)' }}>{row.count}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(124,58,237,0.08)', fontWeight: 700, color: '#7c3aed' }}>{formatPrice(Math.round(row.avg))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
