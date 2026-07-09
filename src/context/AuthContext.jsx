// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) }
      catch { localStorage.removeItem('user') }
    }
    setLoading(false)
  }, [])

 const login = useCallback(async (credentials) => {
  try {
    const response = await authService.login(credentials);
    // response = { message, data: user, token, role }
    const userData = response.data;
    const token = response.token;    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    toast.success(`Welcome back, ${userData.name || userData.email}!`);
    return { success: true, user: userData, role: response.role };
  } catch (err) {
    console.error('Login error:', err);
    toast.error(err.response?.data?.message || 'Login failed');
    return { success: false };
  }
}, []);

  const signup = useCallback(async (formData) => {
    try {
      await authService.signup(formData)
      toast.success('Account created! Please log in.')
      return { success:true }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed')
      return { success:false }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    toast.info('Logged out successfully')
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const next = { ...(prev || {}), ...updates }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
