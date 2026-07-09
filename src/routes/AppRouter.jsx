import { useEffect, useRef } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../Components/ui/Spinner'
import { toast } from 'react-toastify'

// Pages
import Home from '../pages/Home'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import PropertyListPage from '../pages/property/PropertyListPage'
import PropertyDetailPage from '../pages/property/PropertyDetailPage'
import PostPropertyPage from '../pages/property/PostPropertyPage'
import BuyerDashboard from '../pages/dashboard/BuyerDashboard'
import AgentDashboard from '../pages/dashboard/AgentDashboard'
import AdminDashboard from '../pages/dashboard/AdminDashboard'
import SupportDashboard from '../pages/dashboard/SupportDashboard'
import OwnerDashboard from '../pages/dashboard/OwnerDashboard'
import ProfilePage from '../pages/profile/ProfilePage'
import CreateTicket from '../Support/ticketcreate'
import SavedProperties from '../pages/property/SavedProperties'
import AboutPage from '../pages/company/AboutPage'
import CareersPage from '../pages/company/CareersPage'
import PrivacyPolicyPage from '../pages/company/PrivacyPolicyPage'
import SupportCenterPage from '../pages/company/SupportCenterPage'
import NewProjectsPage from '../pages/buyer/NewProjectsPage'
import HomeLoansPage from '../pages/buyer/HomeLoansPage'
import PropertyValuationPage from '../pages/buyer/PropertyValuationPage'
import RentalAgreementPage from '../pages/owner/RentalAgreementPage'
import TenantVerificationPage from '../pages/owner/TenantVerificationPage'

/* Guards */
function PrivateRoute({ children, roles = [] }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

const GUEST_INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  '[data-requires-auth]',
  '.cursor-pointer',
].join(', ')

const GUEST_ALLOWED_SELECTOR = [
  'a[href="/login"]',
  'a[href="/signup"]',
  'a[href^="mailto:"]',
  'a[href^="tel:"]',
  '.Toastify',
  '[data-allow-guest]',
].join(', ')

function GuestInteractionGuard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const lastRedirectAtRef = useRef(0)

  useEffect(() => {
    if (loading || user) return undefined

    const redirectToLogin = () => {
      const now = Date.now()
      if (now - lastRedirectAtRef.current < 1200) return
      lastRedirectAtRef.current = now

      const from = `${location.pathname}${location.search}${location.hash}`
      sessionStorage.setItem('postLoginRedirect', from)
      toast.info('Please login to continue')
      navigate('/login', { state: { from } })
    }

    const isElementAllowed = (target) => (
      target instanceof Element && Boolean(target.closest(GUEST_ALLOWED_SELECTOR))
    )

    const isInteractiveTarget = (target) => (
      target instanceof Element && Boolean(target.closest(GUEST_INTERACTIVE_SELECTOR))
    )

    const handlePointerDown = (event) => {
      if (isElementAllowed(event.target) || !isInteractiveTarget(event.target)) return
      event.preventDefault()
      event.stopPropagation()
      redirectToLogin()
    }

    const handleFocusIn = (event) => {
      if (isElementAllowed(event.target) || !isInteractiveTarget(event.target)) return
      redirectToLogin()
    }

    const handleSubmit = (event) => {
      if (isElementAllowed(event.target)) return
      event.preventDefault()
      redirectToLogin()
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('focusin', handleFocusIn, true)
    document.addEventListener('submit', handleSubmit, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('focusin', handleFocusIn, true)
      document.removeEventListener('submit', handleSubmit, true)
    }
  }, [loading, user, navigate, location.pathname, location.search, location.hash])

  return <Outlet />
}

const router = createBrowserRouter([
  /* Public */
  {
    path: '/',
    element: <GuestInteractionGuard />,
    children: [
      { index: true, element: <Home /> },
      { path: 'properties', element: <PropertyListPage /> },
      { path: 'property/:id', element: <PropertyDetailPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'careers', element: <CareersPage /> },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'support-center', element: <SupportCenterPage /> },
      { path: 'new-projects', element: <NewProjectsPage /> },
      { path: 'home-loans', element: <HomeLoansPage /> },
      { path: 'property-valuation', element: <PropertyValuationPage /> },
    ],
  },

  /* Auth */
  {
    path: '/',
    element: <PublicRoute />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },

  /* Protected - agent & owner */
  {
    path: '/protected/agent',
    element: (
      <PrivateRoute roles={['agent', 'owner']}>
        <PostPropertyPage />
      </PrivateRoute>
    ),
  },

  /* Protected - owner */
  {
    path: '/dashboard/owner',
    element: (
      <PrivateRoute roles={['owner']}>
        <OwnerDashboard />
      </PrivateRoute>
    ),
  },

  /* Protected - buyer */
  {
    path: '/dashboard/buyer',
    element: (
      <PrivateRoute roles={['buyer']}>
        <BuyerDashboard />
      </PrivateRoute>
    ),
  },

  /* Protected - shared logged in */
  {
    path: '/property/saved',
    element: (
      <PrivateRoute>
        <SavedProperties />
      </PrivateRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <ProfilePage />
      </PrivateRoute>
    ),
  },

  /* Protected - agent */
  {
    path: '/dashboard/agent',
    element: (
      <PrivateRoute roles={['agent']}>
        <AgentDashboard />
      </PrivateRoute>
    ),
  },

  /* Protected - owner tools */
  {
    path: '/owner/rental-agreement',
    element: (
      <PrivateRoute roles={['owner', 'agent']}>
        <RentalAgreementPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/owner/tenant-verification',
    element: (
      <PrivateRoute roles={['owner', 'agent']}>
        <TenantVerificationPage />
      </PrivateRoute>
    ),
  },

  /* Protected - admin */
  {
    path: '/admin',
    element: (
      <PrivateRoute roles={['admin']}>
        <AdminDashboard />
      </PrivateRoute>
    ),
  },

  /* Protected - support */
  {
    path: '/support',
    element: (
      <PrivateRoute roles={['support']}>
        <SupportDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/support/create',
    element: (
      <PrivateRoute>
        <CreateTicket />
      </PrivateRoute>
    ),
  },

  /* 404 */
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
