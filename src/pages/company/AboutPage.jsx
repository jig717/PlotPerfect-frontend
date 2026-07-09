import { useNavigate } from 'react-router-dom'
import Navbar from '../../Components/layout/Navbar'
import Footer from '../../Components/layout/Footer'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', background: '#f8f7ff', padding: '48px 6vw' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 18, padding: 28 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: '#1a0a2e', marginBottom: 10 }}>About PlotPerfect</h1>
          <p style={{ color: 'rgba(26,10,46,0.72)', lineHeight: 1.7 }}>
            PlotPerfect connects buyers, owners, agents, and support teams on one verified property platform. We focus on trusted listings, transparent communication, and role-based workflows.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/properties')} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Browse Properties</button>
            <button type="button" onClick={() => navigate('/new-projects')} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(124,58,237,0.28)', background: '#fff', color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}>See New Projects</button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
