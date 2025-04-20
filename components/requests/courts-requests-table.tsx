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
import { toast } from "@/hooks/use-toast"
import { ReadCourtRequestsByRequestedBy } from "@/lib/courts/court"

type CourtRequest = {
  $id: string;
    courtId: any;
    courtName: any;
    startDateTime: any;
    endDateTime: any;
  status: "reserved" | "punched-in" | "late"
}

interface CourtsRequestsTableProps {
  isLoading: boolean
  searchQuery: string
}

export default function CourtsRequestsTable({ isLoading, searchQuery }: CourtsRequestsTableProps) {
  const [requests, setRequests] = useState<CourtRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<CourtRequest[]>([])
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
      const fetchRequests = async () => {
        setLoading(true)
        try {
          const response = await ReadCourtRequestsByRequestedBy();
          const data = response.reverse();
          setRequests(data)
          setFilteredRequests(data)
        } catch (err) {
          console.error("Error fetching item requests", err)
        } finally {
          setLoading(false)
        }
      }
  
      fetchRequests()
    }, [])
  
    useEffect(() => {
      if (!searchQuery.trim()) {
        setFilteredRequests(requests)
      } else {
        setFilteredRequests(
          requests.filter((req) =>
            req.courtName.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      }
    }, [searchQuery, requests])
    const handleDelete = async (id: string) => {
      const updated = filteredRequests.filter((request) => request.$id !== id)
      setRequests(updated)
      setFilteredRequests(updated)
      try{
        const deletionPromise = true//DeleteBookingRequest(id, itemId, bookedQuantity);
        await deletionPromise;
        toast({
                title: "Booking Deleted Successfully!",
                description: "Head for another Boooking?",
              })
      }catch (error) {
        console.error("Deletion failed:", error);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.\nPlease the store admin for assistance",
        })
        // Optionally: Revert optimistic update if deletion fails
        setRequests((prev) => [...prev, filteredRequests.find((req) => req.$id === id)!]);
        setFilteredRequests((prev) => [...prev, filteredRequests.find((req) => req.$id === id)!]);
      }
      
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
        {filteredRequests.reverse().map((request) => (
          <Card key={request.$id}>
            <CardHeader className="pb-2">
              <CardTitle>
                <Link href={`/requests/court/${request.$id}`} className="hover:underline">
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
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(request.$id)}>
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
          {filteredRequests.reverse().map((request) => (
            <TableRow key={request.$id}>
              <TableCell>
                <Link href={`/requests/court/${request.$id}`} className="hover:underline">
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
                <Button variant="ghost" size="icon" onClick={() => handleDelete(request.$id)}>
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
