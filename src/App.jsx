import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './routes/AppRouter'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'


export default function App() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('vis')
            observer.unobserve(entry.target)
          }
        })
    },
      { threshold: 0.1 }
    )
    document.querySelectorAll('[data-reveal], .r').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <AuthProvider>
      <AppRouter />
      <ToastContainer
        position="top-right"
        autoClose={2500}
        toastStyle={{
          background: '#fff',
          color: '#1a0a2e',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(124,58,237,0.15)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
        }}
      />
    </AuthProvider>
  )
}