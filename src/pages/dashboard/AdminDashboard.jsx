import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userService, propertyService, inquiryService, paymentService } from '../../services'
import { formatPrice, timeAgo, getInitials } from '../../utils/index'
import { toast } from 'react-toastify'
import NotificationBell from '../../Components/ui/NotificationBell'
import ThreadPanel from '../../Components/messaging/ThreadPanel'
// Chart.js imports added for Reports tab
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const TABS = ['Overview', 'Users', 'Properties', 'Inquiries', 'Payments', 'Reports']

// ---------- Helper chart components (new, but no existing names are changed) ----------
function PropertyTrendChart({ properties }) {
  const chartData = useMemo(() => {
    const months = []
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      months.push(d.toLocaleString('default', { month: 'short', year: 'numeric' }))
    }
    const counts = new Array(6).fill(0)
    properties.forEach(prop => {
      const created = new Date(prop.createdAt)
      const monthIndex = (today.getFullYear() - created.getFullYear()) * 12 + (today.getMonth() - created.getMonth())
      if (monthIndex >= 0 && monthIndex < 6) {
        counts[5 - monthIndex]++ // reverse so oldest first
      }
    })
    return { labels: months, data: counts }
  }, [properties])

  const data = {
    labels: chartData.labels,
    datasets: [{
      label: 'Properties',
      data: chartData.data,
      backgroundColor: 'rgba(124,58,237,0.7)',
      borderRadius: 6,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: '#1a0a2e' } } },
    scales: { y: { beginAtZero: true, ticks: { color: '#1a0a2e' } }, x: { ticks: { color: '#1a0a2e' } } },
  }

  return (
    <div style={{ height: 300 }}>
      <Bar data={data} options={options} />
    </div>
  )
}

function InquiryByTypeChart({ properties, inquiries }) {
  const chartData = useMemo(() => {
    const propertyMap = new Map(properties.map(p => [p._id.toString(), p.type || 'other']))
    const typeCount = {}
    inquiries.forEach(inq => {
      const type = propertyMap.get(inq.property?._id?.toString()) || 'unknown'
      typeCount[type] = (typeCount[type] || 0) + 1
    })
    return {
      labels: Object.keys(typeCount),
      data: Object.values(typeCount),
    }
  }, [properties, inquiries])

  const data = {
    labels: chartData.labels,
    datasets: [{
      label: 'Inquiries',
      data: chartData.data,
      backgroundColor: ['#7c3aed', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6'],
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: '#1a0a2e' } } },
  }

  return (
    <div style={{ height: 300 }}>
      <Pie data={data} options={options} />
    </div>
  )
}

function RolePieChart({ users }) {
  const chartData = useMemo(() => {
    const roleCount = {}
    users.forEach(u => {
      const role = u.role || 'buyer'
      roleCount[role] = (roleCount[role] || 0) + 1
    })
    return {
      labels: Object.keys(roleCount),
      data: Object.values(roleCount),
    }
  }, [users])

  const data = {
    labels: chartData.labels,
    datasets: [{
      data: chartData.data,
      backgroundColor: ['#7c3aed', '#a78bfa', '#c4b5fd', '#6d28d9', '#5b21b6'],
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: '#1a0a2e' } } },
  }

  return (
    <div style={{ height: 300 }}>
      <Pie data={data} options={options} />
    </div>
  )
}

function TopPropertiesTable({ properties, inquiries }) {
  const topProps = useMemo(() => {
    const inquiryCount = new Map()
    inquiries.forEach(inq => {
      const propId = inq.property?._id?.toString()
      if (propId) inquiryCount.set(propId, (inquiryCount.get(propId) || 0) + 1)
    })
    const propsWithCount = properties.map(p => ({
      ...p,
      inquiryCount: inquiryCount.get(p._id.toString()) || 0,
    }))
    propsWithCount.sort((a, b) => b.inquiryCount - a.inquiryCount)
    return propsWithCount.slice(0, 5)
  }, [properties, inquiries])

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
            <th style={{ textAlign: 'left', padding: '8px', color: '#1a0a2e' }}>Title</th>
            <th style={{ textAlign: 'left', padding: '8px', color: '#1a0a2e' }}>City</th>
            <th style={{ textAlign: 'right', padding: '8px', color: '#1a0a2e' }}>Inquiries</th>
          </tr>
        </thead>
        <tbody>
          {topProps.map(prop => (
            <tr key={prop._id} style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
              <td style={{ padding: '8px', color: '#1a0a2e' }}>{prop.title}</td>
              <td style={{ padding: '8px', color: 'rgba(26,10,46,0.7)' }}>{prop.city || '-'}</td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#7c3aed' }}>{prop.inquiryCount}</td>
            </tr>
          ))}
          {topProps.length === 0 && (
            <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'rgba(26,10,46,0.5)' }}>No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function EditUserModal({ user, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'buyer',
  })

  if (!user) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1400 }}>
      <div style={{ width: 'min(100%, 460px)', background: '#fff', borderRadius: 22, padding: 24, boxShadow: '0 30px 80px rgba(15,23,42,0.24)' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: '#1a0a2e', marginBottom: 18 }}>
          Edit User
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" style={{ height: 46, borderRadius: 12, border: '1px solid rgba(124,58,237,0.18)', padding: '0 14px', outline: 'none' }} />
          <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" style={{ height: 46, borderRadius: 12, border: '1px solid rgba(124,58,237,0.18)', padding: '0 14px', outline: 'none' }} />
          <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} style={{ height: 46, borderRadius: 12, border: '1px solid rgba(124,58,237,0.18)', padding: '0 14px', outline: 'none' }}>
            <option value="buyer">Buyer</option>
            <option value="owner">Owner</option>
            <option value="agent">Agent</option>
            <option value="support">Support</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(124,58,237,0.18)', background: '#fff', color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onSave?.(form)} disabled={saving} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UserRow({ user, onDelete, onEdit }) {
  return (
    <div 
      className="list-row user-row"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)';
        e.currentTarget.style.backgroundColor = '#fcfaff';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.08)';
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{ 
        width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, 
        fontWeight: 800, color: '#fff', boxShadow: '0 4px 8px rgba(124,58,237,0.2)'
      }}>
        {getInitials(user.name)}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e', marginBottom: 4 }}>{user.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)' }}>{user.email}</div>
      </div>
      <div>
        <span style={{ 
          padding: '4px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.08)', 
          color: '#7c3aed', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' 
        }}>
          {user.role}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={() => onEdit?.(user)}
          style={{ 
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', 
            background: 'none', color: '#7c3aed', fontSize: 12, fontWeight: 600, 
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#7c3aed';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#7c3aed';
          }}
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(user._id)} 
          style={{ 
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', 
            background: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, 
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function PropertyRow({ prop, onDelete }) {
  const navigate = useNavigate()
  return (
    <div 
      className="list-row prop-row"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)';
        e.currentTarget.style.backgroundColor = '#fcfaff';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.08)';
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{ 
        width: 72, height: 60, borderRadius: 10, background: 'linear-gradient(135deg,#f0eeff,#e8e4ff)', 
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        fontSize: 20, color: '#7c3aed'
      }}>
        {prop.images?.[0] ? (
          <img src={prop.images[0]} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          'IMG'
        )}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e', marginBottom: 4 }}>{prop.title}</div>
        <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)' }}>{prop.city}</div>
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: '#1a0a2e' }}>
        {formatPrice(prop.price)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={() => navigate(`/property/${prop._id}`)} 
          style={{ 
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', 
            background: 'none', color: '#7c3aed', fontSize: 12, fontWeight: 600, 
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#7c3aed';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#7c3aed';
          }}
        >
          View
        </button>
        <button 
          onClick={() => onDelete(prop._id)} 
          style={{ 
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', 
            background: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, 
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ 
      textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, 
      border: '1px solid rgba(124,58,237,0.08)', transition: 'all 0.2s'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: '#1a0a2e', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ color: 'rgba(26,10,46,0.5)', fontSize: 14 }}>{sub}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [users, setUsers] = useState([])
  const [properties, setProperties] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [payments, setPayments] = useState([])
  const [inquirySearch, setInquirySearch] = useState('')
  const [activeInquiry, setActiveInquiry] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [savingUser, setSavingUser] = useState(false)
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, propsRes, inquiriesRes, paymentsRes] = await Promise.allSettled([
          userService.getAllUsers(),
          propertyService.getAll({ limit: 100 }),
          inquiryService.getAll(),
          paymentService.getAll(),
        ])
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || [])
        if (propsRes.status === 'fulfilled') setProperties(propsRes.value.data || [])
        if (inquiriesRes.status === 'fulfilled') setInquiries(inquiriesRes.value.data || [])
        if (paymentsRes.status === 'fulfilled') setPayments(paymentsRes.value.data || [])
        setStats({
          totalUsers: usersRes.value?.data?.length || 0,
          totalProperties: propsRes.value?.data?.length || 0,
          totalInquiries: inquiriesRes.value?.data?.length || 0,
          totalPayments: paymentsRes.value?.data?.length || 0,
          totalRevenue: (paymentsRes.value?.data || []).reduce((sum, payment) => sum + Number(payment?.amount || 0), 0),
        })
      } catch (error) {
        console.error('Failed to load admin dashboard:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete user?')) return
    try {
      await userService.deleteUser(id)
      setUsers(users.filter(u => u._id !== id))
      toast.success('User deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleDeleteProperty = async (id) => {
    if (!window.confirm('Delete property?')) return
    try {
      await propertyService.delete(id)
      setProperties(properties.filter(p => p._id !== id))
      toast.success('Property deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleSaveUser = async (payload) => {
    if (!editingUser?._id) return
    setSavingUser(true)
    try {
      const response = await userService.updateUser(editingUser._id, payload)
      const nextUser = response?.data || response
      setUsers((prev) => prev.map((entry) => (entry._id === editingUser._id ? { ...entry, ...nextUser } : entry)))
      setEditingUser(null)
      toast.success('User updated successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update user')
    } finally {
      setSavingUser(false)
    }
  }

  const filteredInquiries = inquiries
    .slice()
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
    .filter((inq) => {
      const keyword = inquirySearch.trim().toLowerCase()
      if (!keyword) return true
      const name = String(inq?.user?.name || inq?.name || '').toLowerCase()
      return name.includes(keyword)
    })

  const tabContent = [
    // Overview (unchanged)
    <div />,

    // Users (unchanged)
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e' }}>{users.length} Users</span>
      </div>
      {users.length === 0 ? (
        <EmptyState icon="US" title="No users" sub="Users will appear here" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map(u => <UserRow key={u._id} user={u} onDelete={handleDeleteUser} onEdit={setEditingUser} />)}
        </div>
      )}
    </div>,

    // Properties (unchanged)
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e' }}>{properties.length} Properties</span>
      </div>
      {properties.length === 0 ? (
        <EmptyState icon="PR" title="No properties" sub="Properties will appear here" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {properties.map(p => <PropertyRow key={p._id} prop={p} onDelete={handleDeleteProperty} />)}
        </div>
      )}
    </div>,

    // Inquiries (unchanged)
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e' }}>{inquiries.length} Inquiries</span>
      </div>
      <input
        type="text"
        value={inquirySearch}
        onChange={(event) => setInquirySearch(event.target.value)}
        placeholder="Search by sender name..."
        style={{ width: '100%', maxWidth: 320, height: 36, borderRadius: 10, border: '1px solid rgba(124,58,237,0.2)', background: '#faf8ff', color: '#1a0a2e', padding: '0 12px', fontSize: 13, marginBottom: 14, outline: 'none' }}
      />
      {inquiries.length === 0 ? (
        <EmptyState icon="IN" title="No inquiries" sub="Inquiries from users will appear here" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredInquiries.map(inq => (
            <div 
              key={inq._id} 
              style={{ 
                padding: 16, background: '#ffffff', border: '1px solid rgba(124,58,237,0.08)', 
                borderRadius: 14, transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)';
                e.currentTarget.style.backgroundColor = '#fcfaff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.08)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }}>{inq.user?.name || 'User'}</div>
                <span style={{ fontSize: 12, color: 'rgba(26,10,46,0.4)' }}>{timeAgo(inq.createdAt)}</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)', marginBottom: 8 }}>
                Property: <span style={{ fontWeight: 500, color: '#7c3aed' }}>{inq.property?.title}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(26,10,46,0.7)', lineHeight: 1.5, margin: 0 }}>
                {inq.message}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  onClick={() => setActiveInquiry(inq)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(124,58,237,0.28)',
                    background: 'rgba(124,58,237,0.08)',
                    color: '#7c3aed',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Open Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>,

    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1a0a2e' }}>{payments.length} Payments</span>
      </div>
      {payments.length === 0 ? (
        <EmptyState icon="PM" title="No payments yet" sub="Advance payments, tokens, and sale closures will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payments.map((payment) => <PaymentRow key={payment._id} payment={payment} />)}
        </div>
      )}
    </div>,

    // Reports now with real data
    <div>
      {/* Charts row 1 */}
      <div className="charts-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid rgba(124,58,237,0.1)', padding: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 16 }}>Properties Added (Last 6 Months)</h3>
          <PropertyTrendChart properties={properties} />
        </div>
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid rgba(124,58,237,0.1)', padding: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 16 }}>Inquiries by Property Type</h3>
          <InquiryByTypeChart properties={properties} inquiries={inquiries} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="charts-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid rgba(124,58,237,0.1)', padding: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 16 }}>User Role Distribution</h3>
          <RolePieChart users={users} />
        </div>
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid rgba(124,58,237,0.1)', padding: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#1a0a2e', marginBottom: 16 }}>Top 5 Properties (Most Inquiries)</h3>
          <TopPropertiesTable properties={properties} inquiries={inquiries} />
        </div>
      </div>
    </div>,
  ]

  return (
    <div className="admin-shell" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f5f8ff 0%, #f8f7ff 28%, #ffffff 100%)', fontFamily: "'DM Sans',sans-serif", color: '#1a0a2e', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        *{box-sizing:border-box;}
        .admin-shell::before{content:'';position:absolute;inset:0 0 auto;height:320px;background:radial-gradient(circle at top left, rgba(14,165,233,0.14), transparent 36%),radial-gradient(circle at top right, rgba(124,58,237,0.18), transparent 40%);pointer-events:none;}
        .list-row { display: grid; gap: 16px; padding: 14px 20px; background: #ffffff; border: 1px solid rgba(124,58,237,0.08); border-radius: 14px; align-items: center; transition: all 0.2s; }
        .user-row { grid-template-columns: 48px 1fr 120px 100px; }
        .prop-row { grid-template-columns: 80px 1fr 120px 120px; }
        @media(max-width:768px){
          .admin-header-row{flex-direction:column!important;gap:12px!important;align-items:stretch!important;}
          .user-row, .prop-row { grid-template-columns: 1fr; gap: 12px; text-align: center; justify-items: center; }
          .payment-list-item{flex-direction:column!important; text-align:center; align-items:center;}
          .admin-shell > div:last-child { padding-left: 16px !important; padding-right: 16px !important; }
          .admin-tab-scroll { overflow-x: auto !important; scrollbar-width: none !important; }
          .charts-2col { grid-template-columns: 1fr !important; }
        }
        @media(max-width:480px){
          .user-row, .prop-row { grid-template-columns: 1fr; }
          .admin-header-row button { font-size: 12px !important; padding: 8px 12px !important; }
        }
      `}</style>

      <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,247,255,0.96))', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.1)', padding: '20px 6vw 24px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 20px 60px rgba(91,33,182,0.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, 
                fontWeight: 800, color: '#fff', boxShadow: '0 6px 20px rgba(124,58,237,0.25)'
              }}>
                {getInitials(user?.name || 'Admin')}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#1a0a2e' }}>
                  Admin Dashboard
                </div>
                <div style={{ fontSize: 13, color: 'rgba(26,10,46,0.5)', marginTop: 2 }}>
                  {user?.email} | <span style={{ color: '#7c3aed', fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '10px 20px', background: '#ffffff', border: '1px solid rgba(124,58,237,0.22)',
                  borderRadius: 40, color: '#7c3aed', fontSize: 14, fontWeight: 600, cursor: 'pointer',
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
                Back to Website
              </button>
              <NotificationBell user={user} />
              <button 
                onClick={logout} 
                style={{ 
                  padding: '10px 20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', 
                  borderRadius: 40, color: '#7c3aed', fontSize: 14, fontWeight: 600, cursor: 'pointer', 
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#7c3aed';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                  e.currentTarget.style.color = '#7c3aed';
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map((t, i) => (
              <button 
                key={t} 
                onClick={() => setTab(i)}
                style={{ 
                  padding: '10px 22px', borderRadius: 40, border: 'none', fontSize: 14, fontWeight: 600, 
                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
                  background: tab === i ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(124,58,237,0.08)',
                  color: tab === i ? '#fff' : '#7c3aed',
                }}
                onMouseEnter={e => {
                  if (tab !== i) e.currentTarget.style.background = 'rgba(124,58,237,0.15)';
                }}
                onMouseLeave={e => {
                  if (tab !== i) e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                }}
              >
                {t}
                {i === 0 && stats.totalUsers > 0 && (
                  <span style={{ marginLeft: 6, background: tab === i ? '#fff' : '#7c3aed', color: tab === i ? '#7c3aed' : '#fff', borderRadius: 20, padding: '0 6px', fontSize: 11 }}>
                    {stats.totalUsers}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 6vw 64px' }}>
        {loading ? (
          <div style={{ padding: 20, background: '#ffffff', border: '1px solid rgba(124,58,237,0.08)', borderRadius: 14, color: 'rgba(26,10,46,0.55)' }}>
            Loading dashboard...
          </div>
        ) : (
          tabContent[tab]
        )}
      </div>
      {activeInquiry && (
        <ThreadPanel
          inquiry={activeInquiry}
          user={user}
          onClose={() => setActiveInquiry(null)}
        />
      )}
      <EditUserModal
        key={editingUser?._id || 'edit-user'}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
        saving={savingUser}
      />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
    </div>
  )
}

function PaymentRow({ payment }) {
  return (
    <div className="payment-list-item" style={{ padding: '16px 18px', background: '#ffffff', border: '1px solid rgba(124,58,237,0.08)', borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a0a2e' }}>
            {payment?.property?.title || 'Property Payment'}
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(26,10,46,0.56)', marginTop: 4 }}>
            Buyer: {payment?.user?.name || payment?.user?.email || 'Buyer'} | Owner: {payment?.recipient?.name || payment?.recipient?.email || 'Owner'}
          </div>
          <div style={{ fontSize: 12.5, color: 'rgba(26,10,46,0.56)', marginTop: 4 }}>
            Type: {payment?.paymentType === 'advance_token' ? 'Advance Payment / Token' : 'Sale Closure'} | Method: {payment?.paymentMethod}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#1a0a2e' }}>
            {formatPrice(payment?.amount || 0)}
          </div>
          <div style={{ fontSize: 12.5, color: payment?.status === 'completed' ? '#16a34a' : '#7c3aed', fontWeight: 700, textTransform: 'uppercase' }}>
            {payment?.status}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(26,10,46,0.45)', marginTop: 4 }}>
            {timeAgo(payment?.createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
}


