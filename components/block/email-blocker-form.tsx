"use client"

import type React from "react"

import { useState, useRef } from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { BlockUsers, CheckBlocked } from "@/lib/action"

export default function EmailBlockerForm() {
  const [emails, setEmails] = useState<string[]>([""])
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lastInputRef = useRef<HTMLInputElement>(null)

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
    
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault()


      // Add a new empty input
      const newEmails = [...emails]
      newEmails.splice(index + 1, 0, "")
      setEmails(newEmails)

      // Focus will automatically move to the new input in useEffect
      setTimeout(() => {
        const inputs = document.querySelectorAll('input[type="email"]')
        if (inputs[index + 1]) {
          ;(inputs[index + 1] as HTMLInputElement).focus()
        }
      }, 0)
    }
  }

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = [...emails]
      newEmails.splice(index, 1)
      setEmails(newEmails)
    } else {
      // If it's the last email, just clear it
      setEmails([""])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validEmails = emails.filter((email) => email.trim() !== "")

    if (validEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one email address",
        variant: "destructive",
      })
      return
    }

    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
BlockUsers(emails, startDate, endDate);
    // Simulate API call
    setTimeout(() => {
        
      toast({
        title: "Success",
        description: `Blocked ${validEmails.length} email(s) from ${format(startDate, "PPP")} to ${format(endDate, "PPP")}`,
      })

      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <Card className="border-black">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg">Block Email Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Email Addresses</label>
            <div className="space-y-2">
              {emails.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    className="border-black focus:ring-black"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={index === emails.length - 1 ? lastInputRef : null}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEmail(index)}
                    className="h-10 w-10 rounded-full p-0 text-black hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Press Enter to add a new email field</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-black",
                      !startDate && "text-gray-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-black",
                      !endDate && "text-gray-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => !startDate || date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Unblock Emails"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
