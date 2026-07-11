export const formatPrice = (n) => {
  if (!n && n !== 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

export const timeAgo = (d) => {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff/60000)
  const h = Math.floor(diff/3600000)
  const dy = Math.floor(diff/86400000)
  if (m  < 1)  return 'Just now'
  if (m  < 60) return `${m}m ago`
  if (h  < 24) return `${h}h ago`
  if (dy < 7)  return `${dy}d ago`
  return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(d))
}

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || '??'

export const truncate = (str = '', n = 80) =>
  str.length > n ? str.slice(0, n) + '…' : str

export const buildQuery = (params = {}) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k,v]) => { if (v !== '' && v != null) q.set(k,v) })
  return q.toString()
}

export const getDashboardPath = (role) =>
  ({ buyer:'/dashboard/buyer', owner:'/dashboard/owner', agent:'/dashboard/agent', admin:'/admin', support:'/support' }[role] || '/dashboard/buyer')

export const resolveApiAssetUrl = (path = '') => {
  if (!path) return ''
  if (/^(data:|blob:)/i.test(path)) return path

  if (/^https?:/i.test(path)) {
    const isLoopbackHttp = /^http:\/\/(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(:\d+)?\//i.test(path)
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && isLoopbackHttp) {
      return ''
    }
    return path
  }

  const baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3400'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const normalizedPath = String(path).startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export const getBadgeColor = (type) =>
  ({ sale:'#7c3aed', rent:'#0284c7', pg:'#16a34a', lease:'#ea580c' }[type] || '#7c3aed')

export const getBadgeLabel = (type) =>
  ({ sale:'For Sale', rent:'For Rent', pg:'PG', lease:'Lease' }[type] || 'For Sale')

export const getStrength = (p = '') => {
  let s = 0
  if (p.length >= 6)  s++
  if (p.length >= 10) s++
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}
export const STRENGTH_COLOR = ['','#ef4444','#f59e0b','#22c55e','#16a34a']
export const STRENGTH_LABEL = ['','Weak','Fair','Strong','Very Strong']
