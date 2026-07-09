  // src/pages/dashboard/SupportDashboard.jsx
  import { useState, useEffect, useCallback } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { useAuth } from '../../context/AuthContext'
  import { inquiryService, supportService } from '../../services'
  import { timeAgo, getInitials } from '../../utils/index'
  import { toast } from 'react-toastify'
  import NotificationBell from '../../Components/ui/NotificationBell'
  import ThreadPanel from '../../Components/messaging/ThreadPanel'


  const TABS = ['Tickets', 'Inquiries']

  const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed']

  const STATUS_STYLE = {
    'Open':        { bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
    'In Progress': { bg: '#e0f2fe', color: '#0284c7', dot: '#0891b2' },
    'Resolved':    { bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
    'Closed':      { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
  }

  /* ────────────────────────────────────────
    TICKET CARD
  ──────────────────────────────────────── */
  function TicketCard({ ticket, onStatusChange }) {
    const [updating, setUpdating] = useState(false)
    const [status, setStatus] = useState(ticket.status || 'Open')
    const st = STATUS_STYLE[status] || STATUS_STYLE['Open']

    const handleStatusChange = async (newStatus) => {
      setUpdating(true)
      try {
        // Optimistic update — no page reload needed
        setStatus(newStatus)
        await supportService.updateTicket(ticket._id, { status: newStatus })
        toast.success(`Ticket marked as "${newStatus}"`)
        onStatusChange?.(ticket._id, newStatus)
      } catch {
        setStatus(ticket.status) // revert on failure
        toast.error('Failed to update ticket status')
      } finally {
        setUpdating(false)
      }
    }

    return (
      <div style={{
        background: '#fff',
        border: '1px solid rgba(124,58,237,0.1)',
        borderRadius: 14,
        padding: '18px 20px',
        transition: 'all .2s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.1)'}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', background: '#f0eeff', padding: '2px 8px', borderRadius: 5, marginRight: 8 }}>
              #{ticket._id?.slice(-6).toUpperCase()}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a0a2e' }}>
              {ticket.subject || 'Support Ticket'}
            </span>
          </div>

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: st.bg, color: st.color, fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block' }}/>
            {status}
          </div>
        </div>

        {/* Message */}
        <p style={{ fontSize: 13.5, color: 'rgba(26,10,46,0.65)', lineHeight: 1.65, marginBottom: 12 }}>
          {ticket.message || ticket.description || 'No message provided.'}
        </p>
        
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
              {getInitials(ticket.user?.name || ticket.user?.username || '?')}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a0a2e' }}>
                {ticket.user?.name || ticket.user?.username || 'Unknown User'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(26,10,46,0.4)' }}>
                {ticket.user?.email || ''} · {timeAgo(ticket.createdAt)}
              </div>
            </div>
          </div>

          {/* Status dropdown — NO window.location.reload() */}
          <select
            value={status}
            disabled={updating}
            onChange={e => handleStatusChange(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1.5px solid rgba(124,58,237,0.2)',
              background: updating ? '#f8f7ff' : '#fff',
              color: '#1a0a2e',
              fontSize: 13,
              fontWeight: 600,
              cursor: updating ? 'not-allowed' : 'pointer',
              outline: 'none',
              fontFamily: "'DM Sans',sans-serif",
              opacity: updating ? 0.6 : 1,
              transition: 'all .2s',
            }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  /* ────────────────────────────────────────
    INQUIRY CARD
  ──────────────────────────────────────── */
  function InquiryCard({ inquiry, onOpenConversation }) {
    return (
      <div style={{
        background: '#fff',
        border: '1px solid rgba(124,58,237,0.1)',
        borderRadius: 14,
        padding: '18px 20px',
        transition: 'all .2s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.1)'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {getInitials(inquiry.name || inquiry.user?.name || '?')}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a0a2e' }}>
                {inquiry.name || inquiry.user?.name || inquiry.user?.username || 'Buyer'}
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(26,10,46,0.4)' }}>
                {inquiry.email || inquiry.user?.email || ''} {inquiry.phone ? `· ${inquiry.phone}` : ''}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: 'rgba(26,10,46,0.35)', whiteSpace: 'nowrap' }}>
            {timeAgo(inquiry.createdAt)}
          </span>
        </div>

        <p style={{ fontSize: 13.5, color: 'rgba(26,10,46,0.65)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 10 }}>
          "{inquiry.message}"
        </p>

        {/* Property reference */}
        {inquiry.property && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0eeff', color: '#7c3aed', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 6 }}>
            🏠 {inquiry.property?.title || 'Property'}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={() => onOpenConversation?.(inquiry)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.28)', background: '#fff', color: '#7c3aed', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Open Chat
          </button>
        </div>
      </div>
    )
  }

  /* ────────────────────────────────────────
    SKELETON LOADER
  ──────────────────────────────────────── */
  function SkeletonCard() {
    return (
      <div style={{ background: '#fff', border: '1px solid rgba(124,58,237,0.08)', borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ height: 14, width: '40%', background: 'linear-gradient(90deg,#f0eeff,#ede9fe,#f0eeff)', backgroundSize: '200%', animation: 'pp-shimmer 1.5s infinite', borderRadius: 6 }}/>
          <div style={{ height: 14, width: '20%', background: 'linear-gradient(90deg,#f0eeff,#ede9fe,#f0eeff)', backgroundSize: '200%', animation: 'pp-shimmer 1.5s infinite', borderRadius: 6 }}/>
        </div>
        <div style={{ height: 13, width: '85%', background: 'linear-gradient(90deg,#f0eeff,#ede9fe,#f0eeff)', backgroundSize: '200%', animation: 'pp-shimmer 1.5s infinite', borderRadius: 6, marginBottom: 8 }}/>
        <div style={{ height: 13, width: '65%', background: 'linear-gradient(90deg,#f0eeff,#ede9fe,#f0eeff)', backgroundSize: '200%', animation: 'pp-shimmer 1.5s infinite', borderRadius: 6 }}/>
      </div>
    )
  }

  /* ────────────────────────────────────────
    EMPTY STATE
  ──────────────────────────────────────── */
  function EmptyState({ icon, title, sub }) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid rgba(124,58,237,0.08)' }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>{icon}</div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 800, color: '#1a0a2e', marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'rgba(26,10,46,0.45)', fontSize: 14 }}>{sub}</p>
      </div>
    )
  }

  /* ────────────────────────────────────────
    MAIN DASHBOARD
  ──────────────────────────────────────── */
  export default function SupportDashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [tab,setTab]       = useState(0)
    const [tickets, setTickets]   = useState([])
    const [inquiries, setInquiries] = useState([])
    const [inquirySearch, setInquirySearch] = useState('')
    const [activeInquiry, setActiveInquiry] = useState(null)
    const [loading, setLoading]   = useState(true)

    const loadData = useCallback(async () => {
  setLoading(true);
  try {
    const [ticketRes, inquiryRes] = await Promise.allSettled([
      supportService.getAllTickets(),
      inquiryService.getAll(),
    ]);

    if (ticketRes.status === 'fulfilled') {
      const ticketsData = ticketRes.value;
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } else {
      console.error("Ticket API failed:", ticketRes.reason);
      setTickets([]);
    }

    if (inquiryRes.status === 'fulfilled') {
      const d = inquiryRes.value;
      setInquiries(Array.isArray(d.data) ? d.data : []);
    } else {
      console.error("Inquiry API failed:", inquiryRes.reason);
      setInquiries([]);
    }
  } catch (err) {
    console.error("Dashboard load error:", err);
    toast.error('Failed to load support data');
  } finally {
    setLoading(false);
  }
}, []);

    // change to sequential loading to avoid Promise.allSettled swallowing errors and causing silent failures
//   const loadData = useCallback(async () => {
//   setLoading(true)
//   try {
//     const [ticketRes, inquiryRes] = await Promise.allSettled([
//       supportService.getAllTickets(),
//       inquiryService.getReceived(),
//     ])

//     // ✅ safe ticket handling
//     if (ticketRes.status === 'fulfilled') {
//       const d = ticketRes.value?.data
//       setTickets(Array.isArray(d) ? d : d?.tickets || [])
//     } else {
//       console.error("Ticket API failed:", ticketRes.reason)
//       setTickets([])
//     }

//     // ✅ safe inquiry handling
//     if (inquiryRes.status === 'fulfilled') {
//       const d = inquiryRes.value?.data
//       setInquiries(Array.isArray(d) ? d : [])
//     } else {
//       console.error("Inquiry API failed:", inquiryRes.reason)
//       setInquiries([])
//     }

//   } catch (err) {
//     console.error("Dashboard load error:", err)
//     toast.error('Failed to load support data')
//   } finally {
//     setLoading(false)
//   }
// }, [])
  
    useEffect(() => { loadData() }, [loadData])

    // Optimistic status update — no page reload
    const handleStatusChange = (ticketId, newStatus) => {
      setTickets(prev =>
        prev.map(t => (t._id === ticketId ? { ...t, status: newStatus } : t))
      )
    }

    const filteredInquiries = inquiries
      .slice()
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .filter((inquiry) => {
        const keyword = inquirySearch.trim().toLowerCase()
        if (!keyword) return true
        const name = String(inquiry?.name || inquiry?.user?.name || inquiry?.user?.username || '').toLowerCase()
        return name.includes(keyword)
      })

    const tabContent = [
      /* ── TICKETS TAB ── */
      <div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState icon="🎫" title="No tickets yet" sub="All support tickets will appear here"/>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map(t => (
              <TicketCard key={t._id} ticket={t} onStatusChange={handleStatusChange}/>
            ))}
          </div>
        )}
      </div>,

      /* ── INQUIRIES TAB ── */
      <div>
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }}>
            {inquiries.length} Total Inquiries
          </span>
        </div>
        <input
          type="text"
          value={inquirySearch}
          onChange={(event) => setInquirySearch(event.target.value)}
          placeholder="Search by sender name..."
          style={{ width: '100%', maxWidth: 320, height: 36, borderRadius: 10, border: '1px solid rgba(124,58,237,0.2)', background: '#faf8ff', color: '#1a0a2e', padding: '0 12px', fontSize: 13, marginBottom: 14, outline: 'none' }}
        />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : inquiries.length === 0 ? (
          <EmptyState icon="💬" title="No inquiries yet" sub="Property inquiries will appear here"/>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredInquiries.map(i => (
              <InquiryCard key={i._id} inquiry={i} onOpenConversation={setActiveInquiry} />
            ))}
          </div>
        )}
      </div>,
    ]

    return (
      <div className="support-shell" style={{ background: 'linear-gradient(180deg, #f6fbff 0%, #f8f7ff 26%, #ffffff 100%)', minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
          *{box-sizing:border-box;}
          .support-shell::before {
            content: '';
            position: absolute;
            inset: 0 0 auto;
            height: 320px;
            background:
              radial-gradient(circle at top left, rgba(6,182,212,0.18), transparent 34%),
              radial-gradient(circle at top right, rgba(124,58,237,0.16), transparent 40%);
            pointer-events: none;
          }
          @media (max-width: 768px) {
            .support-layout {
              flex-direction: column !important;
            }
            .support-sidebar {
              width: 100% !important;
              max-width: 100% !important;
              border-right: none !important;
              border-bottom: 1px solid rgba(124,58,237,0.1) !important;
            }
            .support-chat-panel {
              width: 100% !important;
            }
            .support-header-row {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 10px !important;
            }
            .support-header-actions {
              flex-wrap: wrap !important;
            }
            .support-content {
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
          }
        `}</style>

        {/* ── HEADER ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,249,255,0.95))',
          borderBottom: '1px solid rgba(124,58,237,0.1)',
          padding: '20px 6vw 24px',
          boxShadow: '0 20px 60px rgba(6,182,212,0.08)',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* Top row */}
            <div className="support-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
              {/* Left — avatar + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', boxShadow: '0 4px 16px rgba(124,58,237,0.25)', flexShrink: 0 }}>
                  {getInitials(user?.username || user?.name)}
                </div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: '#1a0a2e' }}>
                    Support Dashboard
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.45)', marginTop: 2 }}>
                    {user?.email} ·{' '}
                    <span style={{ color: '#7c3aed', fontWeight: 600, textTransform: 'capitalize' }}>
                      {user?.role || 'Support'}
                    </span>
                  </div>
                </div>
              </div>

      {/* Right — actions */}
              <div className="support-header-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    padding: '9px 16px',
                    background: '#ffffff',
                    border: '1.5px solid rgba(124,58,237,0.22)',
                    borderRadius: 9,
                    color: '#7c3aed',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  ← Back to Website
                </button>
                <NotificationBell user={user} />
                <button
                  onClick={() => navigate('/support/create')}
                  style={{
                    padding: '9px 16px',
                    background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                    border: 'none',
                    borderRadius: 9,
                    color: '#fff',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124,58,237,0.35)'
                  }}
                >
                  + Create Ticket
                </button>
                <button
                  onClick={loadData}
                  style={{
                    padding: '9px 16px',
                    background: '#f0eeff',
                    border: '1.5px solid rgba(124,58,237,0.2)',
                    borderRadius: 9,
                    color: '#7c3aed',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => { logout(); navigate('/') }}
                  style={{ padding: '9px 16px', background: '#fff', border: '1.5px solid rgba(124,58,237,0.15)', borderRadius: 9, color: 'rgba(26,10,46,0.5)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {TABS.map((t, i) => (
                <button key={t} onClick={() => setTab(i)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 999,
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: "'DM Sans',sans-serif",
                    transition: 'all .2s',
                    background: tab === i ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(124,58,237,0.08)',
                    color: tab === i ? '#fff' : '#7c3aed',
                  }}>
                  {t}
                  {/* Badge count */}
                  {i === 0 && tickets.length > 0 && (
                    <span style={{ marginLeft: 6, background: '#7c3aed', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {tickets.length}
                    </span>
                  )}
                  {i === 1 && inquiries.length > 0 && (
                    <span style={{ marginLeft: 6, background: '#7c3aed', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {inquiries.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="support-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 6vw 60px' }}>
          {tabContent[tab]}
        </div>
        {activeInquiry && (
          <ThreadPanel inquiry={activeInquiry} user={user} onClose={() => setActiveInquiry(null)} />
        )}
      </div>
    )
  }
