"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { formatDateTime, formatISTDateTime } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  DeleteCourtBookingRequest,
  ReadAllCourtRequests,
  ReadCourtRequestsByRequestedBy,
  updateCourtRequestStatus,
} from "@/lib/courts/court";
import { useRouter } from "next/navigation";

type CourtRequest = {
  $id: string;
  courtId: any;
  courtName: any;
  startDateTime: any;
  endDateTime: any;
  status: "reserved" | "punched-in" | "late";
};

interface CourtsRequestsTableProps {
  isLoading: boolean;
  searchQuery: string;
  action: (fn: () => void) => void;
}

export default function CourtsRequestsTable({
  isLoading,
  searchQuery,
  action,
}: CourtsRequestsTableProps) {
  const [requests, setRequests] = useState<CourtRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CourtRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [reservedBookings, setreservedBookings] = useState<CourtRequest[]>([]);

  useEffect(() => {
    // Check if mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await ReadAllCourtRequests();
      setRequests(data);
      setFilteredRequests(data);

      // filter reserved requests on initial load
      setreservedBookings(() =>
        data.filter((booking) => booking.status === "reserved")
      );
    } catch (err) {
      console.error("Error fetching item requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const markLateBookings = async () => {
    try {
      // filter bookings which are 15 minutes late
      const late = reservedBookings.filter(
        (booking) =>
          (new Date().getTime() - new Date(booking.startDateTime).getTime()) /
            60000 >
          15
      );

      if (!late.length) {
        toast({
          title: "No late bookings",
          description: "All bookings are on time.",
        });
        return;
      }

      // marking all late bookings as late simultaneously
      await Promise.all(
        late.map(async (booking) => {
          try {
            await updateCourtRequestStatus(booking.$id, "late");
          } catch (err) {
            toast({
              title: "Update Failed",
              description: `Booking for ${booking.courtName} could not be updated as late.`,
              variant: "destructive",
            });
          }
        })
      );

      toast({
        title: "Late bookings are marked successfully",
      });

      await fetchRequests();
    } catch (err) {
      toast({
        title: "Unexpected Error",
        description: "Something went wrong while marking late bookings.",
        variant: "destructive",
      });
    }
  };

  // making btn ready to mark late by assigning fn to parent component state
  useEffect(() => {
    if (reservedBookings.length) action(markLateBookings);
  }, [reservedBookings]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(
        requests.filter((req) =>
          req.courtName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, requests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reserved":
        return "bg-green-500";
      case "punched-in":
        return "bg-blue-500";
      case "late":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

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
      );
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          No court requests found.
        </p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.$id}>
            <CardHeader className="pb-2">
              <CardTitle>
                <Link
                  href={`/manager-list/court/${request.$id}`}
                  className="hover:underline"
                >
                  {request.courtName}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Start:</span>
                  <span className="text-sm">
                    {formatDateTime(request.startDateTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">End:</span>
                  <span className="text-sm">
                    {formatDateTime(request.endDateTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map((request) => (
            <TableRow key={request.$id}>
              <TableCell>
                <Link
                  href={`/manager-list/court/${request.$id}`}
                  className="hover:underline"
                >
                  {request.courtName}
                </Link>
              </TableCell>
              <TableCell>
                {formatISTDateTime(new Date(request.startDateTime))}
              </TableCell>
              <TableCell>
                {formatISTDateTime(new Date(request.endDateTime))}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.charAt(0).toUpperCase() +
                    request.status.slice(1)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
