"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { formatISTDateTime } from "@/lib/utils"

type CourtRequest = {
  id: string
  courtId: string
  courtName: string
  startDateTime: Date
  endDateTime: Date
  status: "reserved" | "punched-in" | "late"
}

interface CourtsRequestsTableProps {
  isLoading: boolean
  searchQuery: string
}

export default function CourtsRequestsTable({ isLoading, searchQuery }: CourtsRequestsTableProps) {
  const [requests, setRequests] = useState<CourtRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  useEffect(() => {
    // Simulate data fetching
    const fetchRequests = async () => {
      setLoading(true)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock data
      const mockRequests: CourtRequest[] = [
        {
          id: "1",
          courtId: "1",
          courtName: "Basketball Court",
          startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          status: "reserved",
        },
        {
          id: "2",
          courtId: "2",
          courtName: "Tennis Court",
          startDateTime: new Date(),
          endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: "punched-in",
        },
        {
          id: "3",
          courtId: "3",
          courtName: "Badminton Court",
          startDateTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
          endDateTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
          status: "late",
        },
      ]

      // Filter requests based on search query if provided
      const filteredRequests = searchQuery
        ? mockRequests.filter((request) => request.courtName.toLowerCase().includes(searchQuery.toLowerCase()))
        : mockRequests

      setRequests(filteredRequests)
      setLoading(false)
    }

    fetchRequests()
  }, [searchQuery])

  const handleDelete = (id: string) => {
    setRequests(requests.filter((request) => request.id !== id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reserved":
        return "bg-green-500"
      case "punched-in":
        return "bg-blue-500"
      case "late":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading || loading) {
    if (isMobile) {
      return (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="w-3/4 h-6" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-1/3 h-6 mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Court Name</TableHead>
              <TableHead>Start Date/Time</TableHead>
              <TableHead>End Date/Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="w-32 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-32 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-32 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-20 h-6" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-8 h-8 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">No court requests found.</p>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader className="pb-2">
              <CardTitle>
                <Link href={`/requests/court/${request.id}`} className="hover:underline">
                  {request.courtName}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Start:</span>
                  <span className="text-sm">{formatISTDateTime(request.startDateTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">End:</span>
                  <span className="text-sm">{formatISTDateTime(request.endDateTime)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(request.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Court Name</TableHead>
            <TableHead>Start Date/Time</TableHead>
            <TableHead>End Date/Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <Link href={`/requests/court/${request.id}`} className="hover:underline">
                  {request.courtName}
                </Link>
              </TableCell>
              <TableCell>{formatISTDateTime(request.startDateTime)}</TableCell>
              <TableCell>{formatISTDateTime(request.endDateTime)}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(request.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
