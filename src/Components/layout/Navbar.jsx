import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboardPath, resolveApiAssetUrl } from '../../utils'
import NotificationBell from '../ui/NotificationBell'

const NAV_TABS = ['Buy', 'Rent', 'PG / Hostel', 'Commercial', 'Post Property']

export default function Navbar() {
  const [active, setActive] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Helper function to handle navigation with fallback
  const handleNavigation = (path) => {
    try {
      navigate(path)
    } catch (error) {
      console.warn('Navigation failed, using fallback', error)
      window.location.href = path
    }
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  const avatarSource = resolveApiAssetUrl(
    user?.profileImage || user?.profile_image || user?.avatar || user?.image || ''
  )

  // Toggle dropdown
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  return (
    <nav
      id="nav"
      className="sticky top-0 z-200 bg-white/88 backdrop-blur-xl border-b border-[rgba(124,58,237,0.12)] px-6 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 bg-linear-to-br from-[#a78bfa] to-[#7c3aed] rounded-[10px] flex items-center justify-center shadow-lg shadow-[#7c3aed]/50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
          <span className="font-serif text-xl font-extrabold text-[#1a0a2e]">
            Plot<span className="text-[#a78bfa]">Perfect</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div id="nav-links" className="hidden md:flex gap-0.5 mr-3.5">
          {NAV_TABS.map((tab, i) => (
            <button
              key={tab}
              className={`nav-link-btn px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative ${
                i === active
                  ? 'text-[#a78bfa] after:absolute after:-bottom-px after:left-3 after:right-3 after:h-0.5 after:bg-[#7c3aed] after:rounded-sm'
                  : 'text-[rgba(26,10,46,0.4)] hover:text-[#1a0a2e] hover:bg-[rgba(0,0,0,0.04)]'
              }`}
              onClick={() => setActive(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Desktop Right Buttons */}
        <div className="hidden md:flex gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <NotificationBell user={user} />
              <div className="relative user-dropdown">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(124,58,237,0.2)] bg-transparent hover:bg-[rgba(124,58,237,0.04)] transition"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-linear-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-white text-sm font-bold">
                    {avatarSource ? (
                      <img src={avatarSource} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(user.name || user.email)
                    )}
                  </div>
                  <span className="text-sm font-medium text-[rgba(26,10,46,0.7)]">
                    {user.name?.split(' ')[0] || 'Profile'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[rgba(124,58,237,0.1)] overflow-hidden z-50">
                    <button
                      onClick={() => {
                        navigate('/profile')
                        setDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#1a0a2e] hover:bg-[rgba(124,58,237,0.08)] transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate(getDashboardPath(user.role))
                        setDropdownOpen(false)
                    }}
                      className="w-full text-left px-4 py-2 text-sm text-[#1a0a2e] hover:bg-[rgba(124,58,237,0.08)] transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <button
                className="px-4 py-1.5 rounded-lg border border-[rgba(124,58,237,0.2)] bg-transparent text-[rgba(26,10,46,0.65)] text-sm font-medium hover:text-[#1a0a2e] hover:border-[rgba(124,58,237,0.4)] transition"
                onClick={() => handleNavigation('/login')}
              >
                Login
              </button>
              <button className="btn-p px-4 py-1.5 text-sm bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition" onClick={() => navigate('/protected/agent')}>
                Post Free ✦
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-[rgba(124,58,237,0.2)] text-[#1a0a2e] focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white border-t border-[rgba(124,58,237,0.1)] shadow-xl z-50 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div className="p-5 space-y-6">
            {/* User Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-linear-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-white font-bold text-lg">
                  {avatarSource ? (
                    <img src={avatarSource} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : user ? (
                    getInitials(user.name || user.email)
                  ) : (
                    '👤'
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#1a0a2e]">
                    {user ? user.name || user.email : 'Guest User'}
                  </p>
                  <p className="text-xs text-[rgba(26,10,46,0.5)]">
                    {user ? `Role: ${user.role}` : 'Sign in for better experience'}
                  </p>
                </div>
              </div>
              <button
                className="text-[rgba(26,10,46,0.4)] hover:text-[#7c3aed]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Auth Buttons (mobile) */}
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-end">
                  <NotificationBell user={user} />
                </div>
                <button
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(124,58,237,0.3)] text-[#7c3aed] font-semibold text-sm hover:bg-[#7c3aed] hover:text-white transition"
                  onClick={() => {
                    navigate('/profile')
                    setMobileMenuOpen(false)
                  }}
                >
                  Profile
                </button>
                <button
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(124,58,237,0.3)] text-[#7c3aed] font-semibold text-sm hover:bg-[#7c3aed] hover:text-white transition"
                  onClick={() => {
                    navigate(getDashboardPath(user.role))
                    setMobileMenuOpen(false)
                  }}
                >
                  Dashboard
                </button>
                <button
                  className="w-full px-4 py-3 rounded-lg border border-[rgba(239,68,68,0.3)] text-[#ef4444] font-semibold text-sm hover:bg-[#ef4444] hover:text-white transition"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-3 rounded-lg border border-[rgba(124,58,237,0.3)] text-[#7c3aed] font-semibold text-sm hover:bg-[#7c3aed] hover:text-white transition"
                  onClick={() => {
                    handleNavigation('/login')
                    setMobileMenuOpen(false)
                  }}
                >
                  Login
                </button>
                <button
                  className="flex-1 px-4 py-3 rounded-lg bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white font-semibold text-sm hover:shadow-lg transition"
                  onClick={() => {
                    handleNavigation('/signup')
                    setMobileMenuOpen(false)
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Navigation Menu Items */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[rgba(26,10,46,0.4)] uppercase tracking-wider px-2">Explore</p>
              {NAV_TABS.map((tab, i) => {
                const icons = {
                  'Buy': '🏠',
                  'Rent': '🔑',
                  'PG / Hostel': '🛏️',
                  'Commercial': '🏢',
                  'Post Property': '📋'
                }
                return (
                  <button
                    key={tab}
                    className={`nav-link-btn w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      i === active
                        ? 'bg-[#7c3aed] text-white'
                        : 'text-[rgba(26,10,46,0.7)] hover:bg-[rgba(124,58,237,0.08)]'
                    }`}
                    onClick={() => {
                      setActive(i)
                      setMobileMenuOpen(false)
                      // Add navigation logic if needed
                    }}
                  >
                    <span className="text-xl">{icons[tab] || '📌'}</span>
                    <span>{tab}</span>
                    {i === active && (
                      <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Post Property Button */}
            <div className="pt-4 border-t border-[rgba(124,58,237,0.1)]">
              <button className="w-full btn-p px-4 py-3 text-sm bg-linear-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-xl font-bold shadow-md hover:shadow-lg transition" onClick={() => navigate('/protected/agent')}>
                Post Property Free ✦
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
} 




