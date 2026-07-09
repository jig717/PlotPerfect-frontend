import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../Components/layout/Navbar'
import Footer from '../../Components/layout/Footer'
import { supportService } from '../../services'
import { toast } from 'react-toastify'

export default function SupportCenterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    subject: '',
    message: '',
    category: 'Other',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleCreateTicket = async (e) => {
    e.preventDefault()

    if (!user) {
      toast.info('Please login to submit a support ticket')
      navigate('/login')
      return
    }

    setSubmitting(true)
    try {
      await supportService.createTicket({
        subject: form.subject,
        message: form.message,
        category: form.category,
      })
      toast.success('Support ticket submitted successfully')
      setForm({ subject: '', message: '', category: 'Other' })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit support ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', background: '#f8f7ff', padding: '48px 6vw' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', background: '#fff', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 18, padding: 28 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, color: '#1a0a2e', marginBottom: 10 }}>Support Center</h1>
          <p style={{ color: 'rgba(26,10,46,0.72)', lineHeight: 1.7, marginBottom: 20 }}>
            Get help with listings, inquiries, profile issues and account operations. Access is role-based and authenticated.
          </p>

          {user?.role === 'support' ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/support')}
                style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Open Support Dashboard
              </button>
            </div>
          ) : (
            <>
              {!user && (
                <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: 'rgba(124,58,237,0.08)', color: '#4b2a8d', fontSize: 13 }}>
                  Login is required to submit a support ticket.
                </div>
              )}

              <form onSubmit={handleCreateTicket} style={{ display: 'grid', gap: 12 }}>
                <input
                  type="text"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  required
                  style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(124,58,237,0.22)', padding: '0 12px', outline: 'none' }}
                />
                <textarea
                  placeholder="Describe your issue"
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  required
                  rows={4}
                  style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(124,58,237,0.22)', padding: 12, outline: 'none', resize: 'vertical' }}
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  style={{ width: '100%', height: 44, borderRadius: 10, border: '1px solid rgba(124,58,237,0.22)', padding: '0 12px', outline: 'none' }}
                >
                  <option>Payment</option>
                  <option>Property</option>
                  <option>Account</option>
                  <option>Other</option>
                </select>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ width: 'fit-content', padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
