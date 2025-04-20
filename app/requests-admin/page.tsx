"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router"; // Import router for redirection
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReadUserById} from "@/lib/action"; // Import checkRole
import {Input} from "@/components/ui/input"; // Ensure this is the correct import path for your Input component
import Loading from "../inventory/loading";
import { Button } from "@/components/ui/button"; // Import Button
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"; // Import Select components
import { ReadItemBookings } from "@/lib/items/item";

interface Request {
  $id: string;
  itemId: any;
  itemName: any;
  start: any;
  end: any;
  bookedQuantity: any;
  requestedBy: any;
  status: any;
  receivedAt: string;
  returnedAt: string;
  userEmail: string
}

interface User {
  email: string;
}

export default function Component() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Separate state variables for Status and Received At filters
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dateFilter, setDateFilter] = useState<string>("All");

  // Check user role and decide whether to fetch data or redirect
  async function checkAuthorization() {
    const isAdmin = true //await checkRole("Admin");
    if (!isAdmin) {
      alert("You are unauthorized.");
      // Redirect if unauthorized
      window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}`
    } else {
      fetchRequests(); // Fetch data if authorized
    }
  }

  // Fetch all booking requests and related users
  async function fetchRequests() {
    setLoading(true); // Start loading
    const fetchedRequests = await ReadItemBookings(); // Fetch booking items
    setRequests(fetchedRequests);
    // await fetchUsers(fetchedRequests); // Fetch users after fetching requests
    setLoading(false); // Stop loading after fetch is complete
  }

  // // Fetch users based on the booking requests in parallel
  // async function fetchUsers(requests: Request[]) {
  //   const userIds = requests.map((request) => request.requestedBy)

  //   // Fetch users in parallel using Promise.all
  //   const userFetchPromises = userIds.map((userId) => ReadUserById(userId));
  //   const usersArray = await Promise.all(userFetchPromises);

  //   // Create a user map to store the fetched users
  //   const userMap: { [key: string]: User } = {};
  //   usersArray.forEach((user) => {
  //     if (user) userMap[user.$id] = user; // Use user ID as the key
  //   });

  //   setUsers(userMap); // Set the user data in the state
  // }

  // Fetch requests on component mount after checking authorization
  useEffect(() => {
    checkAuthorization(); // Check authorization on component mount
  }, []);

  // Function to determine if a request matches the date filter
  const matchesDateFilter = (requestDate: string): boolean => {
    if (dateFilter === "All") return true;
  
    // Handle "not collected yet"
    if (requestDate === "not collected yet") {
      return false; // Assuming dates that aren't collected don't match any filter
    }
  
    // Convert from string to Date
    const [day, month, yearTime] = requestDate.split("/");
    const [year, time] = yearTime.split(" ");
    const [hour, minute, second] = time.split(":");
  
    const receivedDate = new Date(
      Number(year),
      Number(month) - 1, // JavaScript months are 0-indexed
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  
    const now = new Date();
    const diffInMs = now.getTime() - receivedDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
  
    switch (dateFilter) {
      case "Last 24 Hours":
        return diffInHours <= 24;
      case "Last One Week":
        return diffInHours <= 24 * 7;
      case "Last 30 Days":
        return diffInHours <= 24 * 30;
      case "Last 90 Days":
        return diffInHours <= 24 * 90;
      default:
        return true;
    }
  };
  

  // Filter requests based on search term, status, and date filters
  const filteredRequests = requests
    .filter((request) =>
      request.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((request) => {
      // Filter by Status
      if (statusFilter !== "All") {
        return request.status.toLowerCase() === statusFilter.toLowerCase();
      }
      return true;
    })
    .filter((request) => {
      // Filter by Received At Date
      return matchesDateFilter(request.receivedAt);
    })
    .reverse();

  // Function to download data as CSV
  const handleDownloadCSV = () => {
    const headers = [
      "Email",
      "Item Name",
      "Start Date",
      "End Date",
      "Requested Quantity",
      "Status",
      "Received At",
      "Returned At",
    ];
    const csvRows = [
      headers.join(","), // Join headers with commas
      ...filteredRequests.map((request) => [
        users[request.requestedBy]?.email || "Loading...",
        `"${request.itemName}"`, // Enclose in quotes to handle commas
        request.start,
        request.end,
        request.bookedQuantity,
        request.status,
        request.receivedAt,
        request.returnedAt,
      ].join(",")) // Join each row's data with commas
    ].join("\n"); // Join rows with new lines

    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "booking_requests.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return <Loading />; // Show loading while fetching data
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Download CSV Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Requests</h1>
        <Button onClick={handleDownloadCSV}>Download CSV</Button>
      </div>

      {/* ------------------------ SEARCH BOX & FILTERS -------------------- */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
        {/* Search Box */}
        <Input
          placeholder="Search by item name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-background shadow-none appearance-none pl-8"
        />

        {/* Status Filter Dropdown */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
            <SelectItem value="collected">Collected</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="damaged&returned">Damaged & Returned</SelectItem>
          </SelectContent>
        </Select>

        {/* Received At Date Filter Dropdown */}
        <Select
          value={dateFilter}
          onValueChange={(value) => setDateFilter(value)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Received At</SelectItem>
            <SelectItem value="Last 24 Hours">Last 24 Hours</SelectItem>
            <SelectItem value="Last One Week">Last One Week</SelectItem>
            <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
            <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ------------------------ TABLE -------------------- */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Start Date/Time</TableHead>
              <TableHead>End Date/Time</TableHead>
              <TableHead>Requested Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received At</TableHead>
              <TableHead>Returned At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <TableRow
                  key={request.$id}
                  className="border-b border-gray-200 hover:bg-muted"
                >
                  <TableCell>
                    {request.userEmail || <Loading />}
                  </TableCell>
                  <TableCell>{request.itemName}</TableCell>
                  <TableCell>{request.start}</TableCell>
                  <TableCell>{request.end}</TableCell>
                  <TableCell>{request.bookedQuantity}</TableCell>
                  <TableCell>
                    <Badge
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === "pending"
                          ? "bg-yellow-200 text-yellow-800"
                          : request.status === "approved"
                          ? "bg-green-200 text-green-800"
                          : request.status === "rejected"
                          ? "bg-red-200 text-red-800"
                          : request.status === "issued"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.receivedAt}</TableCell>
                  <TableCell>{request.returnedAt}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No matching items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

