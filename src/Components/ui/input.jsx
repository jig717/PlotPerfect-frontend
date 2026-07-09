// src/components/ui/Input.jsx
import { forwardRef, useState } from 'react'

export const Input = forwardRef(function Input(
  { label, error, icon, className='', ...props }, ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="pp-label">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(26,10,46,0.4)] text-base">{icon}</span>}
        <input
          ref={ref}
          className={`pp-input ${icon?'pl-10':''} ${error?'error':''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, options=[], className='', ...props }, ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="pp-label">{label}</label>}
      <select ref={ref} className={`pp-select ${error?'border-red-400':''} ${className}`} {...props}>
        {options.map(o => (
          <option key={o.value??o} value={o.value??o}>{o.label??o}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, rows=4, className='', ...props }, ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="pp-label">{label}</label>}
      <textarea ref={ref} rows={rows} className={`pp-textarea ${error?'border-red-400':''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
})

export function PasswordInput({ label, error, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="pp-label">{label}</label>}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(26,10,46,0.4)]">🔒</span>
        <input
          type={show ? 'text' : 'password'}
          className={`pp-input pl-10 pr-11 ${error?'error':''}`}
          {...props}
        />
        <button type="button" onClick={() => setShow(s=>!s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(26,10,46,0.4)] hover:text-[#7c3aed] transition-colors text-base">
          {show ? '🙈' : '👁️'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}