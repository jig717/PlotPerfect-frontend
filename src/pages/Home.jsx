import { lazy, Suspense } from 'react'

// Lazy load each section
const Navbar = lazy(() => import('../Components/layout/Navbar'))
const Hero = lazy(() => import('../Components/Home/Hero'))
const Marquee = lazy(() => import('../Components/Home/Marquee'))
const Categories = lazy(() => import('../Components/Home/Categories'))
const FeaturedProperties = lazy(() => import('../Components/Home/FeaturedProperties'))
const HowItWorks = lazy(() => import('../Components/Home/work'))
const CTABanner = lazy(() => import('../Components/Home/CTABanner'))
const Cities = lazy(() => import('../Components/Home/Cities'))
const Testimonials = lazy(() => import('../Components/Home/Testimonials'))
const Footer = lazy(() => import('../Components/layout/Footer'))

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_55%),linear-gradient(180deg,_#ffffff_0%,_#f6f2ff_100%)] overflow-hidden">
    <div className="flex flex-col items-center gap-5 animate-[sitePulse_1.4s_ease-in-out_infinite]">
      <div className="w-20 h-20 rounded-[28px] bg-[linear-gradient(135deg,#7c3aed,#2563eb)] shadow-[0_20px_60px_rgba(124,58,237,0.35)] flex items-center justify-center text-white text-2xl font-black tracking-[0.24em]">
        PP
      </div>
      <div className="h-1.5 w-40 rounded-full bg-[rgba(124,58,237,0.12)] overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,#7c3aed,#2563eb)] animate-[siteLoader_1.2s_ease-in-out_infinite]"></div>
      </div>
    </div>
  </div>
)

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes siteEnter {
          0% { opacity: 0; transform: scale(0.96) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes sitePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }

        @keyframes siteLoader {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
      <Suspense fallback={<LoadingFallback />}>
        <div style={{ animation: 'siteEnter 720ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
          <Navbar />
          <Hero />
          <Marquee />
          <Categories />
          <FeaturedProperties />
          <HowItWorks />
          <CTABanner />
          <Cities />
          <Testimonials />
          <Footer />
        </div>
      </Suspense>
    </>
  )
}
