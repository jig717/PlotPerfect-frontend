import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboardPath } from '../../utils'

export default function CTABanner() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handlePostProperty = () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role === 'agent' || user.role === 'owner') {
      navigate('/protected/agent')
      return
    }

    navigate(getDashboardPath(user.role))
  }

  const handleDashboard = () => {
    if (!user) {
      navigate('/login')
      return
    }

    navigate(getDashboardPath(user.role))
  }

  return (
    <section className="sec alt py-16 px-6 bg-[#f9f9ff]">
      <div className="wrap max-w-7xl mx-auto">
        <div className="r" data-reveal>
          <div className="cta bg-linear-to-r from-[#e8e4ff] via-[#ddd8ff] to-[#e8e4ff] bg-size-[200%] animate-[gradShift_7s_ease_infinite] border border-[rgba(124,58,237,0.25)] rounded-[20px] p-12 flex items-center gap-10 flex-wrap relative overflow-hidden shadow-2xl">
            <div className="flex-1 min-w-65 relative">
              <h2 className="font-serif text-3xl font-extrabold text-[#1a0a2e] mb-2">List Your Property for Free</h2>
              <p className="text-base text-[rgba(26,10,46,0.65)] leading-relaxed">
                Reach active buyers and renters. Get genuine, verified leads with transparent communication.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap relative">
              <button
                type="button"
                onClick={handlePostProperty}
                className="btn-p px-6 py-3 bg-white text-[#7c3aed] rounded-[10px] font-bold shadow-md hover:-translate-y-0.5 hover:shadow-xl transition"
              >
                Post Property Free
              </button>
              <button
                type="button"
                onClick={handleDashboard}
                className="btn-ghost px-6 py-3 bg-[rgba(124,58,237,0.06)] border border-[rgba(124,58,237,0.3)] rounded-[10px] text-[#1a0a2e] font-semibold hover:bg-[rgba(124,58,237,0.12)] transition"
              >
                {user ? 'Go to Dashboard ?' : 'Login to Continue ?'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
