import Navbar from '../../Components/layout/Navbar'
import Footer from '../../Components/layout/Footer'

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', background: '#f8f7ff', padding: '48px 6vw' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 18, padding: 28 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: '#1a0a2e', marginBottom: 10 }}>Privacy Policy</h1>
          <p style={{ color: 'rgba(26,10,46,0.72)', lineHeight: 1.7 }}>
            PlotPerfect stores only required account and listing data to provide property discovery, messaging, dashboard analytics, and support operations. We do not sell personal data.
          </p>
          <ul style={{ marginTop: 14, color: 'rgba(26,10,46,0.72)', lineHeight: 1.8 }}>
            <li>Authentication data is protected with token-based access.</li>
            <li>Listing and inquiry data is role-protected on dashboards.</li>
            <li>Users can request support assistance for account updates.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  )
}
