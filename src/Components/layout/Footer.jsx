import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboardPath } from '../../utils'

const itemClass = 'foot-lnk block text-sm text-white/30 hover:text-[#a78bfa] hover:pl-1 transition text-left'

export default function Footer() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const isOwnerOrAgent = user && ['owner', 'agent'].includes(user.role)

  const goToPostProperty = () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isOwnerOrAgent) {
      navigate('/protected/agent')
      return
    }

    navigate(getDashboardPath(user.role))
  }

  const goToManageListings = () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role === 'owner') {
      navigate('/dashboard/owner')
      return
    }

    if (user.role === 'agent') {
      navigate('/dashboard/agent')
      return
    }

    navigate(getDashboardPath(user.role))
  }

  const goToOwnerTool = (path) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isOwnerOrAgent) {
      navigate(path)
      return
    }

    navigate(getDashboardPath(user.role))
  }

  return (
    <footer className="bg-[#040109] text-white py-12 px-6 border-t border-white/5">
      <div className="wrap max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-9 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7 h-7 bg-linear-to-br from-[#a78bfa] to-[#7c3aed] rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
              <span className="font-serif text-lg font-extrabold text-white">Plot<span className="text-[#a78bfa]">Perfect</span></span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed max-w-60">
              India's most trusted real estate platform across 150+ cities. Verified listings, zero brokerage.
            </p>
          </div>

          <div>
            <h4 className="foot-h text-[11.5px] font-bold text-white/40 uppercase tracking-wider mb-3.5">For Buyers</h4>
            <button type="button" onClick={() => navigate('/properties?type=sale')} className={itemClass}>Buy Property</button>
            <button type="button" onClick={() => navigate('/new-projects')} className={itemClass}>New Projects</button>
            <button type="button" onClick={() => navigate('/home-loans')} className={itemClass}>Home Loans</button>
            <button type="button" onClick={() => navigate('/property-valuation')} className={itemClass}>Property Valuation</button>
          </div>

          <div>
            <h4 className="foot-h text-[11.5px] font-bold text-white/40 uppercase tracking-wider mb-3.5">For Owners</h4>
            <button type="button" onClick={goToPostProperty} className={itemClass}>Post Property Free</button>
            <button type="button" onClick={goToManageListings} className={itemClass}>Manage Listings</button>
            <button type="button" onClick={() => goToOwnerTool('/owner/rental-agreement')} className={itemClass}>Rental Agreement</button>
            <button type="button" onClick={() => goToOwnerTool('/owner/tenant-verification')} className={itemClass}>Tenant Verification</button>
          </div>

          <div>
            <h4 className="foot-h text-[11.5px] font-bold text-white/40 uppercase tracking-wider mb-3.5">Company</h4>
            <button type="button" onClick={() => navigate('/about')} className={itemClass}>About Us</button>
            <button type="button" onClick={() => navigate('/careers')} className={itemClass}>Careers</button>
            <button type="button" onClick={() => navigate('/support-center')} className={itemClass}>Support</button>
            <button type="button" onClick={() => navigate('/privacy-policy')} className={itemClass}>Privacy Policy</button>
          </div>
        </div>

        <div className="border-t border-white/5 pt-5 flex justify-between flex-wrap gap-2.5">
          <span className="text-xs text-white/20">🩷 2026 PlotPerfect Pvt. Ltd. All rights reserved.</span>
          <span className="text-xs text-white/20">Made with <span className="text-[#7c3aed]">🩷</span> for India</span>
        </div>
      </div>
    </footer>
  )
}
