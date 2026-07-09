// src/hooks/index.js
import { useState, useEffect, useRef, useCallback } from 'react'

export function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const h = () => setY(window.scrollY)
    window.addEventListener('scroll', h, { passive:true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  return y
}

export function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    // Ensure threshold is a finite number, fallback to default
    const numericThreshold = (typeof threshold === 'number' && isFinite(threshold))
      ? threshold
      : 0.12

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: numericThreshold }
    )

    if (ref.current) obs.observe(ref.current)

    return () => obs.disconnect()
  }, [threshold])

  return [ref, inView]
}

export function useCounter(target, duration = 2000, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = null
    const ease = t => 1 - Math.pow(1-t, 3)
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts-start)/duration, 1)
      setCount(Math.floor(ease(p) * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return count
}

export function useDebounce(value, delay = 400) {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

export function useToggle(init = false) {
  const [v, setV] = useState(init)
  return [v, useCallback(() => setV(x => !x), [])]
}

export function useClickOutside(cb) {
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) cb() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [cb])
  return ref
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const h = e => setMatches(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [query])
  return matches
}

export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.1 }
    )
    const el = ref.current
    if (el) {
      el.querySelectorAll('.reveal').forEach(r => obs.observe(r))
      if (el.classList.contains('reveal')) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [])
  return ref
}