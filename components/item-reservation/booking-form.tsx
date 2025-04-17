"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import { Button } from "@/components/ui/button"
import Loading from "../layout/Loader"
import { Input } from "../ui/input"
import { CreateBookingRequest } from "@/lib/items/item"
import { toast } from "@/hooks/use-toast"

interface BookingFormProps {
  item: any
  onSuccess: () => void
}

export default function BookingForm({ item, onSuccess }: BookingFormProps) {
  const [isInvalidQuantity, setIsInvalidQuantity] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10)
    setIsInvalidQuantity(isNaN(value) || value <= 0 || value > item.availableQuantity || value > item.maxQuantity)
  }

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isInvalidQuantity) {
      return
    }

    setIsLoading(true)

    try {
      const bookedQuantity = Number.parseInt(
        (e.currentTarget.elements.namedItem("bookedQuantity") as HTMLInputElement).value,
        10,
      )

      // Get the current date and time
      const currentDate = new Date()
      const startDate = formatDate(currentDate)
      const startTime = currentDate.toTimeString().split(" ")[0] // HH:MM:SS format

      // Calculate endDate by adding maxTime (in days) to the current date
      const endDate = new Date(currentDate)
      endDate.setDate(endDate.getDate() + item.maxTime)
      const formattedEndDate = formatDate(endDate)

      // Set end time to 23:59:59
      const endTime = "23:59:59"
      const start = new Date(`${startDate.split('-').reverse().join('-')}T${startTime}`).toISOString();
      const end = new Date(`${formattedEndDate.split('-').reverse().join('-')}T${endTime}`).toISOString();
      // Prepare form data
      const formData = new FormData()
      formData.append("itemId", item.$id)
      formData.append("requestedTo", item.society)
      formData.append("start", start)
      formData.append("end", end)
      formData.append("bookedQuantity", bookedQuantity.toString())
      formData.append("status", item.defaultStatus)

      // Call the CreateBookingRequest function
      await CreateBookingRequest(formData)
      toast({
        title: "Sucessfull Booking!",
        description: "Congratulations your request have been successfully booked.",
      })
      onSuccess()
    } catch (error) {
      console.error("Error creating booking request:", error)
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.\nPlease the store admin for assistance",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reserve Item</CardTitle>
        <CardDescription>Select the quantity you need.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              type="number"
              id="quantity"
              name="bookedQuantity"
              min="1"
              max={Math.min(item.availableQuantity, item.maxQuantity)}
              onChange={handleQuantityChange}
              placeholder={`Max: ${Math.min(item.availableQuantity, item.maxQuantity)}`}
            />
          </div>
          
          {isLoading ? (
            <Loading />
          ) : (
            <Button type="submit" size="lg" className="w-full" disabled={isInvalidQuantity}>
              Reserve Item
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
