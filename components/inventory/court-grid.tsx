import type { Court } from "@/app/inventory/page"
import { CourtCard } from "./court-card"

interface CourtGridProps {
  courts: Court[]
}

export function CourtGrid({ courts }: CourtGridProps) {
  if (courts.length === 0) {
    return <p className="text-center py-8">No courts match your search</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {courts.map((court) => (
        <CourtCard key={court.$id} court={court} />
      ))}
    </div>
  )
}
