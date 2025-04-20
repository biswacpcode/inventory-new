'use client';
import { useEffect, useState, SVGProps, Suspense } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Loading from '../inventory/loading';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { getUser } from '@/lib/action';
import { ApproveBookingRequest, checkSocietyCorrect, ReadBookingItemsByRequestedTo } from '@/lib/items/item';

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  async function checkAuthorization() {
    try {
      const user = await getUser();
      setUser(user);
      if (!user) {
        signIn('google');
      } else {
        const isSociety = true //await checkRole('Society');
        if (!isSociety) {
          alert('You are unauthorized.');
          window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}`;
        } else {
          fetchItems(); // Fetch data if authorized
          handleURLParams(); // Handle query parameters
        }
      }
    } catch (error) {
      console.error('Authorization check failed:', error);
    }
  }

  async function fetchItems() {
    try {
      const fetchedItems = await ReadBookingItemsByRequestedTo();
      setItems(fetchedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }

  async function validSociety(requestId: string) {
    const response = await checkSocietyCorrect(requestId);
    if (!response) {
      alert(
        'You are not the authorized society to make this change\nYou have been flagged'
      );
    }
    return response;
  }

  async function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    const approveId = params.get('approveId');
    const rejectId = params.get('rejectId');
    const requestId = approveId || rejectId || 'no params';

    const isValidSociety = await validSociety(requestId);
    if (!isValidSociety) {
      window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}`;
    } else {
      if (approveId) {
        await approveItem(approveId, 'approved');
        window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}/items-requests`;
      }
      if (rejectId) {
        await approveItem(rejectId, 'rejected');
        window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}/items-requests`;
      }
    }
  }

  async function approveItem(requestId: string, statusTo: string) {
    try {
      await ApproveBookingRequest(requestId, statusTo);
      const updatedItems = await ReadBookingItemsByRequestedTo();
      setItems(updatedItems);
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  }

  useEffect(() => {
    checkAuthorization();
  }, []);

  if (loading) {
    return <Loading />;
  }
  return (
    <Suspense fallback={<Loading />}>
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Requests</h1>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Start Date/Time</TableHead>
              <TableHead>End Date/Time</TableHead>
              <TableHead>Requested Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...items].reverse().map((item) => (
              <TableRow key={item.$id} className="border-b border-gray-200 hover:bg-muted">
                <TableCell>{item.itemName}</TableCell>
                <TableCell>{item.start}</TableCell>
                <TableCell>{item.end}</TableCell>
                <TableCell>{item.bookedQuantity}</TableCell>
                <TableCell>
                  <Badge
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'pending'
                        ? 'bg-yellow-200 text-yellow-800'
                        : item.status === 'approved'
                        ? 'bg-green-200 text-green-800'
                        : item.status === 'rejected'
                        ? 'bg-red-200 text-red-800'
                        : item.status === 'issued'
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => approveItem(item.$id, "approved")} title='Approve'>
                    <FilePenIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => approveItem(item.$id, "rejected")} title='Reject'>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </Suspense>
  )
}

function FilePenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}
