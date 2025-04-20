"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, CircleX, QrCode, Scan } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { getISTTime } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ApproveBookingRequest, DeleteBookingRequest, ReadBookedItembyId } from "@/lib/items/item"
import { ReadCourtRequest, updateCourtRequestStatus } from "@/lib/courts/court"
//import { DeleteBookingRequest, ReadBookedItembyId, ReadCourtRequest, updateCourtRequestStatus } from "@/lib/actions"

interface QRData {
  type: "item" | "court"
  id: string
  time: string
}

export default function ManagerPortalPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showRejectedDialog, setShowRejectedDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string }>({
    success: false,
    message: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  // Use a ref instead of state to track the scanner instance
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isScanningRef = useRef(false)

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      stopScannerSafely()
    }
  }, [])

  // Safely stop the scanner
  const stopScannerSafely = () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        scannerRef.current
          .stop()
          .then(() => {
            isScanningRef.current = false
            console.log("Scanner stopped successfully")
          })
          .catch((err) => {
            console.log("Error stopping scanner:", err)
          })
          .finally(() => {
            setScanning(false)
          })
      } catch (error) {
        console.log("Exception when stopping scanner:", error)
        setScanning(false)
        isScanningRef.current = false
      }
    } else {
      setScanning(false)
    }
  }

  const startScanning = () => {
    // If already scanning, don't start again
    if (isScanningRef.current) return

    setScanning(true)

    // Use setTimeout to ensure the DOM element is rendered
    setTimeout(() => {
      const qrReaderElement = document.getElementById("qr-reader")

      if (!qrReaderElement) {
        console.error("QR reader element not found")
        setScanning(false)
        return
      }

      try {
        // Create a new scanner instance
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader")
        }

        const config = { fps: 10, qrbox: { width: 250, height: 250 } }

        scannerRef.current
          .start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              // Mark as not scanning before stopping
              isScanningRef.current = false

              // Stop scanning after successful scan
              if (scannerRef.current) {
                scannerRef.current
                  .stop()
                  .then(() => {
                    setScanning(false)
                    handleQRCodeData(decodedText)
                  })
                  .catch((err) => {
                    console.error("Failed to stop scanner:", err)
                    setScanning(false)
                  })
              } else {
                setScanning(false)
                handleQRCodeData(decodedText)
              }
            },
            (errorMessage) => {
              // Just log errors during scanning, don't stop the scanner
              console.log("QR Scan error:", errorMessage)
            },
          )
          .then(() => {
            // Mark as scanning only after successfully starting
            isScanningRef.current = true
          })
          .catch((err) => {
            console.error(`Unable to start scanning: ${err}`)
            setScanning(false)
          })
      } catch (error) {
        console.error("Error initializing scanner:", error)
        setScanning(false)
      }
    }, 100) // Small delay to ensure DOM is ready
  }

  const stopScanning = () => {
    stopScannerSafely()
  }
  const isWithin10Minutes = (start: string, status: string): boolean => {
    const now = new Date();
    const createdDate = new Date(start);
    const diffCreated = Math.abs(now.getTime() - createdDate.getTime());
    const tenMinutes = 10 * 60 * 1000;

    if(process.env.NEXT_PUBLIC_URL==="https://inventory-iitbbs.webnd-iitbbs.org")
      return true;
  
    return (diffCreated <= tenMinutes || status === "collected") &&
           (status !== "returned" && status !== "damaged&returned");
    
  };

  function isWithin15Minutes(start: string, createdAt: string, status: string): boolean {
    const now = new Date(); // current time in local timezone (IST on your phone/browser)
  
    const createdDate = new Date(createdAt);
    const startDate = new Date(start);
  
    const diffCreated = (now.getTime() - createdDate.getTime());
    const diffStart = (now.getTime() - startDate.getTime());
    const fifteenMinutes = 15 * 60 * 1000; // milliseconds
  
    return (diffCreated <= fifteenMinutes || diffStart <= fifteenMinutes || status === "punched-in") && (status !== "punched-out" && status!=="late");
  }

  const handleQRCodeData = async (data: string) => {
    try {
      const parsedData: QRData = JSON.parse(data)
      setScannedData(parsedData)

      // Check if the scan is valid based on time
      const scanTime = new Date(getISTTime())
      const qrTime = new Date(parsedData.time)

      if (parsedData.type === "court") {
        //Check if scan is 15+ minutes after start time
        const courtInfo = await ReadCourtRequest(parsedData.id);
        const start = courtInfo.start;
        const createdAt = courtInfo.createdAt;
        const status = courtInfo.status;

        const now = new Date();
        const createdDate = new Date(createdAt);
    const startDate = new Date(start);


        if (!isWithin15Minutes(start, createdAt, status)) {
            setScanResult({
                success: false,
                message: "Court check-in rejected. You are more than 15 minutes late.",
              });
              setDialogOpen(true);
              updateCourtRequestStatus(parsedData.id, "late");
        } else if (now.getTime() - startDate.getTime() < 0 || now.getTime() - createdDate.getTime() < 0){
          setScanResult({
            success: false,
            message: "Court check-in rejected. User is trying to Punch in Earlier than Slot alloted.",
          });
          setDialogOpen(true);
        }
        
        else {
            setScanResult({
                success: true,
                message: `Court ${status==="reserved"? 'check in' : 'checkout'} successful! Status updated to ${status==="reserved"? 'punched-in' : 'punched-out'}.`,
              });
              setDialogOpen(true);
              updateCourtRequestStatus(parsedData.id);
        }
      } else if (parsedData.type === "item") {
        // Check if scan is 10+ minutes after request time

        const itemInfo = await ReadBookedItembyId(parsedData.id);
        const start = itemInfo.requestedAt;
        const status = itemInfo.status;

        // Add url based division in logic
        if (!isWithin10Minutes(start, status)) {
          setScanResult({
            success: false,
            message: "Item Recieve Approval Rejected! User is more than 10 minutes late or Item was returned or refused already!",
          });
          setDialogOpen(true);
          await ApproveBookingRequest(parsedData.id, "late");
        } else {
          // Redirect to item detail page
          router.push(`/manager-portal/item/${parsedData.id}`);
        }
      }
      
    } catch (error) {
      console.error("Invalid QR code data:", error)
      setScanResult({
        success: false,
        message: "Invalid QR Code",
      });
      setDialogOpen(true);
    }
  }

  return (
    <div className="container py-8 px-4 md:px-6 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manager Portal</h1>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>QR Code Scanner</CardTitle>
            <CardDescription>Scan QR codes to verify item requests and court reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              {scanning ? (
                <div className="w-full">
                  <div id="qr-reader" className="w-full"></div>
                  <Button variant="outline" className="w-full mt-4" onClick={stopScanning}>
                    Cancel Scanning
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-muted p-6">
                    <QrCode className="h-12 w-12 text-primary" />
                  </div>
                  <Button className="w-full" onClick={startScanning}>
                    <Scan className="mr-2 h-4 w-4" />
                    Scan QR Code
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Result Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[80dvw] rounded-md">
          <DialogHeader>
            <DialogTitle className="text-center">Scan Result</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            {scanResult.success ? (
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            ) : (
              <CircleX className="h-16 w-16 text-red-500 mb-4" />
            )}
            <DialogDescription className="text-center text-base">
              {scanResult.message}
            </DialogDescription>
          </div>
          
          <DialogFooter>
            <Button 
              className="w-full" 
              onClick={() => setDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejected Dialog */}
      <Dialog open={showRejectedDialog} onOpenChange={setShowRejectedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Rejected</DialogTitle>
            <DialogDescription>{rejectionReason}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowRejectedDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
