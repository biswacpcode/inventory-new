"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useDebouncedCallback } from "use-debounce"
import { format, addDays } from "date-fns"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import type { Models } from "node-appwrite"
import { signIn } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "../ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import {
  ReadCourtBookingsByCourtTypeAndDate,
  GenerateAvailableTimeSlots,
  ReadUserByEmail,
  CreateCourtRequest,
} from "@/lib/courts/court"

interface User {
  id: string
  email: string
}

interface BookingFormProps {
  court: Models.Document
  user: User | null
  userId: string | null
  permission: boolean
  setPermission: (value: boolean) => void
  router: AppRouterInstance
}

export default function BookingForm({ court, user, userId, permission, setPermission, router }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [companionEmails, setCompanionEmails] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [maxComp, setMaxComp] = useState<number>(0)
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false)

  useEffect(() => {
    if (court) {
      setMaxComp(court.minUsers - 1)
    }
  }, [court])

  useEffect(() => {
    async function fetchAvailableSlots() {
      if (selectedDate && court) {
        setIsLoadingTimeSlots(true)
        try {
          const slots = await GenerateAvailableTimeSlots(court.$id, selectedDate)

          const now = new Date()
          const currentISTTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
            .toTimeString()
            .slice(0, 8)

          const filteredSlots = slots.filter((slot) => {
            const [, endTime] = slot.split(" - ")
            return endTime > currentISTTime
          })

          if (format(now, "yyyy-MM-dd") === selectedDate) {
            setAvailableTimeSlots(filteredSlots)
          } else {
            setAvailableTimeSlots(slots)
          }
        } catch (error) {
          console.error("Failed to fetch available time slots:", error)
          setAvailableTimeSlots([])
        } finally {
          setIsLoadingTimeSlots(false)
        }
      } else {
        setAvailableTimeSlots([])
      }
    }

    fetchAvailableSlots()
  }, [selectedDate, court])

  useEffect(() => {
    if (userId && selectedDate && court) {
      checkPermission(userId, selectedDate)
    }
  }, [userId, selectedDate, court])

  const checkPermission = async (userId: string, date: string) => {
    try {
      const existingBookings = await ReadCourtBookingsByCourtTypeAndDate(court.type, date)
      let hasPermission = true

      for (const booking of existingBookings) {
        if (booking.status === "reserved" || booking.status === "punched-in") {
          if (userId === booking.requestedUser || booking.companions.split(",").includes(userId)) {
            hasPermission = false
            break
          }
        }
      }

      setPermission(hasPermission)
    } catch (error) {
      console.error("Error checking permission:", error)
      setPermission(false)
    }
  }

  const debouncedUpdateEmail = useDebouncedCallback((index: number, value: string) => {
    const updatedEmails = [...companionEmails]
    updatedEmails[index] = value
    setCompanionEmails(updatedEmails)
  }, 300)

  const handleCompanionEmailChange = (index: number, value: string) => {
    debouncedUpdateEmail(index, value)
  }

  const handleDateSelection = async (date: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot("")
  }

  const handleCompanionEmailsSubmit = async () => {
    setIsEmailSubmitting(true)
    try {
      setCompanionEmails([...companionEmails])
      setIsUpdating(true)
    } finally {
      setIsEmailSubmitting(false)
    }
  }

  const checkReservations = async (userId: string, companionEmails: string[], date: string) => {
    const companionUserIds: string[] = []

    for (const email of companionEmails) {
      if (email !== user?.email) {
        const companionUser = await ReadUserByEmail(email)
        if (companionUser) {
          if (companionUserIds.includes(companionUser.$id)) {
            return { canReserve: false, message: `You are trying to add duplicate email addresses` }
          }
          companionUserIds.push(companionUser.$id)
        } else {
          return { canReserve: false, message: `User with email ${email} not found.` }
        }
      } else {
        return { canReserve: false, message: `You cannot add your own email as a companion` }
      }
    }

    const allUserIds = [userId, ...companionUserIds]
    const existingBookings = await ReadCourtBookingsByCourtTypeAndDate(court.type, date)

    for (const booking of existingBookings) {
      if (booking.status === "reserved" || booking.status === "punched-in") {
        if (
          allUserIds.includes(booking.requestedUser) ||
          booking.companions.split(",").some((comp: string) => allUserIds.includes(comp))
        ) {
          return {
            canReserve: false,
            message: "You or your companions have an ongoing reservation. Please wait until it is completed.",
          }
        }
      }
    }

    return { canReserve: true, message: "No ongoing reservations." }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedTimeSlot || companionEmails.length < court.minUsers - 1) {
      alert("Please fill in all required fields.")
      return
    }

    if (!user) {
      alert("User not logged in.")
      signIn("google")
      return
    }

    if (!permission) {
      alert("You have one reservation already")
      router.push("/inventory")
      return
    }

    setIsSubmitting(true)

    try {
      const canReserve = await checkReservations(userId!, companionEmails, selectedDate)
      if (!canReserve.canReserve) {
        alert(canReserve.message)
        return
      }

      const companionUserIds: string[] = []
      for (const email of companionEmails) {
        const companionUser = await ReadUserByEmail(email)
        if (companionUser) {
          companionUserIds.push(companionUser.$id)
        } else {
          alert(`User with email ${email} not found.`)
          return
        }
      }

      await CreateCourtRequest({
        courtId: court.$id,
        courtName: court.courtName,
        requestedUser: userId!,
        companions: companionUserIds,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        type: court.type,
      })

      router.push("/requests")
    } catch (error: any) {
      console.error("Error reserving court:", error)
      alert(error.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Reserve Court</CardTitle>
        <CardDescription>Select your preferred time slot and companions to reserve the court.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DateSelector selectedDate={selectedDate} onDateSelect={handleDateSelection} />

          <div className="grid gap-2">
            <Label htmlFor="timeSlot">Available Time Slots</Label>
            <Select
              name="timeSlot"
              value={selectedTimeSlot}
              onValueChange={(value) => setSelectedTimeSlot(value)}
              required
              disabled={isLoadingTimeSlots}
            >
              <SelectTrigger>
                {isLoadingTimeSlots ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading slots...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select time slot" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Slots</SelectLabel>
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((slot, index) => (
                      <SelectItem key={index} value={slot}>
                        {slot}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-slots" disabled>
                      No available slots
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <CompanionEmailsSection
            maxComp={maxComp}
            companionEmails={companionEmails}
            handleCompanionEmailChange={handleCompanionEmailChange}
            handleCompanionEmailsSubmit={handleCompanionEmailsSubmit}
            isEmailSubmitting={isEmailSubmitting}
            isUpdating={isUpdating}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !permission || !selectedTimeSlot}
            title={!permission ? "You already have one reserved court" : "Reserve Court"}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Reserving...</span>
              </div>
            ) : (
              "Reserve Court"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

interface DateSelectorProps {
  selectedDate: string
  onDateSelect: (date: string) => void
}

function DateSelector({ selectedDate, onDateSelect }: DateSelectorProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="dateSelection">Select Date</Label>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedDate === format(new Date(), "yyyy-MM-dd") ? "default" : "outline"}
          onClick={() => onDateSelect(format(new Date(), "yyyy-MM-dd"))}
          type="button"
        >
          Today
        </Button>
        <Button
          variant={selectedDate === format(addDays(new Date(), 1), "yyyy-MM-dd") ? "default" : "outline"}
          onClick={() => onDateSelect(format(addDays(new Date(), 1), "yyyy-MM-dd"))}
          type="button"
        >
          Tomorrow
        </Button>
        <Button
          variant={selectedDate === format(addDays(new Date(), 2), "yyyy-MM-dd") ? "default" : "outline"}
          onClick={() => onDateSelect(format(addDays(new Date(), 2), "yyyy-MM-dd"))}
          type="button"
        >
          Day After Tomorrow
        </Button>
      </div>
    </div>
  )
}

interface CompanionEmailsSectionProps {
  maxComp: number
  companionEmails: string[]
  handleCompanionEmailChange: (index: number, value: string) => void
  handleCompanionEmailsSubmit: () => void
  isEmailSubmitting: boolean
  isUpdating: boolean
}

function CompanionEmailsSection({
  maxComp,
  companionEmails,
  handleCompanionEmailChange,
  handleCompanionEmailsSubmit,
  isEmailSubmitting,
  isUpdating,
}: CompanionEmailsSectionProps) {
  return (
    <div className="grid gap-4">
      <Label>Companion Emails</Label>
      {maxComp === 0 ? (
        <p>No companions needed.</p>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: maxComp }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="email"
                placeholder={`Companion ${index + 1} Email`}
                defaultValue={companionEmails[index] || ""}
                onChange={(e) => handleCompanionEmailChange(index, e.target.value)}
                required
              />
            </div>
          ))}
          <Button
            type="button"
            onClick={handleCompanionEmailsSubmit}
            disabled={
              companionEmails.length < maxComp ||
              companionEmails.some((email) => email.trim() === "") ||
              isEmailSubmitting
            }
            className="mt-2"
          >
            {isEmailSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isUpdating ? "Updating..." : "Adding..."}</span>
              </div>
            ) : isUpdating ? (
              "Update Changes"
            ) : (
              "Add Companions"
            )}
          </Button>
        </div>
      )}
      <small className="text-muted-foreground mt-2">Enter the email addresses of your {maxComp} companions.</small>
    </div>
  )
}
