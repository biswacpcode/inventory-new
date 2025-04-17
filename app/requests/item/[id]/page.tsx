"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar} from "lucide-react"
import Link from "next/link"
import { formatISTDateTime } from "@/lib/utils"
import QRCode from "react-qr-code"
import { ReadBookedItembyId } from "@/lib/items/item"
interface Request{
    itemId: string;
    itemName: any;
    bookedQuantity: number;
    status: string;
    requestedAt: string;
}

export default function ItemRequestDetailPage({
    params,
  }: {
    params: { id: string }
  }) {
    const [request, setRequest] = useState<Request | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
  
    useEffect(() => {
      // Simulate API call
      const fetchRequest = async () => {
        setLoading(true)
        const requestData = await ReadBookedItembyId(params.id);
        if (requestData) {
          setRequest(requestData)
          setError("")
        } else {
          setError("Request not found")
        }
  
        setLoading(false)
      }
  
      fetchRequest()
    }, [params.id])
  
    const getQRCodeData = () => {
      if (!request) return ""
  
      const data = {
        type: "item",
        id: params.id,
        time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      }
  
      return JSON.stringify(data)
    }
  
    if (loading) {
      return (
        <div className="container py-8 px-4 md:px-6 mx-auto">
          <div className="mb-6">
            <Link href="/requests?type=items" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </Link>
          </div>
  
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-3/4 mb-6" />
  
            <div className="grid gap-6">
              <div className="grid gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
  
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      )
    }
  
    if (error || !request) {
      return (
        <div className="container py-8 px-4 md:px-6">
          <div className="mb-6">
            <Link href="/requests?type=items" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </Link>
          </div>
  
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The request you are looking for does not exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/requests?type=items">View All Requests</Link>
            </Button>
          </div>
        </div>
      )
    }
  
    return (
      <div className="container py-8 px-4 md:px-6 mx-auto">
        <div className="mb-6">
          <Link href="/requests?type=items" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Link>
        </div>
  
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Item Request Details</h1>
  
          <div className="grid gap-6">
            <div className="grid gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid gap-2">
                    <h2 className="text-xl font-semibold">{request.itemName}</h2>
                    <p className="text-muted-foreground">Quantity: {request.bookedQuantity}</p>
                  </div>
                </CardContent>
              </Card>
  
              <Card>
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    <div className="flex items-start gap-4">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Requested At</h3>
                        <p className="text-muted-foreground">{formatISTDateTime(new Date(request.requestedAt))}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
  
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <h3 className="font-medium text-center">QR Code</h3>
                  <div className="bg-white p-4 rounded-lg">
                    <QRCode value={getQRCodeData()} size={200} />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Show this QR code to the manager for verification
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  