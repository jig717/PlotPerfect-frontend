import { useNavigate } from 'react-router-dom'
import Navbar from '../../Components/layout/Navbar'
import Footer from '../../Components/layout/Footer'

export default function HomeLoansPage() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', background: '#f8f7ff', padding: '40px 6vw' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 18, padding: 24 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: '#1a0a2e', marginBottom: 10 }}>Home Loans</h1>
          <p style={{ color: 'rgba(26,10,46,0.65)', lineHeight: 1.7 }}>
            Explore properties and compare your budget range before applying for a home loan. We recommend reviewing city-wise pricing and shortlisting properties first.
          </p>
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/properties')} style={{ padding: '10px 14px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Browse Properties</button>
            <button type="button" onClick={() => navigate('/property-valuation')} style={{ padding: '10px 14px', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, background: '#fff', color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}>Check Valuation</button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
