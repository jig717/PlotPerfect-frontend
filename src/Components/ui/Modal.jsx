export function Modal({ open, onClose, title, children, size='md' }) {
  if (!open) return null
  const widths = { sm:'max-w-sm', md:'max-w-md', lg:'max-w-2xl', xl:'max-w-4xl' }
  return (
    <div
      className="fixed inset-0 z-500 flex items-center justify-center p-4"
      style={{ background:'rgba(26,10,46,0.5)', backdropFilter:'blur(4px)' }}
      onClick={e => { if(e.target===e.currentTarget) onClose() }}
    >
      <div className={`w-full ${widths[size]} bg-white rounded-2xl border border-[rgba(124,58,237,0.15)] overflow-hidden shadow-2xl`}
        style={{ boxShadow:'0 32px 80px rgba(124,58,237,0.2)' }}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(124,58,237,0.1)]">
            <h3 className="text-base font-bold text-[#1a0a2e]">{title}</h3>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgba(26,10,46,0.4)] hover:text-[#7c3aed] hover:bg-[#f0eeff] transition-all text-xl leading-none">
              ×
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// src/components/ui/Badge.jsx
export function Badge({ children, variant='purple', className='' }) {
  const variants = {
    purple: 'badge badge-purple',
    blue:   'badge badge-blue',
    green:  'badge badge-green',
    orange: 'badge badge-orange',
    red:    'badge badge-red',
    filled: 'badge badge-filled',
  }
  return <span className={`${variants[variant]||variants.purple} ${className}`}>{children}</span>
}

// src/components/ui/StatCard.jsx
export function StatCard({ icon, label, value, change, up=true, onClick }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[rgba(124,58,237,0.1)] p-5 shadow-sm transition-all duration-200 ${onClick?'cursor-pointer hover:shadow-md hover:border-[rgba(124,58,237,0.25)]':''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
          style={{ background:'#f0eeff', border:'1px solid rgba(124,58,237,0.15)' }}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${up?'text-emerald-600 bg-emerald-50':'text-red-500 bg-red-50'}`}>
            {up?'↑':'↓'} {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[#1a0a2e]" style={{ fontFamily:"'Playfair Display',serif" }}>{value}</div>
      <div className="text-sm text-[rgba(26,10,46,0.5)] mt-1">{label}</div>
    </div>
  )
}

// src/components/ui/EmptyState.jsx
export function EmptyState({ icon='🏠', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-[#1a0a2e] mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-[rgba(26,10,46,0.45)] mb-6 max-w-xs leading-relaxed">{subtitle}</p>}
      {action}
    </div>
  )
}