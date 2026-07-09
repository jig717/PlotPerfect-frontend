import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { userService, inquiryService, threadService, propertyService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { formatPrice, timeAgo, getInitials, resolveApiAssetUrl } from '../../utils/index'
import { toast } from 'react-toastify'
import visitService from '../../services/visitService'
import ThreadPanel from '../../Components/messaging/ThreadPanel'
import NotificationBell from '../../Components/ui/NotificationBell'

const TABS = ['Overview', 'Saved Properties', 'Scheduled Visits', 'My Inquiries']

const theme = {
  bg: '#f5f3ff',
  surface: '#ffffff',
  surfaceSoft: '#f9f7ff',
  border: 'rgba(109, 40, 217, 0.12)',
  borderStrong: 'rgba(109, 40, 217, 0.22)',
  text: '#1f1147',
  textSoft: 'rgba(31, 17, 71, 0.64)',
  textMute: 'rgba(31, 17, 71, 0.48)',
  primary: '#6d28d9',
  primaryDeep: '#4c1d95',
  primarySoft: 'rgba(109, 40, 217, 0.08)',
  shadow: '0 18px 45px rgba(76, 29, 149, 0.10)',
}

const extractVisitsList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.visits)) return payload.visits
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const getVisitStatus = (visit) => visit?.status || visit?.visit_status || 'REQUESTED'
const getVisitDate = (visit) => visit?.scheduledDate || visit?.scheduled_date || null
const getVisitBuyerId = (visit) =>
  visit?.buyer?._id || visit?.buyer_id || visit?.buyerId || visit?.user?._id || visit?.userId || null
const getVisitPropertyId = (visit) =>
  visit?.property?._id ||
  visit?.property?.id ||
  (typeof visit?.property === 'string' ? visit.property : null) ||
  visit?.propertyId ||
  visit?.property_id ||
  null

const getVisitPropertyTitle = (visit) => visit?.property?.title || 'Property Visit'
const getVisitPropertyLocation = (visit) => visit?.property?.city || visit?.property?.location?.city || 'Location not specified'

const sortVisits = (items) => {
  const statusOrder = { REQUESTED: 0, CONFIRMED: 1, COMPLETED: 2, CANCELLED: 3 }

  return [...items].sort((a, b) => {
    const aStatus = String(getVisitStatus(a)).toUpperCase()
    const bStatus = String(getVisitStatus(b)).toUpperCase()
    const byStatus = (statusOrder[aStatus] ?? 99) - (statusOrder[bStatus] ?? 99)
    if (byStatus !== 0) return byStatus

    const aCreatedAt = a?.createdAt ? new Date(a.createdAt).getTime() : 0
    const bCreatedAt = b?.createdAt ? new Date(b.createdAt).getTime() : 0
    if (aCreatedAt !== bCreatedAt) return bCreatedAt - aCreatedAt

    const aDate = getVisitDate(a) ? new Date(getVisitDate(a)).getTime() : 0
    const bDate = getVisitDate(b) ? new Date(getVisitDate(b)).getTime() : 0
    return bDate - aDate
  })
}

const extractThreads = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const getParticipantUserId = (participant) => participant?.user?._id || participant?.user || null

const baseCardStyle = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 24,
  boxShadow: theme.shadow,
}

const actionButtonBase = {
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease',
}

const getStatusTone = (status) => {
  switch (String(status).toUpperCase()) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return { color: '#047857', background: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.18)' }
    case 'CANCELLED':
      return { color: '#dc2626', background: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.16)' }
    default:
      return { color: theme.primary, background: 'rgba(109, 40, 217, 0.10)', border: 'rgba(109, 40, 217, 0.16)' }
  }
}

function DashboardShell({ children }) {
  return <div style={{ ...baseCardStyle, padding: 24 }}>{children}</div>
}

function SectionHeading({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: theme.text }}>{title}</div>
        {sub ? <div style={{ fontSize: 14, color: theme.textSoft, marginTop: 4 }}>{sub}</div> : null}
      </div>
      {action}
    </div>
  )
}

function ActionButton({ children, onClick, variant = 'soft', disabled = false }) {
  const styles =
    variant === 'primary'
      ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`, color: '#ffffff', boxShadow: '0 12px 24px rgba(109, 40, 217, 0.22)', padding: '12px 18px', borderRadius: 999 }
      : variant === 'danger'
        ? { background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.18)', padding: '10px 16px', borderRadius: 14 }
        : { background: theme.primarySoft, color: theme.primary, border: `1px solid ${theme.borderStrong}`, padding: '10px 16px', borderRadius: 14 }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...actionButtonBase, ...styles, opacity: disabled ? 0.65 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      onMouseEnter={(event) => {
        if (!disabled) event.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {children}
    </button>
  )
}

function PropertyThumb({ property }) {
  const imageSrc = resolveApiAssetUrl(property?.images?.[0] || property?.image || property?.thumbnail || '')

  if (imageSrc) {
    return <img src={imageSrc} alt={property?.title || 'Property'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(109,40,217,0.14), rgba(167,139,250,0.26))', color: theme.primaryDeep, fontWeight: 800, fontSize: 22 }}>
      PP
    </div>
  )
}

function PropertyMeta({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textMute, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: theme.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

function PropRow({ prop, onUnsave, favoriteId, propertyId }) {
  const navigate = useNavigate()
  const [isRemoving, setIsRemoving] = useState(false)

  if (!prop) {
    return (
      <DashboardShell>
        <div style={{ color: '#dc2626', fontWeight: 700, marginBottom: 10 }}>Property data is missing.</div>
        {onUnsave ? <ActionButton onClick={() => onUnsave(favoriteId, propertyId)} variant="danger">Remove Broken Favorite</ActionButton> : null}
      </DashboardShell>
    )
  }

  const handleRemoveClick = async () => {
    const confirmRemove = window.confirm(`Remove "${prop.title}" from saved properties?`)
    if (!confirmRemove) return

    setIsRemoving(true)
    try {
      await onUnsave(favoriteId, prop._id)
    } catch {
      // Parent already handles the toast message.
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="buyer-card buyer-row-card" style={{ ...baseCardStyle, padding: 18 }}>
      <div className="buyer-property-row" style={{ display: 'grid', gridTemplateColumns: '132px minmax(0, 1fr) auto', gap: 18, alignItems: 'center' }}>
        <div style={{ width: '100%', height: 100, overflow: 'hidden', borderRadius: 18, background: theme.surfaceSoft }}>
          <PropertyThumb property={prop} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: theme.text, marginBottom: 8 }}>
            {prop.title || 'Untitled Property'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
            <PropertyMeta label="Location" value={prop.city || prop.location?.city || 'Not specified'} />
            <PropertyMeta label="Price" value={formatPrice(prop.price)} />
            <PropertyMeta label="Type" value={prop.type || prop.category || 'Property'} />
          </div>
        </div>

        <div className="buyer-row-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <ActionButton
            onClick={() => {
              const targetId = prop._id || prop.id
              if (targetId && targetId !== 'undefined') {
                navigate(`/property/${targetId}`)
              } else {
                toast.warn('Property details unavailable.')
              }
            }}
          >
            View Property
          </ActionButton>
          {onUnsave ? (
            <ActionButton onClick={handleRemoveClick} variant="danger" disabled={isRemoving}>
              {isRemoving ? 'Removing...' : 'Remove'}
            </ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function VisitCard({ visit, onCancel }) {
  const navigate = useNavigate()
  const [isCancelling, setIsCancelling] = useState(false)
  const visitStatus = getVisitStatus(visit)
  const visitDate = getVisitDate(visit)
  const date = visitDate ? new Date(visitDate) : null
  const statusTone = getStatusTone(visitStatus)

  const handleCancel = async () => {
    const confirmCancel = window.confirm(`Cancel visit to "${visit.property?.title || 'this property'}"?`)
    if (!confirmCancel) return

    setIsCancelling(true)
    try {
      await onCancel(visit._id)
    } catch {
      // Parent already handles the toast message.
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="buyer-card" style={{ ...baseCardStyle, padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: theme.text }}>
            {getVisitPropertyTitle(visit)}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
            <PropertyMeta
              label="Date"
              value={
                date
                  ? `${date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                  : 'To be confirmed'
              }
            />
            <PropertyMeta label="Location" value={getVisitPropertyLocation(visit)} />
          </div>
        </div>

        <span style={{ padding: '8px 12px', borderRadius: 999, background: statusTone.background, color: statusTone.color, border: `1px solid ${statusTone.border}`, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
          {visitStatus}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
        <ActionButton
          onClick={() => {
            const targetId = visit.property?._id || visit.property?.id
            if (targetId && targetId !== 'undefined') {
              navigate(`/property/${targetId}`)
            } else {
              toast.warn('Property details unavailable.')
            }
          }}
        >
          View Property
        </ActionButton>
        {String(visitStatus).toUpperCase() !== 'CANCELLED' ? (
          <ActionButton onClick={handleCancel} variant="danger" disabled={isCancelling}>
            {isCancelling ? 'Cancelling...' : 'Cancel Visit'}
          </ActionButton>
        ) : null}
      </div>
    </div>
  )
}

function InquiryCard({ inquiry, onOpenConversation }) {
  const hasResponse = Boolean(inquiry.response)

  return (
    <div className="buyer-card" style={{ ...baseCardStyle, padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: theme.text }}>
            {inquiry.property?.title || 'Property Inquiry'}
          </div>
          <div style={{ fontSize: 13, color: theme.primary, fontWeight: 700, marginTop: 8 }}>Sent by: {inquiry.user?.name || 'You'}</div>
        </div>
        <div style={{ fontSize: 13, color: theme.textMute }}>{timeAgo(inquiry.createdAt)}</div>
      </div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 18, background: theme.surfaceSoft, color: theme.textSoft, lineHeight: 1.7 }}>
        "{inquiry.message}"
      </div>

      {hasResponse ? (
        <div style={{ marginTop: 14, padding: 16, borderRadius: 18, background: 'rgba(109, 40, 217, 0.08)', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: theme.primary, fontWeight: 800, marginBottom: 6 }}>Owner Response</div>
          <div style={{ color: theme.textSoft, lineHeight: 1.7 }}>{inquiry.response}</div>
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
        <ActionButton onClick={() => onOpenConversation?.(inquiry)}>Open Conversation</ActionButton>
      </div>
    </div>
  )
}

function EmptyState({ title, sub, btn, to, onClick }) {
  const navigate = useNavigate()

  return (
    <DashboardShell>
      <div style={{ textAlign: 'center', padding: '28px 12px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, color: theme.text, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 15, color: theme.textSoft, maxWidth: 430, margin: '0 auto 22px' }}>{sub}</div>
        <ActionButton onClick={onClick || (() => navigate(to))} variant="primary">{btn}</ActionButton>
      </div>
    </DashboardShell>
  )
}

function Overview({ saved, visits, inquiries, onOpenSavedTab }) {
  const navigate = useNavigate()
  const validSaved = saved.filter((item) => item && item.property)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {validSaved.length > 0 ? (
        <DashboardShell>
          <SectionHeading title="Recently Saved" sub="A quick look at the properties you marked for later." action={validSaved.length > 3 ? <ActionButton onClick={onOpenSavedTab}>View All Saved</ActionButton> : null} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {validSaved.slice(0, 3).map((item) => <PropRow key={item._id} prop={item.property} />)}
          </div>
        </DashboardShell>
      ) : null}

      <div style={{ ...baseCardStyle, padding: 32, background: 'linear-gradient(135deg, #ffffff 0%, #f3edff 55%, #efe8ff 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -55, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(109, 40, 217, 0.12)' }} />
        <div style={{ position: 'relative', maxWidth: 560 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.primary, marginBottom: 12 }}>Start Exploring</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 800, color: theme.text, lineHeight: 1.2 }}>Find the next place that feels right.</div>
          <div style={{ fontSize: 15, color: theme.textSoft, lineHeight: 1.8, marginTop: 12 }}>
            Browse verified listings, compare options, schedule visits, and keep every inquiry organized from one place.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
            <ActionButton onClick={() => navigate('/properties')} variant="primary">Browse Properties</ActionButton>
            <ActionButton onClick={onOpenSavedTab}>Review Saved List</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuyerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)
  const [saved, setSaved] = useState([])
  const [visits, setVisits] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [inquirySearch, setInquirySearch] = useState('')
  const [activeInquiry, setActiveInquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const threadNotificationRef = useRef({})
  const threadPollBootstrappedRef = useRef(false)
  const visitRefreshInFlightRef = useRef(false)

  const hydrateVisits = useCallback(async (rawVisits = []) => {
    const userVisits = rawVisits.filter((visit) => {
      const buyerId = getVisitBuyerId(visit)
      return !buyerId || String(buyerId) === String(user._id)
    })

    const hydratedVisits = await Promise.all(
      userVisits.map(async (visit) => {
        const propertyId = getVisitPropertyId(visit)
        const needsPropertyHydration =
          propertyId &&
          (!visit?.property ||
            typeof visit.property === 'string' ||
            !visit?.property?.title ||
            (!visit?.property?.city && !visit?.property?.location?.city))

        if (!needsPropertyHydration) return visit

        try {
          const propertyPayload = await propertyService.getById(propertyId)
          const propertyData = propertyPayload?.data || propertyPayload
          return propertyData ? { ...visit, property: propertyData } : visit
        } catch {
          return visit
        }
      })
    )

    return sortVisits(hydratedVisits)
  }, [user?._id])

  const loadVisits = useCallback(async () => {
    if (!user?._id) return []

    const visitsResponse = await visitService.getBuyerVisits({ limit: 100 })
    const visitsData = extractVisitsList(visitsResponse)
    return hydrateVisits(visitsData)
  }, [hydrateVisits, user?._id])

  const fetchData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const [savedRes, visitsRes, inquiriesRes] = await Promise.allSettled([
        userService.getSaved(user._id),
        visitService.getBuyerVisits({ limit: 100 }),
        inquiryService.getMine(user._id),
      ])

      if (savedRes.status === 'fulfilled') {
        const favorites = savedRes.value?.data || savedRes.value || []
        setSaved(Array.isArray(favorites) ? favorites.filter((favorite) => favorite && favorite.property) : [])
      } else {
        setSaved([])
      }

      if (visitsRes.status === 'fulfilled') {
        setVisits(await hydrateVisits(extractVisitsList(visitsRes.value)))
      } else {
        setVisits([])
      }

      if (inquiriesRes.status === 'fulfilled') {
        const inquiriesData = inquiriesRes.value?.data || inquiriesRes.value || []
        setInquiries(Array.isArray(inquiriesData) ? inquiriesData : [])
      } else {
        setInquiries([])
      }
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [hydrateVisits, user])

  useEffect(() => {
    fetchData()
  }, [fetchData, location.key])

  useEffect(() => {
    if (!user?._id) return

    let cancelled = false

    const refreshVisits = async () => {
      if (visitRefreshInFlightRef.current) return
      visitRefreshInFlightRef.current = true

      try {
        const nextVisits = await loadVisits()
        if (!cancelled) {
          setVisits(nextVisits)
        }
      } catch {
        // Keep silent here to avoid noisy dashboard polling errors.
      } finally {
        visitRefreshInFlightRef.current = false
      }
    }

    refreshVisits()

    const intervalId = window.setInterval(refreshVisits, 20000)
    const handleFocus = () => {
      refreshVisits()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [loadVisits, user?._id])

  useEffect(() => {
    if (!user?._id) return

    let cancelled = false

    const pollThreadNotifications = async () => {
      try {
        const payload = await threadService.getMine()
        const threads = extractThreads(payload)
        const nextMap = {}

        for (const thread of threads) {
          const threadId = thread?._id
          if (!threadId) continue

          const lastMessageTs = thread?.lastMessageAt ? new Date(thread.lastMessageAt).getTime() : 0
          nextMap[threadId] = lastMessageTs

          const participants = Array.isArray(thread?.participants) ? thread.participants : []
          const me = participants.find((participant) => String(getParticipantUserId(participant)) === String(user._id))
          const myLastReadTs = me?.lastReadAt ? new Date(me.lastReadAt).getTime() : 0
          const hasUnread = lastMessageTs > myLastReadTs
          const alreadyNotifiedTs = threadNotificationRef.current[threadId] || 0

          if (!threadPollBootstrappedRef.current || !hasUnread || lastMessageTs <= alreadyNotifiedTs) {
            continue
          }

          // NotificationBell handles real-time toast notifications globally.
        }

        if (!cancelled) {
          threadNotificationRef.current = nextMap
          if (!threadPollBootstrappedRef.current) {
            threadPollBootstrappedRef.current = true
          }
        }
      } catch {
        // Silent polling failure: dashboard data flow already surfaces hard errors.
      }
    }

    pollThreadNotifications()
    const timer = window.setInterval(pollThreadNotifications, 8000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?._id])

  const extractObjectId = (id) => {
    if (!id) return null
    const str = String(id).trim()
    const match = str.match(/[a-fA-F0-9]{24}/)
    return match ? match[0] : null
  }

  const handleUnsave = async (favoriteId, propertyId) => {
    const cleanFavId = extractObjectId(favoriteId)
    const cleanPropId = extractObjectId(propertyId)

    if (!cleanFavId && !cleanPropId) {
      toast.error('Invalid favorite or property ID')
      return
    }

    let error = null

    if (cleanFavId) {
      try {
        await userService.unsave(cleanFavId)
        setSaved((prev) => prev.filter((fav) => fav._id !== favoriteId))
        toast.success('Property removed from saved')
        return
      } catch (err) {
        error = err
        console.error('Unsave with cleaned favoriteId failed:', err)
      }
    }

    if (cleanPropId) {
      try {
        await userService.unsave(cleanPropId)
        setSaved((prev) => prev.filter((fav) => fav.property?._id !== propertyId))
        toast.success('Property removed from saved')
        return
      } catch (err) {
        error = err
        console.error('Unsave with cleaned propertyId failed:', err)
      }
    }

    const message = error?.response?.data?.message || error?.message || 'Failed to remove property'
    toast.error(message)
  }

  const handleCancelVisit = async (visitId) => {
    try {
      await visitService.updateStatus(visitId, 'CANCELLED')
      setVisits((prev) => prev.map((visit) => visit._id === visitId ? { ...visit, status: 'CANCELLED', visit_status: 'CANCELLED' } : visit))
      toast.success('Visit cancelled successfully')
    } catch (error) {
      console.error('Cancel visit error:', error)
      toast.error('Failed to cancel visit')
    }
  }

  const filteredInquiries = inquiries
    .slice()
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
    .filter((inquiry) => {
      const keyword = inquirySearch.trim().toLowerCase()
      if (!keyword) return true
      return String(inquiry?.property?.title || '').toLowerCase().includes(keyword)
    })

  const firstName = user?.name?.split(' ')[0] || user?.username?.split(' ')[0] || 'there'
  const profileImageSrc = resolveApiAssetUrl(user?.profileImage || user?.profile_image || user?.avatar || user?.image || '')

  const tabContent = [
    <Overview key="overview" saved={saved} visits={visits} inquiries={inquiries} onOpenSavedTab={() => setTab(1)} />,
    <div key="saved" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeading title="Saved Properties" sub={`You have ${saved.length} saved ${saved.length === 1 ? 'property' : 'properties'} ready to revisit.`} />
      {saved.length === 0 ? (
        <EmptyState title="No saved properties yet" sub="As you explore listings, save the ones you like and they will appear here." btn="Browse Properties" to="/properties" />
      ) : (
        saved.map((favorite) => (
          <PropRow key={favorite._id} prop={favorite.property} favoriteId={favorite._id} propertyId={favorite.property?._id} onUnsave={handleUnsave} />
        ))
      )}
    </div>,
    <div key="visits" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeading
        title="Scheduled Visits"
        sub="Track every booking, check statuses, and update plans from one place."
        action={<ActionButton onClick={() => navigate('/properties')} variant="primary">Schedule Visit</ActionButton>}
      />
      {visits.length === 0 ? (
        <EmptyState title="No visits scheduled" sub="Book a property visit to start seeing confirmations, updates, and visit history here." btn="Browse Properties" to="/properties" />
      ) : (
        visits.map((visit) => <VisitCard key={visit._id} visit={visit} onCancel={handleCancelVisit} />)
      )}
    </div>,
    <div key="inquiries" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeading title="My Inquiries" sub="Review the questions you sent to property owners and continue the conversation." />
      <div style={{ ...baseCardStyle, padding: 18, boxShadow: 'none' }}>
        <input
          type="text"
          value={inquirySearch}
          onChange={(event) => setInquirySearch(event.target.value)}
          placeholder="Search by property name..."
          style={{ width: '100%', height: 50, borderRadius: 16, border: `1px solid ${theme.borderStrong}`, background: theme.surfaceSoft, color: theme.text, padding: '0 16px', fontSize: 14, outline: 'none' }}
        />
      </div>

      {inquiries.length === 0 ? (
        <EmptyState title="No inquiries yet" sub="Send a question to a property owner and it will show up here together with any replies." btn="Browse Properties" to="/properties" />
      ) : filteredInquiries.length === 0 ? (
        <EmptyState title="No matching inquiries" sub="Try a different property name or clear the search to see all conversations." btn="Clear Search" onClick={() => setInquirySearch('')} />
      ) : (
        filteredInquiries.map((inquiry) => <InquiryCard key={inquiry._id} inquiry={inquiry} onOpenConversation={setActiveInquiry} />)
      )}
    </div>,
  ]

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(circle at top left, rgba(196, 181, 253, 0.35), transparent 24%), ${theme.bg}`, fontFamily: "'DM Sans', sans-serif", color: theme.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        .buyer-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .buyer-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 50px rgba(76, 29, 149, 0.14);
          border-color: rgba(109, 40, 217, 0.18);
        }
        .buyer-tab-scroll::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 980px) {
          .buyer-property-row {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 720px) {
          .buyer-header-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
          }
          .buyer-header-actions {
            justify-content: stretch !important;
            flex-wrap: wrap !important;
          }
          .buyer-header-actions > * {
            flex: 1 1 auto;
          }
          .buyer-row-actions {
            justify-content: stretch !important;
          }
          .buyer-row-actions button {
            flex: 1 1 auto;
          }
          .buyer-tab-scroll {
            padding: 0 16px 14px !important;
          }
          .buyer-content-wrap {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .buyer-header-row h1,
          .buyer-header-row > div > div:first-child {
            font-size: 24px !important;
          }
          .buyer-card {
            border-radius: 16px !important;
          }
        }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(18px)', background: 'rgba(245, 243, 255, 0.88)', borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 24px 20px' }}>
          <div className="buyer-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
              <div style={{ width: 68, height: 68, borderRadius: 24, overflow: 'hidden', background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: 22, boxShadow: '0 16px 34px rgba(109, 40, 217, 0.22)' }}>
                {profileImageSrc ? (
                  <img src={profileImageSrc} alt={user?.name || 'Profile'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(user?.name || user?.username || 'U')
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 800, color: theme.text, lineHeight: 1.1 }}>
                  Welcome back, {firstName}!
                </div>
                <div style={{ fontSize: 15, color: theme.textSoft, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
              </div>
            </div>

            <div className="buyer-header-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <ActionButton onClick={() => navigate('/')}>Back to Website</ActionButton>
              <NotificationBell user={user} />
              <ActionButton onClick={() => navigate('/properties')} variant="primary">Browse Properties</ActionButton>
              <ActionButton onClick={() => { logout(); navigate('/') }} variant="danger">Logout</ActionButton>
            </div>
          </div>

          <div className="buyer-tab-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', marginTop: 22, paddingBottom: 2 }}>
            {TABS.map((label, index) => {
              const isActive = tab === index
              const badgeValue = index === 0 ? saved.length : index === 1 ? saved.length : index === 2 ? visits.length : inquiries.length

              return (
                <button
                  key={label}
                  onClick={() => setTab(index)}
                  style={{ ...actionButtonBase, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', borderRadius: 999, padding: '12px 18px', background: isActive ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDeep})` : theme.surface, color: isActive ? '#ffffff' : theme.primary, border: isActive ? 'none' : `1px solid ${theme.borderStrong}`, boxShadow: isActive ? '0 14px 28px rgba(109, 40, 217, 0.18)' : 'none' }}
                >
                  <span>{label}</span>
                  <span style={{ minWidth: 24, height: 24, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: isActive ? 'rgba(255, 255, 255, 0.16)' : theme.primarySoft, color: isActive ? '#ffffff' : theme.primary }}>
                    {badgeValue}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px 72px' }}>
        {loading ? (
          <DashboardShell>
            <div style={{ color: theme.textSoft, fontSize: 14 }}>Loading dashboard...</div>
          </DashboardShell>
        ) : (
          tabContent[tab]
        )}
      </div>

      {activeInquiry ? <ThreadPanel inquiry={activeInquiry} user={user} onClose={() => setActiveInquiry(null)} /> : null}

    </div>
  )
}
