import { Suspense } from "react"
import CourtBookingContainer from "@/components/court-reservation/court-booking-container"
import CourtBookingSkeleton from "@/components/court-reservation/court-booking-skeleton"

export default function CourtBookingPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<CourtBookingSkeleton />}>
      <CourtBookingContainer courtId={params.id} />
    </Suspense>
  )
}
