import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Court } from "@/app/inventory/page"
import Image from "next/image"

interface CourtCardProps {
  court: Court
}

export function CourtCard({ court }: CourtCardProps) {
  return (
    <div
      className="bg-background rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-2xl hover:scale-105 border-2 border-white"
      style={{ transition: "all 0.3s ease" }}
    >
      <Image
        src={court.courtImage || "/placeholder.svg"}
        alt={court.courtName}
        width={400}
        height={300}
        className="w-full h-60 object-cover"
        style={{ aspectRatio: "400/300", objectFit: "cover" }}
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{court.courtName}</h3>
        <p className="text-sm text-muted-foreground">Location: {court.location}</p>
        <Link href={`/inventory/court/${court.$id}`}>
          <Button size="sm" className="mt-4 w-full">
            Reserve
          </Button>
        </Link>
      </div>
    </div>
  )
}
