export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(124,58,237,0.08)] overflow-hidden">
      <div className="pp-skeleton h-44" />
      <div className="p-4 space-y-3">
        <div className="pp-skeleton h-5 w-1/3 rounded" />
        <div className="pp-skeleton h-4 w-2/3 rounded" />
        <div className="pp-skeleton h-3 w-1/2 rounded" />
        <div className="flex gap-2 mt-2">
          {[40,50,45].map((w,i)=><div key={i} className="pp-skeleton h-6 rounded-full" style={{width:w+'px'}}/>)}
        </div>
      </div>
    </div>
  )
}

export function DashboardStatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(124,58,237,0.08)] p-5">
      <div className="pp-skeleton h-11 w-11 rounded-xl mb-3" />
      <div className="pp-skeleton h-7 w-1/2 rounded mb-2" />
      <div className="pp-skeleton h-4 w-2/3 rounded" />
    </div>
  )
}

export function ListRowSkeleton() {
  return (
    <div className="flex gap-3 p-4 bg-white rounded-xl border border-[rgba(124,58,237,0.08)] items-center">
      <div className="pp-skeleton w-16 h-12 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="pp-skeleton h-4 w-3/4 rounded" />
        <div className="pp-skeleton h-3 w-1/2 rounded" />
      </div>
      <div className="pp-skeleton h-4 w-20 rounded" />
    </div>
  )
}