import { useNavigate } from 'react-router-dom'
import Navbar from '../../Components/layout/Navbar'
import Footer from '../../Components/layout/Footer'

export default function CareersPage() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', background: '#f8f7ff', padding: '48px 6vw' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 18, padding: 28 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: '#1a0a2e', marginBottom: 10 }}>Careers</h1>
          <p style={{ color: 'rgba(26,10,46,0.72)', lineHeight: 1.7 }}>
            We're building high-impact real estate products for India. Join us if you enjoy solving practical problems and shipping reliable experiences.
          </p>
          <div style={{ marginTop: 20 }}>
            <button type="button" onClick={() => navigate('/support-center')} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(124,58,237,0.28)', background: '#fff', color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}>Contact Hiring Team</button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
