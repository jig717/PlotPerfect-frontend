import { Spinner } from './Spinner'

export default function Button({
  children, variant='primary', size='md',
  loading=false, disabled, fullWidth, className='', ...props
}) {
  const base = `btn btn-${variant} btn-${size} ${fullWidth?'w-full':''} ${disabled||loading?'opacity-60 cursor-not-allowed pointer-events-none':''} ${className}`
  return (
    <button className={base} disabled={disabled||loading} {...props}>
      {loading && <Spinner size="sm" className="border-white border-t-transparent w-4 h-4 border-2" />}
      {children}
    </button>
  )
}