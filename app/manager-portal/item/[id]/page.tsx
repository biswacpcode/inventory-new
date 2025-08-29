"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Check,
  Loader2,
  Mail,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatISTDateTime } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
//import { ApproveBookingRequest, DamagedQuantityUpdate, receivetimeUpdate, returntimeUpdate } from "@/lib/actions"
import { Badge } from "@/components/ui/badge";
import {
  ApproveBookingRequest,
  DamagedQuantityUpdate,
  ReadBookedItembyId,
  receivetimeUpdate,
  rejectedItemUpdate,
  returntimeUpdate,
} from "@/lib/items/item";
import { ReadUserById } from "@/lib/action";

interface Request {
  itemId: string;
  itemName: any;
  bookedQuantity: number;
  status: string;
  requestedAt: string;
  requestedBy: string;
}

interface User {
  $id: any;
  firstName: any;
  lastName: any;
  role: any;
  email: any;
}
export default function ManagerItemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [user, SetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDamaged, setIsDamaged] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    // Simulate API call
    const fetchRequest = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const requestData = await ReadBookedItembyId(params.id);
      if (requestData) {
        setRequest(requestData);
        const user = await ReadUserById(requestData.requestedBy);
        SetUser(user);
        setError("");
      } else {
        setError("Request not found");
      }

      setLoading(false);
    };

    fetchRequest();
  }, [params.id]);

  const updateItemStatus = async (
    requestId: string,
    newStatus: string,
    itemId: string,
    bookedQuantity: number,
    damaged: boolean
  ) => {
    if (!request) return;

    setIsActionLoading(true);
    try {
      const currentTime = new Date().toISOString();

      let successMessage = "";
      let variant: "default" | "destructive" = "default";

      switch (newStatus) {
        case "collected":
          successMessage = `${request.itemName} has been marked as collected`;
          await receivetimeUpdate(requestId, currentTime);
          break;
        case "rejected":
          successMessage = `${request.itemName} request has been rejected`;
          variant = "destructive";
          // DeleteBookingRequest(requestId, itemId, bookedQuantity);
          await rejectedItemUpdate(itemId, bookedQuantity);
          break;
        case "returned":
          successMessage = `${request.itemName} has been marked as returned${
            damaged ? " and damaged" : ""
          }`;
          await returntimeUpdate(
            requestId,
            itemId,
            currentTime,
            isDamaged ? 0 : bookedQuantity
          );
          break;
        default:
          successMessage = `${request.itemName} status has been updated to ${newStatus}`;
      }
      if (isDamaged) {
        newStatus = "damaged&returned";
        // test case 7
        // bugfix: updating damagedCount only when damaged is chosen as true
        await DamagedQuantityUpdate(itemId, bookedQuantity);
      }

      await ApproveBookingRequest(requestId, newStatus);
      toast({
        title: "Status Updated",
        description: successMessage,
        variant: variant,
        duration: 3000,
      });

      router.push("/manager-portal");
    } catch (error) {
      console.error(`Error updating item status to ${newStatus}:`, error);
      toast({
        title: "Error",
        description: `Failed to update item status. Please try again.`,
        variant: "destructive",
        duration: 3000,
      });
      setIsActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "issued":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "collected":
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
      case "late":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="container py-8 px-4 md:px-6 mx-auto">
        <div className="mb-6">
          <Link
            href="/manager-portal"
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Manager Portal
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-3/4 mb-6" />

          <div className="grid gap-6">
            <div className="grid gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>

            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container py-8 px-4 md:px-6">
        <div className="mb-6">
          <Link
            href="/manager-portal"
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Manager Portal
          </Link>
        </div>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The request you are looking for does not exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/manager-portal">Return to Manager Portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 md:px-6 mx-auto">
      <div className="mb-6">
        <Link
          href="/manager-portal"
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Manager Portal
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Manage Item Request</h1>

        <div className="grid gap-6">
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {request.itemName}
                    </h2>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Quantity: {request.bookedQuantity}
                  </p>
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
                      <p className="text-muted-foreground">
                        {formatISTDateTime(new Date(request.requestedAt))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Issuer Details</h3>
                      <p className="text-muted-foreground">
                        {user?.firstName} {user?.lastName} (
                        {user?.email?.split("@")[0]})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6">
                {request.status === "approved" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        updateItemStatus(
                          params.id,
                          "rejected",
                          request.itemId,
                          request.bookedQuantity,
                          isDamaged
                        )
                      }
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Rejected
                        </>
                      )}
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() =>
                        updateItemStatus(
                          params.id,
                          "collected",
                          request.itemId,
                          request.bookedQuantity,
                          isDamaged
                        )
                      }
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Issue
                        </>
                      )}
                    </Button>
                  </div>
                ) : request.status === "collected" ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="damaged"
                          checked={isDamaged}
                          onCheckedChange={setIsDamaged}
                        />
                        <Label htmlFor="damaged">Mark as Damaged</Label>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() =>
                        updateItemStatus(
                          params.id,
                          "returned",
                          request.itemId,
                          request.bookedQuantity,
                          isDamaged
                        )
                      }
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Mark as Returned
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">
                    No actions available for items with status &quot;
                    {request.status}&quot;
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
