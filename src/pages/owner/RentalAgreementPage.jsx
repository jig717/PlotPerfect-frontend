import { useNavigate } from 'react-router-dom'
import Navbar from '../../Components/layout/Navbar'
import Footer from '../../Components/layout/Footer'

export default function RentalAgreementPage() {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', background: '#f8f7ff', padding: '40px 6vw' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 18, padding: 24 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: '#1a0a2e', marginBottom: 10 }}>Rental Agreement</h1>
          <p style={{ color: 'rgba(26,10,46,0.65)', lineHeight: 1.7 }}>
            Owner and agent users can use this section as a guided checklist before finalizing tenant terms and rent details.
          </p>
          <ul style={{ marginTop: 14, color: 'rgba(26,10,46,0.72)', lineHeight: 1.8 }}>
            <li>Confirm tenant details and ID proof.</li>
            <li>Define rent amount, due date, and lock-in period.</li>
            <li>Document maintenance, deposit, and notice terms.</li>
          </ul>
          <button type="button" onClick={() => navigate('/support/create')} style={{ marginTop: 16, padding: '10px 14px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Request Legal Help</button>
        </div>
      </main>
      <Footer />
    </>
  )
}
