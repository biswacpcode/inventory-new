"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Models } from "node-appwrite"
import CourtDetails from "./court-details"
import BookingForm from "./booking-form"
import LoadingSkeleton from "./loading-skeleton"
import { ReadCourtById } from "@/lib/courts/court"

interface User {
  id: string
  email: string
}

export default function CourtBookingContainer({ courtId }: { courtId: string }) {
  const router = useRouter()
  const [court, setCourt] = useState<Models.Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [permission, setPermission] = useState<boolean>(true)

  useEffect(() => {
    async function fetchCourt() {
      try {
        const fetchedCourt = await ReadCourtById(courtId)
        if (fetchedCourt) {
          setCourt(fetchedCourt)
        } else {
          alert("Court not found.")
          router.push("/inventory")
        }
      } catch (error) {
        console.error("Failed to fetch court details:", error)
        alert("Failed to fetch court details.")
      } finally {
        setLoading(false)
      }
    }

    async function fetchUser() {
      try {
        const response = await fetch("/api/user-info", {
          method: "POST",
        })
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          setUserId(data.userId)
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error)
      }
    }

    fetchCourt()
    fetchUser()
  }, [courtId, router])

  if (loading || !court) return <LoadingSkeleton />

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 md:p-8 lg:p-12">
      <CourtDetails court={court} />
      <BookingForm
        court={court}
        user={user}
        userId={userId}
        permission={permission}
        setPermission={setPermission}
        router={router}
      />
    </div>
  )
}
