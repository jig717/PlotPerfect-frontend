// frontend/src/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3400",
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// 🔐 Attach token automatically
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  err => Promise.reject(err)
)

// 📦 Return only data
api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (currentPath !== '/login' && currentPath !== '/signup') {
        sessionStorage.setItem('postLoginRedirect', currentPath)
      }
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
