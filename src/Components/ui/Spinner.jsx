export function Spinner({ size = 'md', className = '' }) {
  const s = { sm:'w-5 h-5 border-2', md:'w-9 h-9 border-[3px]', lg:'w-14 h-14 border-4' }
  return <div className={`${s[size]} border-[#ede9fe] border-t-[#7c3aed] rounded-full animate-spin ${className}`} />
}

export function PageSpinner() {
  return (
    <div className="min-h-screen bg-[#f8f7ff] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-[rgba(26,10,46,0.4)]">Loading…</p>
    </div>
  )
}