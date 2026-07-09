import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { agentService, propertyService, inquiryService, threadService, saleRequestService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { formatPrice, timeAgo, getInitials } from '../../utils/index'
import { toast } from 'react-toastify'
import { Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler 
} from 'chart.js'
import visitService from '../../services/visitService'   
import ThreadPanel from '../../Components/messaging/ThreadPanel'
import NotificationBell from '../../Components/ui/NotificationBell'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

//  added 'Visit Requests' tab
const TABS = ['Overview','My Listings','Leads','Owner Sale Requests','Analytics','Visit Requests']

const extractVisitsList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.visits)) return payload.visits
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const getVisitStatus = (visit) => visit?.status || visit?.visit_status || 'REQUESTED'

const getVisitDate = (visit) => visit?.scheduledDate || visit?.scheduled_date || null

const getVisitPropertyId = (visit) =>
  visit?.property?._id || visit?.propertyId || visit?.property_id || visit?.property || null

const getVisitBuyer = (visit) => visit?.buyer || visit?.user || visit?.buyerInfo || null

const ACTIVE_VISIT_STATUSES = new Set(['PENDING', 'REQUESTED', 'CONFIRMED'])
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const PROPERTY_CATEGORY_OPTIONS = [
  { value: 'sale', label: 'For Sale', propertyType: 'Apartment', purpose: 'sale', type: 'apartment' },
  { value: 'rent', label: 'For Rent', propertyType: 'Apartment', purpose: 'rent', type: 'apartment' },
  { value: 'pg', label: 'For PG', propertyType: 'PG', purpose: 'pg', type: 'pg' },
]

const toSafeNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const resolveDailyViewDate = (entry) =>
  entry?.date || entry?.day || entry?.viewDate || entry?.createdAt || null

const resolveDailyViewCount = (entry) =>
  entry?.views || entry?.count || entry?.totalViews || entry?.value || 0

const normalizeDailyViews = (payload) => {
  const entries = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.views)
        ? payload.views
        : []

  const today = new Date()
  const dayMap = new Map()
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)
    const key = day.toISOString().slice(0, 10)
    dayMap.set(key, {
      key,
      label: WEEKDAY_LABELS[day.getDay()],
      views: 0,
      timestamp: day.getTime(),
    })
  }

  entries.forEach((entry) => {
    const rawDate = resolveDailyViewDate(entry)
    const parsedDate = rawDate ? new Date(rawDate) : null
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) return
    parsedDate.setHours(0, 0, 0, 0)
    const key = parsedDate.toISOString().slice(0, 10)
    if (!dayMap.has(key)) return

    const current = dayMap.get(key)
    dayMap.set(key, {
      ...current,
      views: current.views + toSafeNumber(resolveDailyViewCount(entry)),
    })
  })

  return Array.from(dayMap.values()).sort((a, b) => a.timestamp - b.timestamp)
}

const getPropertyCategoryValue = (property) => {
  const purpose = String(property?.purpose || property?.listingType || '').toLowerCase()
  const type = String(property?.type || property?.propertyType || '').toLowerCase()
  if (purpose === 'pg' || type === 'pg') return 'pg'
  if (purpose === 'rent') return 'rent'
  return 'sale'
}

const getLeadName = (lead) =>
  lead?.user?.name || lead?.name || lead?.buyer?.name || lead?.email || 'Buyer'

const getLeadEmail = (lead) =>
  lead?.user?.email || lead?.email || lead?.buyer?.email || ''

const getLeadPhone = (lead) =>
  lead?.user?.phone || lead?.phone || lead?.buyer?.phone || ''

const extractThreads = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const listFrom = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const extractCommissionAnalytics = (payload) => payload?.data || {}

const getCommissionStatusTone = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'earned' || normalized === 'paid') {
    return { color: '#166534', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.18)' }
  }
  return { color: '#92400e', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.18)' }
}

const getParticipantUserId = (participant) =>
  participant?.user?._id || participant?.user || null

const getSaleRequestPropertyId = (request) =>
  request?.property?._id || request?.property?.id || request?.propertyId || null

const getSaleRequestImage = (request) => {
  const images = request?.property?.images
  if (Array.isArray(images) && images[0]) return images[0]
  return ''
}

const getSaleRequestLocation = (request) => {
  const property = request?.property || {}
  return [
    property?.location?.city || property?.city || '',
    property?.location?.address || property?.locality || '',
  ].filter(Boolean).join(' | ')
}

const getSaleRequestStatusTone = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'payment_completed') return { text: '#166534', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.18)' }
  if (normalized === 'sold') return { text: '#1d4ed8', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.18)' }
  if (normalized === 'accepted') return { text: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.18)' }
  return { text: '#92400e', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.18)' }
}

function MarkSoldModal({ request, form, onChange, onClose, onSubmit, busy }) {
  if (!request) return null

  const property = request?.property || {}
  const image = getSaleRequestImage(request)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.52)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, zIndex:1200 }}>
      <div style={{ width:'min(100%, 560px)', background:'#ffffff', borderRadius:24, overflow:'hidden', boxShadow:'0 30px 80px rgba(15,23,42,0.24)', border:'1px solid rgba(124,58,237,0.12)' }}>
        <div style={{ padding:24, background:'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(14,165,233,0.08))', borderBottom:'1px solid rgba(124,58,237,0.08)' }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.12em', color:'#7c3aed', textTransform:'uppercase', marginBottom:10 }}>Close Sale</div>
          <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ width:88, height:72, borderRadius:16, overflow:'hidden', background:'linear-gradient(135deg,#ede9fe,#dbeafe)', display:'flex', alignItems:'center', justifyContent:'center', color:'#7c3aed', fontWeight:800 }}>
              {image ? <img src={image} alt={property?.title || 'Property'} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : 'PP'}
            </div>
            <div style={{ flex:1, minWidth:220 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800, color:'#1a0a2e' }}>{property?.title || 'Property sale'}</div>
              <div style={{ fontSize:13, color:'rgba(26,10,46,0.58)', marginTop:6 }}>
                {getSaleRequestLocation(request) || 'Property details available in the linked listing'}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding:24, display:'grid', gap:18 }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#1a0a2e', marginBottom:8 }}>Final sold price</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.soldPrice}
              onChange={(event) => onChange('soldPrice', event.target.value)}
              placeholder="Enter final transaction amount"
              style={{ width:'100%', height:48, borderRadius:14, border:'1px solid rgba(124,58,237,0.18)', background:'#faf8ff', color:'#1a0a2e', padding:'0 14px', fontSize:14, outline:'none' }}
            />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#1a0a2e', marginBottom:8 }}>Payment method</label>
            <select
              value={form.paymentMethod}
              onChange={(event) => onChange('paymentMethod', event.target.value)}
              style={{ width:'100%', height:48, borderRadius:14, border:'1px solid rgba(124,58,237,0.18)', background:'#faf8ff', color:'#1a0a2e', padding:'0 14px', fontSize:14, outline:'none' }}
            >
              <option value="netbanking">Net Banking</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#1a0a2e', marginBottom:8 }}>Owner note</label>
            <textarea
              rows="4"
              value={form.saleNotes}
              onChange={(event) => onChange('saleNotes', event.target.value)}
              placeholder="Add a short handover note for the owner"
              style={{ width:'100%', borderRadius:14, border:'1px solid rgba(124,58,237,0.18)', background:'#faf8ff', color:'#1a0a2e', padding:'12px 14px', fontSize:14, outline:'none', resize:'vertical', fontFamily:"'DM Sans',sans-serif" }}
            />
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'0 24px 24px' }}>
          <button onClick={onClose} disabled={busy} style={{ padding:'11px 18px', borderRadius:12, border:'1px solid rgba(124,58,237,0.18)', background:'#ffffff', color:'#7c3aed', fontWeight:700, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={onSubmit} disabled={busy} style={{ padding:'11px 18px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#ffffff', fontWeight:700, cursor:'pointer', opacity:busy ? 0.7 : 1 }}>
            {busy ? 'Saving...' : 'Confirm Sale'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AgentSaleRequestCard({ request, onAccept, onOpenConversation, onMarkSold, onViewProperty, busy }) {
  const property = request?.property || {}
  const owner = request?.owner || {}
  const acceptedAgent = request?.acceptedBy || null
  const isAccepted = String(request?.status || '').toLowerCase() !== 'open'
  const canManage = acceptedAgent?._id && String(acceptedAgent._id) === String(onMarkSold?.agentId)
  const image = getSaleRequestImage(request)
  const propertyId = getSaleRequestPropertyId(request)
  const statusTone = getSaleRequestStatusTone(request?.status)
  const location = getSaleRequestLocation(request)
  const askingPrice = Number(property?.price)
  const soldPrice = Number(request?.soldPrice)
  const statusLabel = String(request?.status || 'open').replace(/_/g, ' ')
  const commissionAmount = Number(request?.commissionAmount || 0)
  const commissionRate = Number(request?.commissionRate || 0)
  const commissionTone = getCommissionStatusTone(request?.commissionStatus)

  return (
    <div style={{ padding: 18, background: '#ffffff', border: '1px solid rgba(124,58,237,0.1)', borderRadius: 20, boxShadow:'0 10px 30px rgba(124,58,237,0.05)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:18 }}>
        <div style={{ minHeight:112, borderRadius:18, overflow:'hidden', background:'linear-gradient(135deg,#ede9fe,#dbeafe)', display:'flex', alignItems:'center', justifyContent:'center', color:'#7c3aed', fontWeight:800 }}>
          {image ? <img src={image} alt={property?.title || 'Property'} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : 'PP'}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1a0a2e' }}>{property?.title || 'Property'}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(26,10,46,0.5)', marginTop: 4 }}>
                Owner: {owner?.name || 'Owner'}{owner?.phone ? ` · ${owner.phone}` : ''}
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(26,10,46,0.5)', marginTop: 4 }}>
                {location || 'City not set'}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: statusTone.text, background: statusTone.bg, border:`1px solid ${statusTone.border}`, borderRadius: 999, padding: '7px 11px', height: 'fit-content' }}>
              {statusLabel}
            </div>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
            <div style={{ padding:'10px 12px', borderRadius:14, background:'#faf8ff', border:'1px solid rgba(124,58,237,0.08)', minWidth:140 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(26,10,46,0.45)', textTransform:'uppercase', marginBottom:4 }}>Listed Price</div>
              <div style={{ fontSize:15, fontWeight:800, color:'#1a0a2e' }}>{askingPrice > 0 ? formatPrice(askingPrice) : 'On request'}</div>
            </div>
            <div style={{ padding:'10px 12px', borderRadius:14, background:'#f7fcfb', border:'1px solid rgba(22,163,74,0.12)', minWidth:140 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(26,10,46,0.45)', textTransform:'uppercase', marginBottom:4 }}>Sold Price</div>
              <div style={{ fontSize:15, fontWeight:800, color:'#166534' }}>{soldPrice > 0 ? formatPrice(soldPrice) : 'Pending closure'}</div>
            </div>
            <div style={{ padding:'10px 12px', borderRadius:14, background:'#f8fafc', border:'1px solid rgba(148,163,184,0.16)', minWidth:140 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(26,10,46,0.45)', textTransform:'uppercase', marginBottom:4 }}>Last Update</div>
              <div style={{ fontSize:15, fontWeight:800, color:'#1e293b' }}>{timeAgo(request?.updatedAt || request?.createdAt)}</div>
            </div>
            <div style={{ padding:'10px 12px', borderRadius:14, background:commissionTone.bg, border:`1px solid ${commissionTone.border}`, minWidth:170 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(26,10,46,0.45)', textTransform:'uppercase', marginBottom:4 }}>Commission</div>
              <div style={{ fontSize:15, fontWeight:800, color:commissionTone.color }}>
                {commissionAmount > 0 ? formatPrice(commissionAmount) : 'Will calculate on sale'}
              </div>
              <div style={{ fontSize:11.5, color:'rgba(26,10,46,0.58)', marginTop:4, textTransform:'capitalize' }}>
                {commissionRate > 0 ? `${commissionRate}%` : 'Default rate'} · {request?.commissionStatus || 'pending'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.72)', lineHeight: 1.6 }}>
            {request?.ownerMessage || 'Owner wants an agent to manage the sale of this property.'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {propertyId && (
              <button onClick={() => onViewProperty?.(request)} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(37,99,235,0.2)', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer' }}>
                View Property
              </button>
            )}
            {!isAccepted ? (
              <button onClick={() => onAccept?.(request)} disabled={busy} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
                Accept Request
              </button>
            ) : (
              <>
                <button onClick={() => onOpenConversation?.(request)} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(124,58,237,0.24)', background: '#fff', color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}>
                  Open Chat
                </button>
                {owner?.phone && (
                  <a href={`tel:${owner.phone}`} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(8,145,178,0.24)', background: '#fff', color: '#0891b2', fontWeight: 700, textDecoration: 'none' }}>
                    Call Owner
                  </a>
                )}
                {canManage && String(request?.status || '').toLowerCase() === 'accepted' && (
                  <button onClick={() => onMarkSold?.run(request)} disabled={busy} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
                    Mark Sold
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Stat Card (light mode) */
function StatCard({ icon, label, value, change, up=true }) {
  return (
    <div style={{ background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.02)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:14 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:'#f0eeff', border:'0.5px solid rgba(124,58,237,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#7c3aed' }}>{icon}</div>
        {change && <span style={{ fontSize:12, fontWeight:600, padding:'3px 8px', borderRadius:6, background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: up ? '#16a34a' : '#dc2626' }}>{up?'+':'-'} {change}</span>}
      </div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:800, color:'#1a0a2e', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:13, color:'rgba(26,10,46,0.5)', marginTop:5 }}>{label}</div>
    </div>
  )
}

/* Listing Row */
function ListingRow({ prop, onDelete, onCategoryChange }) {
  const navigate = useNavigate()
  const statusColor = { active:'#16a34a', pending:'#f59e0b', sold:'#a78bfa', rented:'#0891b2' }
  const status = prop.status || 'active'
  const [updatingCategory, setUpdatingCategory] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(getPropertyCategoryValue(prop))

  useEffect(() => {
    setCurrentCategory(getPropertyCategoryValue(prop))
  }, [prop])

  const handleCategoryChange = async (event) => {
    const nextCategory = event.target.value
    const option = PROPERTY_CATEGORY_OPTIONS.find((item) => item.value === nextCategory)
    if (!option) return

    setUpdatingCategory(true)
    try {
      const payload = {
        listingType: option.purpose,
        propertyType: option.propertyType,
        purpose: option.purpose,
        type: option.type,
      }
      await propertyService.update(prop._id || prop.id, payload)
      setCurrentCategory(nextCategory)
      onCategoryChange?.(prop._id || prop.id, payload)
      toast.success(`Property category changed to ${option.label}`)
    } catch {
      toast.error('Failed to update property category')
    } finally {
      setUpdatingCategory(false)
    }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'60px 1fr auto auto', gap:14, padding:'14px 16px', background:'#f9f9ff', border:'0.5px solid rgba(124,58,237,0.1)', borderRadius:12, alignItems:'center' }}>
      <div style={{ width:60, height:50, borderRadius:8, background:'linear-gradient(135deg,#f0eeff,#e8e4ff)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#7c3aed' }}>
        {prop.images?.[0] ? <img src={prop.images[0]} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : 'IMG'}
      </div>
      <div>
        <div style={{ fontSize:14.5, fontWeight:700, color:'#1a0a2e', marginBottom:3 }}>{prop.title}</div>
        <div style={{ fontSize:12, color:'rgba(26,10,46,0.5)', display:'flex', gap:10 }}>
          <span>Location: {prop.city}</span>
          {prop.views && <span>Views: {prop.views}</span>}
          <span>Posted: {timeAgo(prop.createdAt)}</span>
        </div>
        <div style={{ marginTop:8 }}>
          <select
            value={currentCategory}
            onChange={handleCategoryChange}
            disabled={updatingCategory}
            style={{ height:32, minWidth:132, padding:'0 10px', borderRadius:999, border:'1px solid rgba(124,58,237,0.22)', background:updatingCategory ? '#f3f0ff' : '#fff', color:'#7c3aed', fontSize:12, fontWeight:700, cursor:updatingCategory ? 'not-allowed' : 'pointer', outline:'none', fontFamily:"'DM Sans',sans-serif" }}
          >
            {PROPERTY_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:800, color:'#1a0a2e' }}>{formatPrice(prop.price)}</div>
        <span style={{ fontSize:11, padding:'2px 9px', borderRadius:5, background:`${statusColor[status]}20`, color:statusColor[status], fontWeight:700, textTransform:'capitalize', marginTop:4, display:'inline-block' }}>{status}</span>
      </div>
      <div style={{ display:'flex', gap:7 }}>
        <button onClick={() => navigate(`/property/${prop._id||prop.id}`)} style={{ padding:'6px 12px', borderRadius:7, border:'0.5px solid rgba(124,58,237,0.4)', color:'#7c3aed', background:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>View</button>
        <button onClick={() => onDelete(prop._id||prop.id)} style={{ padding:'6px 10px', borderRadius:7, border:'0.5px solid rgba(239,68,68,0.3)', color:'#ef4444', background:'none', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

/* Lead Card */
function LeadCard({ lead, onRespond, onOpenConversation }) {
  const [replying, setReplying] = useState(false)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const leadName = getLeadName(lead)
  const contactLine = [getLeadEmail(lead), getLeadPhone(lead)].filter(Boolean).join(' | ')

  const handleRespond = async () => {
    if (!reply.trim()) return
    setLoading(true)
    try {
      await inquiryService.respond(lead._id, reply)
      toast.success('Reply sent!')
      setReplying(false)
      onRespond?.(lead._id, reply)
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding:16, background:'#f9f9ff', border:'0.5px solid rgba(124,58,237,0.1)', borderRadius:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }}>
            {getInitials(leadName)}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#1a0a2e' }}>{leadName}</div>
            {contactLine && <div style={{ fontSize:12, color:'rgba(26,10,46,0.5)' }}>{contactLine}</div>}
          </div>
        </div>
        <span style={{ fontSize:11.5, color:'rgba(26,10,46,0.4)' }}>{timeAgo(lead.createdAt)}</span>
      </div>
      <p style={{ fontSize:13.5, color:'rgba(26,10,46,0.7)', lineHeight:1.65, marginBottom:10, fontStyle:'italic' }}>"{lead.message}"</p>
      <div style={{ fontSize:12, color:'rgba(26,10,46,0.5)', marginBottom:12 }}>Property: {lead.property?.title || 'N/A'}</div>

      {lead.response
        ? <div style={{ padding:'10px 14px', background:'rgba(34,197,94,0.07)', border:'0.5px solid rgba(34,197,94,0.2)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:'#16a34a', fontWeight:700, marginBottom:4 }}>YOUR REPLY</div>
            <p style={{ fontSize:13, color:'rgba(26,10,46,0.7)' }}>{lead.response}</p>
          </div>
        : replying
          ? <div style={{ display:'flex', gap:8 }}>
              <input value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type your reply..." style={{ flex:1, height:40, background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:8, padding:'0 12px', color:'#1a0a2e', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" }}/>
              <button onClick={handleRespond} disabled={loading} style={{ padding:'0 14px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:loading?0.7:1 }}>{loading?'...':'Send'}</button>
              <button onClick={()=>setReplying(false)} style={{ padding:'0 10px', background:'none', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:8, color:'rgba(26,10,46,0.5)', cursor:'pointer' }}>X</button>
            </div>
          : <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={()=>setReplying(true)} style={{ padding:'7px 14px', background:'rgba(124,58,237,0.08)', border:'0.5px solid rgba(124,58,237,0.3)', borderRadius:8, color:'#7c3aed', fontSize:13, fontWeight:600, cursor:'pointer' }}>Reply</button>
              <button onClick={() => onOpenConversation?.(lead)} style={{ padding:'7px 14px', background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:8, color:'#1a0a2e', fontSize:13, fontWeight:600, cursor:'pointer' }}>Open Thread</button>
            </div>
      }
      {(lead.response || replying) && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
          <button onClick={() => onOpenConversation?.(lead)} style={{ padding:'7px 14px', background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:8, color:'#1a0a2e', fontSize:13, fontWeight:600, cursor:'pointer' }}>Open Thread</button>
        </div>
      )}
    </div>
  )
}

/* Line Chart */
function LineChart({ data, labels, label }) {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.18)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#1a0a2e' } },
      tooltip: { backgroundColor: '#fff', titleColor: '#1a0a2e', bodyColor: '#1a0a2e', borderColor: '#7c3aed', borderWidth: 1 },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e8e4ff' }, ticks: { color: '#1a0a2e', precision: 0 } },
      x: { grid: { display: false }, ticks: { color: '#1a0a2e' } },
    },
  }

  return (
    <div className="chart-container" style={{ height: 300 }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

/* Pie Chart */
function PieChart({ data, labels }) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ['#7c3aed', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6'],
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#1a0a2e' } },
      tooltip: { backgroundColor: '#fff', titleColor: '#1a0a2e', bodyColor: '#1a0a2e' },
    },
  }

  return (
    <div className="chart-container" style={{ height: 280 }}>
      <Pie data={chartData} options={options} />
    </div>
  )
}

/* Overview (with real stats) */
function Overview({ stats, listings, leads, dailyViews, leadSources, commissionAnalytics }) {
  const navigate = useNavigate()

  const viewLabels = dailyViews.length > 0 ? dailyViews.map((d) => d.label) : []
  const viewData = dailyViews.length > 0 ? dailyViews.map((d) => d.views) : []

  const leadLabels = Object.keys(leadSources).length > 0 ? Object.keys(leadSources) : []
  const leadData = Object.keys(leadSources).length > 0 ? Object.values(leadSources) : []
  const commissionGraph = Array.isArray(commissionAnalytics?.graph) ? commissionAnalytics.graph : []
  const commissionSummary = commissionAnalytics?.summary || {}
  const commissionLabels = commissionGraph.map((entry) => entry.label)
  const commissionData = commissionGraph.map((entry) => Number(entry.earnings || 0))

  const finalLeadLabels = leadLabels.length ? leadLabels : ['No data']
  const finalLeadData = leadData.length ? leadData : [1]

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16, marginBottom:32 }}>
        <StatCard icon="AL" label="Active Listings" value={stats.activeListings || listings.length || 0} change="3 this month" up/>
        <StatCard icon="TL" label="Total Leads"     value={stats.totalLeads    || leads.length    || 0} change="5 this week" up/>
        <StatCard icon="CR" label="Conversion Rate" value={stats.conversionRate ? `${stats.conversionRate}%` : '12%'} change="+2%" up/>
        <StatCard icon="RT" label="Avg Response Time" value={stats.avgResponseTime  || '1.5h'} change="-30m" up/>
        <StatCard icon="CM" label="Commission Earned" value={formatPrice(commissionSummary.totalCommissionEarned || 0)} change={`${commissionSummary.completedSales || 0} closed`} up/>
        <StatCard icon="PD" label="Pending Commission" value={formatPrice(commissionSummary.totalPendingCommission || 0)} change={`${commissionSummary.totalSalesManaged || 0} managed`} up/>
      </div>

      <div className="charts-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:32 }}>
        <div style={{ background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14, padding:20 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#1a0a2e', marginBottom:16 }}>Views Trend (Last 7 Days)</h3>
          {dailyViews.length > 0 ? (
            <LineChart data={viewData} labels={viewLabels} label="Views" />
          ) : (
            <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:14 }}>No data available</div>
          )}
        </div>
        <div style={{ background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14, padding:20 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#1a0a2e', marginBottom:16 }}>Lead Sources</h3>
          {leadLabels.length > 0 ? (
            <PieChart data={finalLeadData} labels={finalLeadLabels} />
          ) : (
            <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:14 }}>No lead source data</div>
          )}
        </div>
      </div>

      <div style={{ background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14, padding:20, marginBottom:32 }}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#1a0a2e', marginBottom:16 }}>Commission Earnings (Last 6 Months)</h3>
        {commissionGraph.length > 0 ? (
          <LineChart data={commissionData} labels={commissionLabels} label="Commission Earned" />
        ) : (
          <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:14 }}>No commission data yet</div>
        )}
      </div>

      {listings.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#1a0a2e', marginBottom:14 }}>Recent Listings</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {listings.slice(0,3).map((p,i) => <ListingRow key={p._id||i} prop={p} onDelete={()=>{}}/>)}
          </div>
        </div>
      )}

      <button onClick={() => navigate('/protected/agent')}
        style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 20px rgba(124,58,237,0.4)' }}>
        + Post New Property
      </button>
    </div>
  )
}

/* Agent Visit Card (for the new tab) */
function AgentVisitCard({ visit, onStatusChange, updating }) {
  const visitStatus = getVisitStatus(visit)
  const visitDate = getVisitDate(visit)
  const d = visitDate ? new Date(visitDate) : null
  const buyer = getVisitBuyer(visit)
  const propertyCity = visit.property?.location?.city || visit.property?.city || 'Location not specified'
  const propertyAddress = visit.property?.location?.address || visit.property?.locality || ''
  const statusColors = {
    PENDING: { bg: 'rgba(124,58,237,0.08)', color: '#7c3aed', label: 'Pending' },
    REQUESTED: { bg: 'rgba(124,58,237,0.08)', color: '#7c3aed', label: 'Pending' },
    CONFIRMED: { bg: 'rgba(34,197,94,0.1)', color: '#16a34a', label: 'Confirmed' },
    CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', label: 'Cancelled' },
    COMPLETED: { bg: 'rgba(59,130,246,0.1)', color: '#2563eb', label: 'Completed' },
  }
  const style = statusColors[visitStatus] || statusColors.REQUESTED

  return (
    <div style={{ padding:16, background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h3 style={{ fontSize:16, fontWeight:700, color:'#1a0a2e', marginBottom:4 }}>{visit.property?.title || 'Property Visit'}</h3>
          <p style={{ fontSize:13, color:'rgba(26,10,46,0.6)' }}>
            Location: {propertyCity}{propertyAddress ? ` | ${propertyAddress}` : ''}
          </p>
          {d && (
            <p style={{ fontSize:13, marginTop:6 }}>
              Date: {d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
              {' at '}
              {d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
            </p>
          )}
          <p style={{ fontSize:13, color:'rgba(26,10,46,0.6)', marginTop:4 }}>
            Buyer: {buyer?.name || buyer?.username || visit.buyer_name || 'Buyer'}{buyer?.email ? ` (${buyer.email})` : ''}
          </p>
          {visit.notes && (
            <p style={{ fontSize:12, fontStyle:'italic', color:'rgba(26,10,46,0.5)', marginTop:6 }}>Notes: {visit.notes}</p>
          )}
        </div>
        <div style={{ textAlign:'right' }}>
          <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:style.bg, color:style.color }}>
            {style.label}
          </span>
          {(visitStatus === 'REQUESTED' || visitStatus === 'PENDING') && (
            <div style={{ marginTop:12, display:'flex', gap:8 }}>
              <button
                onClick={() => onStatusChange(visit._id, 'CONFIRMED')}
                disabled={updating === visit._id}
                style={{ padding:'6px 14px', background:'#16a34a', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}
              >
                Confirm
              </button>
              <button
                onClick={() => onStatusChange(visit._id, 'CANCELLED')}
                disabled={updating === visit._id}
                style={{ padding:'6px 14px', background:'#dc2626', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}
              >
                Cancel
              </button>
            </div>
          )}
          {visitStatus === 'CONFIRMED' && (
            <button
              onClick={() => onStatusChange(visit._id, 'COMPLETED')}
              disabled={updating === visit._id}
              style={{ marginTop:12, padding:'6px 14px', background:'#2563eb', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}
            >
              Mark Completed
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* Main AgentDashboard */
export default function AgentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [listings, setListings] = useState([])
  const [leads, setLeads] = useState([])
  const [leadSearch, setLeadSearch] = useState('')
  const [activeLead, setActiveLead] = useState(null)
  const [stats, setStats] = useState({})
  const [dailyViews, setDailyViews] = useState([])
  const [leadSources, setLeadSources] = useState({})
  const [commissionAnalytics, setCommissionAnalytics] = useState({ summary: {}, graph: [], sales: [] })
  const [loading, setLoading] = useState(true)

  // NEW: state for visits
  const [visits, setVisits] = useState([])
  const [visitsLoading, setVisitsLoading] = useState(false)
  const [updatingVisitId, setUpdatingVisitId] = useState(null)
  const [openSaleRequests, setOpenSaleRequests] = useState([])
  const [managedSaleRequests, setManagedSaleRequests] = useState([])
  const [saleActionBusyId, setSaleActionBusyId] = useState(null)
  const [saleFormRequest, setSaleFormRequest] = useState(null)
  const [saleForm, setSaleForm] = useState({ soldPrice: '', paymentMethod: 'netbanking', saleNotes: '' })
  const threadNotificationRef = useRef({})
  const threadPollBootstrappedRef = useRef(false)
  const inquiryNotificationRef = useRef({})
  const inquiryPollBootstrappedRef = useRef(false)
  const saleRequestNotificationRef = useRef({})
  const saleRequestPollBootstrappedRef = useRef(false)
  const visitRequestInFlightRef = useRef(false)

  // Fetch agent's visits
  const fetchAgentVisits = useCallback(async (agentListings = [], options = {}) => {
    const { showLoading = false, silent = false } = options

    if (visitRequestInFlightRef.current) {
      return
    }

    visitRequestInFlightRef.current = true

    if (showLoading) {
      setVisitsLoading(true)
    }

    try {
      const res = await visitService.getAgentVisits({ limit: 100 })
      const visitList = extractVisitsList(res)
      const listingIds = new Set(
        (Array.isArray(agentListings) ? agentListings : [])
          .map((listing) => listing?._id || listing?.id)
          .filter(Boolean)
      )
      const filteredVisits = listingIds.size
        ? visitList.filter((visit) => listingIds.has(getVisitPropertyId(visit)))
        : visitList
      const nextVisits = filteredVisits
        .filter((visit) => ACTIVE_VISIT_STATUSES.has(String(getVisitStatus(visit)).toUpperCase()))
        .sort((a, b) => {
          const statusOrder = { REQUESTED: 0, CONFIRMED: 1 }
          const aStatus = String(getVisitStatus(a)).toUpperCase()
          const bStatus = String(getVisitStatus(b)).toUpperCase()
          const byStatus = (statusOrder[aStatus] ?? 99) - (statusOrder[bStatus] ?? 99)
          if (byStatus !== 0) return byStatus

          const aDate = getVisitDate(a) ? new Date(getVisitDate(a)).getTime() : 0
          const bDate = getVisitDate(b) ? new Date(getVisitDate(b)).getTime() : 0
          return aDate - bDate
        })
      setVisits(nextVisits)
    } catch (err) {
      if (!silent) {
        console.error('Failed to fetch visits:', err)
        toast.error('Could not load visit requests')
      }
    } finally {
      visitRequestInFlightRef.current = false
      if (showLoading) {
        setVisitsLoading(false)
      }
    }
  }, [])

  // Update visit status (confirm/cancel/complete)
  const handleVisitStatus = async (visitId, newStatus) => {
    setUpdatingVisitId(visitId)
    try {
      await visitService.updateStatus(visitId, newStatus)
      toast.success(`Visit ${newStatus.toLowerCase()} successfully`)
      setVisits(prev =>
        prev
          .map(v => v._id === visitId ? { ...v, status: newStatus, visit_status: newStatus } : v)
          .filter(v => ACTIVE_VISIT_STATUSES.has(String(getVisitStatus(v)).toUpperCase()))
      )
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingVisitId(null)
    }
  }

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      try {
        const [propsRes, inquiriesRes, statsRes, dailyRes, leadRes, commissionRes, openSalesRes, managedSalesRes] = await Promise.allSettled([
          propertyService.getByOwner(user._id),
          inquiryService.getForAgent(),
          agentService.getStats(),
          agentService.getDailyViews(),
          agentService.getLeadSources(),
          agentService.getCommissions(),
          saleRequestService.getAgentOpenRequests(),
          saleRequestService.getAgentRequests(),
        ])

        if (propsRes.status === 'fulfilled') {
          const listingsData = propsRes.value.data || []
          setListings(listingsData)
          await fetchAgentVisits(listingsData, { showLoading: true })
        } else {
          console.error('Failed to fetch listings:', propsRes.reason)
          await fetchAgentVisits([], { showLoading: true })
        }

        if (inquiriesRes.status === 'fulfilled') {
          const leadsData = inquiriesRes.value.data || []
          setLeads(leadsData)
        } else {
          console.error('Failed to fetch leads:', inquiriesRes.reason)
        }

        if (statsRes.status === 'fulfilled') {
          const statsData = statsRes.value
          setStats({
            totalViews: statsData.totalViews,
            totalValue: statsData.totalValue,
            conversionRate: statsData.conversionRate,
            avgResponseTime: statsData.avgResponseTime,
            activeListings: statsData.activeListings,
            totalLeads: statsData.totalInquiries,
            totalCommissionEarned: statsData.totalCommissionEarned,
            totalPendingCommission: statsData.totalPendingCommission,
            completedAgentSales: statsData.completedAgentSales,
          })
        } else {
          console.error('Failed to fetch stats:', statsRes.reason)
        }

        if (dailyRes.status === 'fulfilled') {
          setDailyViews(normalizeDailyViews(dailyRes.value))
        } else {
          console.error('Failed to fetch daily views:', dailyRes.reason)
          setDailyViews(normalizeDailyViews([]))
        }

        if (leadRes.status === 'fulfilled') {
          setLeadSources(leadRes.value || {})
        } else {
          console.error('Failed to fetch lead sources:', leadRes.reason)
        }

        if (commissionRes.status === 'fulfilled') {
          setCommissionAnalytics(extractCommissionAnalytics(commissionRes.value))
        } else {
          console.error('Failed to fetch commission analytics:', commissionRes.reason)
        }

        if (openSalesRes.status === 'fulfilled') {
          setOpenSaleRequests(listFrom(openSalesRes.value))
        }

        if (managedSalesRes.status === 'fulfilled') {
          setManagedSaleRequests(listFrom(managedSalesRes.value))
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, fetchAgentVisits])

  useEffect(() => {
    if (!user?._id) return

    let cancelled = false

    const pollLeadNotifications = async () => {
      try {
        const payload = await inquiryService.getForAgent()
        const nextLeads = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
        const nextMap = {}

        nextLeads.forEach((lead) => {
          const leadId = lead?._id
          if (!leadId) return
          const createdTs = lead?.createdAt ? new Date(lead.createdAt).getTime() : Date.now()
          nextMap[leadId] = createdTs

          const seenTs = inquiryNotificationRef.current[leadId]
          if (!inquiryPollBootstrappedRef.current || seenTs != null) return

          // NotificationBell handles real-time toast notifications globally.
        })

        if (!cancelled) {
          setLeads(nextLeads)
          inquiryNotificationRef.current = nextMap
          if (!inquiryPollBootstrappedRef.current) {
            inquiryPollBootstrappedRef.current = true
          }
        }
      } catch {
        // Keep polling silent on transient failures.
      }
    }

    pollLeadNotifications()
    const timer = window.setInterval(pollLeadNotifications, 8000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?._id])

  useEffect(() => {
    if (!user?._id) return

    let cancelled = false

    const pollSaleRequests = async () => {
      try {
        const [openPayload, minePayload, commissionPayload, statsPayload] = await Promise.all([
          saleRequestService.getAgentOpenRequests(),
          saleRequestService.getAgentRequests(),
          agentService.getCommissions(),
          agentService.getStats(),
        ])
        const openItems = listFrom(openPayload)
        const nextMap = {}

        openItems.forEach((request) => {
          const requestId = request?._id
          if (!requestId) return

          const createdTs = request?.createdAt ? new Date(request.createdAt).getTime() : Date.now()
          nextMap[requestId] = createdTs

          const seenTs = saleRequestNotificationRef.current[requestId]
          if (!saleRequestPollBootstrappedRef.current || seenTs != null) return

          toast.info(`New owner sale request for ${request?.property?.title || 'a property'}`)
        })

        if (!cancelled) {
          setOpenSaleRequests(openItems)
          setManagedSaleRequests(listFrom(minePayload))
          setCommissionAnalytics(extractCommissionAnalytics(commissionPayload))
          setStats((prev) => ({
            ...prev,
            totalCommissionEarned: statsPayload.totalCommissionEarned,
            totalPendingCommission: statsPayload.totalPendingCommission,
            completedAgentSales: statsPayload.completedAgentSales,
          }))
          saleRequestNotificationRef.current = nextMap
          if (!saleRequestPollBootstrappedRef.current) {
            saleRequestPollBootstrappedRef.current = true
          }
        }
      } catch {
        // silent refresh
      }
    }

    pollSaleRequests()
    const timer = window.setInterval(pollSaleRequests, 10000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?._id])

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
        // Silent polling failure: avoid noisy toasts during transient network failures.
      }
    }

    pollThreadNotifications()
    const timer = window.setInterval(pollThreadNotifications, 8000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?._id])

  
  useEffect(() => {
    if (!user?._id) return;
    const intervalId = setInterval(() => {
      fetchAgentVisits(listings, { silent: true });
    }, 20000);
    return () => clearInterval(intervalId);
  }, [user?._id, listings, fetchAgentVisits]);


  const handleDeleteListing = async (id) => {
    if (!window.confirm('Delete this listing?')) return
    try {
      await propertyService.delete(id)
      setListings(l => l.filter(p => p._id !== id))
      toast.success('Listing deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleCategoryChange = (id, payload) => {
    setListings((prev) =>
      prev.map((item) =>
        item._id === id || item.id === id
          ? {
              ...item,
              listingType: payload.listingType,
              propertyType: payload.propertyType,
              purpose: payload.purpose,
              type: payload.type,
            }
          : item
      )
    )
  }

  const handleLeadRespond = async (id, reply) => {
    setLeads(l => l.map(lead => lead._id === id ? { ...lead, response: reply } : lead))
    try {
      await inquiryService.respond(id, reply)
      toast.success('Reply sent!')
    } catch {
      setLeads(l => l.map(lead => lead._id === id ? { ...lead, response: undefined } : lead))
      toast.error('Failed to send reply')
    }
  }

  const refreshSaleRequests = async () => {
    const [openPayload, minePayload, commissionPayload, statsPayload] = await Promise.all([
      saleRequestService.getAgentOpenRequests(),
      saleRequestService.getAgentRequests(),
      agentService.getCommissions(),
      agentService.getStats(),
    ])
    setOpenSaleRequests(listFrom(openPayload))
    setManagedSaleRequests(listFrom(minePayload))
    setCommissionAnalytics(extractCommissionAnalytics(commissionPayload))
    setStats((prev) => ({
      ...prev,
      totalCommissionEarned: statsPayload.totalCommissionEarned,
      totalPendingCommission: statsPayload.totalPendingCommission,
      completedAgentSales: statsPayload.completedAgentSales,
    }))
  }

  const closeSaleFormModal = () => {
    setSaleFormRequest(null)
    setSaleForm({ soldPrice: '', paymentMethod: 'netbanking', saleNotes: '' })
  }

  const handleAcceptSaleRequest = async (request) => {
    setSaleActionBusyId(request._id)
    try {
      await saleRequestService.accept(request._id)
      toast.success('Owner request accepted')
      await refreshSaleRequests()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to accept request')
    } finally {
      setSaleActionBusyId(null)
    }
  }

  const handleOpenSaleConversation = (request) => {
    if (!request?.thread?._id && !request?.threadId) {
      toast.info('Chat becomes available after acceptance.')
      return
    }

    setActiveLead({
      threadId: request?.thread?._id || request?.threadId,
      thread: request?.thread,
      property: request?.property,
    })
  }

  const handleViewSaleProperty = (request) => {
    const propertyId = getSaleRequestPropertyId(request)
    if (!propertyId) {
      toast.info('Property details are not available for this request yet.')
      return
    }
    navigate(`/property/${propertyId}`)
  }

  const handleMarkSaleSold = (request) => {
    setSaleFormRequest(request)
    setSaleForm({
      soldPrice: String(request?.soldPrice || request?.property?.price || ''),
      paymentMethod: request?.payment?.paymentMethod || 'netbanking',
      saleNotes: request?.saleNotes || '',
    })
  }

  const submitMarkSaleSold = async () => {
    const soldPrice = Number(saleForm.soldPrice)
    if (!Number.isFinite(soldPrice) || soldPrice <= 0) {
      toast.error('Please enter a valid sold price')
      return
    }
    if (!saleFormRequest?._id) return

    setSaleActionBusyId(saleFormRequest._id)
    try {
      await saleRequestService.markSold(saleFormRequest._id, {
        soldPrice,
        paymentMethod: saleForm.paymentMethod,
        saleNotes: saleForm.saleNotes.trim(),
      })
      toast.success('Sale marked as sold and owner notified')
      await refreshSaleRequests()
      closeSaleFormModal()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to mark sale as sold')
    } finally {
      setSaleActionBusyId(null)
    }
  }

  const filteredLeads = leads
    .slice()
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
    .filter((lead) => {
      const keyword = leadSearch.trim().toLowerCase()
      if (!keyword) return true
      const name = String(getLeadName(lead)).toLowerCase()
      return name.includes(keyword)
    })

  // EmptyState component (used inside tabContent)
  const EmptyState = ({ icon, title, sub, btn, to }) => (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:42, marginBottom:14 }}>{icon}</div>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:800, color:'#1a0a2e', marginBottom:8 }}>{title}</h3>
      <p style={{ color:'rgba(26,10,46,0.5)', fontSize:14, marginBottom:20 }}>{sub}</p>
      <button onClick={() => navigate(to)} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>{btn}</button>
    </div>
  )

  const tabContent = [
    <Overview stats={stats} listings={listings} leads={leads} dailyViews={dailyViews} leadSources={leadSources} commissionAnalytics={commissionAnalytics} />,
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <span style={{ fontSize:15, fontWeight:700, color:'#1a0a2e' }}>{listings.length} Listings</span>
        <button onClick={() => navigate('/protected/agent')} style={{ padding:'9px 18px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Add New</button>
      </div>
      {listings.length === 0
        ? <EmptyState icon="AL" title="No listings yet" sub="Add your first property listing to get started" btn="Post Property" to="/protected/agent"/>
        : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{listings.map((p,i)=><ListingRow key={p._id||i} prop={p} onDelete={handleDeleteListing} onCategoryChange={handleCategoryChange}/>)}</div>
      }
    </div>,
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:'#1a0a2e', marginBottom:16 }}>{leads.length} Total Leads</div>
      <input
        type="text"
        value={leadSearch}
        onChange={(event) => setLeadSearch(event.target.value)}
        placeholder="Search buyer name..."
        style={{ width: '100%', maxWidth: 320, height: 36, borderRadius: 10, border: '1px solid rgba(124,58,237,0.2)', background: '#faf8ff', color: '#1a0a2e', padding: '0 12px', fontSize: 13, marginBottom: 14, outline: 'none' }}
      />
      {leads.length === 0
        ? <EmptyState icon="TL" title="No leads yet" sub="Leads from potential buyers will appear here" btn="View My Listings" to="/dashboard/agent"/>
        : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{filteredLeads.map((l,i)=><LeadCard key={l._id||i} lead={l} onRespond={handleLeadRespond} onOpenConversation={setActiveLead}/>)}</div>
      }
    </div>,
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:20 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#1a0a2e', marginBottom:12 }}>Open Owner Requests ({openSaleRequests.length})</div>
          {openSaleRequests.length === 0 ? (
            <div style={{ padding:'18px', borderRadius:14, border:'0.5px solid rgba(124,58,237,0.12)', background:'#fff', color:'rgba(26,10,46,0.55)' }}>
              No owner sale requests are open right now.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {openSaleRequests.map((request) => (
                <AgentSaleRequestCard
                  key={request._id}
                  request={request}
                  onAccept={handleAcceptSaleRequest}
                  onOpenConversation={handleOpenSaleConversation}
                  onMarkSold={{ run: handleMarkSaleSold, agentId: user?._id }}
                  onViewProperty={handleViewSaleProperty}
                  busy={saleActionBusyId === request._id}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#1a0a2e', marginBottom:12 }}>Managed Sales ({managedSaleRequests.length})</div>
          {managedSaleRequests.length === 0 ? (
            <div style={{ padding:'18px', borderRadius:14, border:'0.5px solid rgba(124,58,237,0.12)', background:'#fff', color:'rgba(26,10,46,0.55)' }}>
              Accepted owner sale requests will appear here.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {managedSaleRequests.map((request) => (
                <AgentSaleRequestCard
                  key={request._id}
                  request={request}
                  onAccept={handleAcceptSaleRequest}
                  onOpenConversation={handleOpenSaleConversation}
                  onMarkSold={{ run: handleMarkSaleSold, agentId: user?._id }}
                  onViewProperty={handleViewSaleProperty}
                  busy={saleActionBusyId === request._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
        {[
          { icon:'TV', label:'Total Views',     value:stats.totalViews    || 0 },
          { icon:'VAL', label:'Total Value',     value:stats.totalValue    ? formatPrice(stats.totalValue) : 'N/A' },
          { icon:'CR', label:'Conversion Rate', value:stats.conversionRate ? `${stats.conversionRate}%`  : 'N/A' },
          { icon:'RT', label:'Avg Response Time',value:stats.avgResponseTime || '< 2h' },
          { icon:'CM', label:'Commission Earned', value:formatPrice(stats.totalCommissionEarned || commissionAnalytics?.summary?.totalCommissionEarned || 0) },
          { icon:'PD', label:'Pending Commission', value:formatPrice(stats.totalPendingCommission || commissionAnalytics?.summary?.totalPendingCommission || 0) },
        ].map(s=><StatCard key={s.label} {...s}/>)}
      </div>
      <div style={{ marginTop:24, background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14, padding:20 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:800, color:'#1a0a2e', marginBottom:16 }}>Commission Graph</div>
        {Array.isArray(commissionAnalytics?.graph) && commissionAnalytics.graph.length > 0 ? (
          <LineChart
            data={commissionAnalytics.graph.map((entry) => Number(entry.earnings || 0))}
            labels={commissionAnalytics.graph.map((entry) => entry.label)}
            label="Commission Earned"
          />
        ) : (
          <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:14 }}>No commission earnings yet</div>
        )}
      </div>
      <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:12 }}>
        {(commissionAnalytics?.sales || []).slice(0, 5).map((sale) => (
          <div key={sale._id} style={{ padding:16, background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.15)', borderRadius:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#1a0a2e' }}>{sale?.property?.title || 'Owner sale'}</div>
                <div style={{ fontSize:12.5, color:'rgba(26,10,46,0.58)', marginTop:4 }}>
                  {sale?.owner?.name || 'Owner'} · {sale?.property?.location?.city || sale?.property?.city || 'Location pending'}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:18, fontWeight:800, color:'#166534' }}>{formatPrice(sale?.commissionAmount || 0)}</div>
                <div style={{ fontSize:12, color:'rgba(26,10,46,0.58)', textTransform:'capitalize' }}>
                  {sale?.commissionRate || 0}% commission · {sale?.commissionStatus || 'pending'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>,
    // NEW: Visit Requests tab
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:'#1a0a2e', marginBottom:16 }}>Visit Requests ({visits.length})</div>
      {visitsLoading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <div key={i} style={{ height:140, background:'#f0eeff', borderRadius:14, animation:'pulse 1.5s infinite' }} />)}
        </div>
      ) : visits.length === 0 ? (
        <EmptyState icon="VR" title="No active visit requests" sub="New or confirmed buyer visit requests will appear here" btn="View Properties" to="/properties" />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {visits.map(visit => (
            <AgentVisitCard
              key={visit._id}
              visit={visit}
              onStatusChange={handleVisitStatus}
              updating={updatingVisitId}
            />
          ))}
        </div>
      )}
    </div>,
  ]


  return (
    <div className="agent-shell" style={{ minHeight:'100vh', background:'linear-gradient(180deg, #f4fbff 0%, #f8f7ff 24%, #ffffff 100%)', fontFamily:"'DM Sans',sans-serif", color:'#1a0a2e', position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        *{box-sizing:border-box;}
        .agent-shell::before {
          content: '';
          position: absolute;
          inset: 0 0 auto;
          height: 320px;
          background:
            radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 35%),
            radial-gradient(circle at top right, rgba(124,58,237,0.16), transparent 38%);
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .ag-header-row {
            flex-direction: column !important;
            gap: 12px !important;
            align-items: flex-start !important;
          }
          .charts-row {
            grid-template-columns: 1fr !important;
          }
          .chart-container {
            height: 250px !important;
          }
          .stats-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important;
          }
        }
        
        @media (max-width: 480px) {
          .chart-container {
            height: 200px !important;
          }
          .ag-header-row {
            padding: 0 !important;
          }
          .listing-row {
            grid-template-columns: 48px 1fr !important;
            gap: 8px !important;
          }
          .listing-row > div:nth-child(3),
          .listing-row > div:nth-child(4) {
            grid-column: 2;
          }
          .listing-row {
            grid-template-columns: 50px 1fr auto auto !important;
            gap: 8px !important;
          }
        }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
      `}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,249,255,0.95))', backdropFilter:'blur(20px)', borderBottom:'0.5px solid rgba(124,58,237,0.12)', padding:'20px 6vw 24px', boxShadow:'0 20px 60px rgba(14,165,233,0.08)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="ag-header-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', boxShadow:'0 4px 16px rgba(124,58,237,0.2)' }}>
                {getInitials(user?.username || user?.name)}
              </div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:800, color:'#1a0a2e' }}>Agent Dashboard</div>
                <div style={{ fontSize:13, color:'rgba(26,10,46,0.5)', marginTop:2 }}>{user?.email} | <span style={{ color:'#7c3aed', fontWeight:600, textTransform:'capitalize' }}>{user?.role}</span></div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'flex-end' }}>
              <button
                onClick={() => navigate('/')}
                style={{ padding:'9px 18px', background:'#ffffff', border:'0.5px solid rgba(124,58,237,0.22)', borderRadius:9, color:'#7c3aed', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Back to Website
              </button>
              <NotificationBell user={user} />
              <button onClick={() => navigate('/protected/agent')} style={{ padding:'9px 18px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none', borderRadius:9, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Post Property</button>
              <button onClick={() => { logout(); navigate('/') }} style={{ padding:'9px 14px', background:'rgba(124,58,237,0.08)', border:'0.5px solid rgba(124,58,237,0.2)', borderRadius:9, color:'#7c3aed', fontSize:13, fontWeight:600, cursor:'pointer' }}>Logout</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none' }}>
            {TABS.map((t,i) => (
              <button key={t} onClick={() => setTab(i)}
                style={{ padding:'9px 18px', borderRadius:9, border:'none', fontSize:13.5, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s',
                  background: tab===i ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(124,58,237,0.08)',
                  color: tab===i ? '#fff' : '#7c3aed',
                }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="agent-content" style={{ maxWidth:1100, margin:'0 auto', padding:'32px 6vw 60px' }}>
        {loading
          ? <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16 }}>{Array.from({length:4}).map((_,i)=><div key={i} style={{ height:110, background:'#f0eeff', borderRadius:14, animation:'pulse 1.5s infinite' }}/>)}</div>
          : tabContent[tab]
        }
      </div>
      {activeLead && (
        <ThreadPanel inquiry={activeLead} user={user} onClose={() => setActiveLead(null)} />
      )}
      <MarkSoldModal
        request={saleFormRequest}
        form={saleForm}
        onChange={(field, value) => setSaleForm((prev) => ({ ...prev, [field]: value }))}
        onClose={closeSaleFormModal}
        onSubmit={submitMarkSaleSold}
        busy={saleActionBusyId === saleFormRequest?._id}
      />
    </div>
  )
}

