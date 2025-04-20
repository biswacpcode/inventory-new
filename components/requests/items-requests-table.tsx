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
import { DeleteBookingRequest, ReadItemBookingsByRequestedBy } from "@/lib/items/item"
import { toast } from "@/hooks/use-toast"
export type ItemRequest = {
  $id: string;
  itemName: string;
  start: string;
  end: string;
  bookedQuantity: number;
  status: string;
  itemId: string;
}

interface ItemsRequestsTableProps {
  isLoading: boolean
  searchQuery: string
}

export default function ItemsRequestsTable({ isLoading, searchQuery }: ItemsRequestsTableProps) {
  const [requests, setRequests] = useState<ItemRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ItemRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      try {
        const response = await ReadItemBookingsByRequestedBy();
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
          req.itemName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }
  }, [searchQuery, requests])

  const handleDelete = async (id: string, itemId: string, bookedQuantity: number) => {
    const updated = filteredRequests.filter((request) => request.$id !== id)
    setRequests(updated)
    setFilteredRequests(updated)
    try{
      const deletionPromise = DeleteBookingRequest(id, itemId, bookedQuantity);
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
      case "approved":
        return "bg-green-500"
      case "issued":
        return "bg-blue-500"
      case "collected":
        return "bg-purple-500"
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
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="w-3/4 h-6" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Skeleton className="w-full h-4" />
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
              <TableHead>Item Name</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Return By</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, index) => (
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
                  <Skeleton className="w-8 h-4" />
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

  if (filteredRequests.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">No item requests found.</p>
      </div>
    )
  }

  return isMobile ? (
    <div className="grid gap-4">
      {filteredRequests.map((request) => (
        <Card key={request.$id}>
        <CardHeader className="pb-2">
          <CardTitle>
            <Link href={`/requests/item/${request.$id}`} className="hover:underline">
              {request.itemName}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Requested:</span>
              <span className="text-sm">{formatISTDateTime(new Date(request.start))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Return By:</span>
              <span className="text-sm">{formatISTDateTime(new Date(request.end))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Quantity:</span>
              <span className="text-sm">{request.bookedQuantity}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Badge className={getStatusColor(request.status)}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(request.$id, request.itemId, request.bookedQuantity)} disabled={request.status!=="pending"}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      ))}
    </div>
  ) : (
    <div className="rounded-md border mx-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Requested At</TableHead>
            <TableHead>Return By</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.reverse().map((request) => (
            <TableRow key={request.$id}>
              <TableCell>
                <Link href={`/requests/item/${request.$id}`} className="hover:underline">
                  {request.itemName}
                </Link>
              </TableCell>
              <TableCell>{formatISTDateTime(new Date(request.start))}</TableCell>
              <TableCell>{formatISTDateTime(new Date(request.end))}</TableCell>
              <TableCell>{request.bookedQuantity}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(request.$id, request.itemId, request.bookedQuantity)} disabled={request.status!=="pending"}>
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
