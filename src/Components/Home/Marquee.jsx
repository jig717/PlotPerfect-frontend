const MARQUEE_ITEMS = [
  '✦ 5 Lakh+ Active Listings',
  '✦ Verified Owners',
  '✦ Zero Brokerage',
  '✦ 2M+ Happy Users',
  '✦ 150+ Cities',
  '✦ Trusted Agents',
  '✦ Secure Payments',
  '✦ 24/7 Support',
  '✦ Free Listing',
  '✦ Instant Leads'
]

export default function Marquee() {
  return (
    <div className="marquee-wrap bg-[#f9f9ff] border-y border-[rgba(124,58,237,0.05)] py-3 overflow-hidden">
      <div className="marquee-track flex w-max animate-[marquee_30s_linear_infinite] hover:paused">
        {[...Array(2)].map((_, idx) =>
          MARQUEE_ITEMS.map((item, i) => (
            <span key={`${idx}-${i}`} className="m-item px-8 text-sm font-semibold text-[rgba(26,10,46,0.4)] whitespace-nowrap">
              <span className="m-dot text-[#7c3aed] mr-2">●</span>
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  )
}