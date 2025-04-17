import type { Models } from "node-appwrite"

interface CourtDetailsProps {
  court: Models.Document
}

export default function CourtDetails({ court }: CourtDetailsProps) {
  return (
    <div className="flex-1 grid gap-4">
      <img
        src={court.courtImage || "/placeholder.svg"}
        alt={court.courtName}
        className="rounded-lg object-cover w-full aspect-[3/2]"
      />
      <div className="grid gap-2">
        <h2 className="text-2xl font-bold">{court.courtName}</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Location: {court.location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Minimum Users: {court.minUsers}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Maximum Time per Reserve: {court.maxTime} hour(s)</span>
        </div>
      </div>
    </div>
  )
}
