"use client";

import { useState, useEffect, SVGProps } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Loading from "../inventory/loading";
import { Check, SearchIcon, X } from "lucide-react";
import {Input} from "@/components/ui/input";
import { DeleteInventoryItem,  ReadInventoryItemsAdmin, UpdateInventoryItem } from "@/lib/items/item";
import { DeleteCourtItem, ReadInventoryCourts } from "@/lib/courts/court";

// Define the type for inventory item
interface InventoryItem {
  $id: string;
  itemName: any;
  itemImage: any;
  totalQuantity: any;
  availableQuantity: any;
  damagedQuantity: any;
  description: any;
  society: any;
  council: any;
  societyName: string;
  councilName: string;
  addedBy: any;
  issuedQuantity: number;
  }
  
  // Define a type for the edited item
  interface EditedItem {
    totalQuantity?: number;
    availableQuantity?: number;
    damagedQuantity: number;
  }
  interface Court {
    $id: string;
    courtName: string;
    courtImage: string;
    location: string;
  }
  
  export default function InventoryAdmin() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState<string | null>(null); // Loading state for deletion
    const [editedItems, setEditedItems] = useState<{ [key: string]: EditedItem }>({});
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("items");
    const [courts, setCourts] = useState<Court[]>([]);

    async function checkAuthorization() {
      const isAdmin = true //await checkRole("Admin");
      if (!isAdmin) {
        alert("You are unauthorized.");
         // Redirect if unauthorized
         window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}`;
      } else {
        if (activeTab === "items") {
          fetchItems();
        } else if (activeTab === "courts") {
          fetchCourts();
        }
      }
    }
    async function fetchItems() {
      const fetchedItems = (await ReadInventoryItemsAdmin());
      setItems(fetchedItems ?? []);
    }

    async function fetchCourts() {
          try {
            const inventoryCourts = await ReadInventoryCourts();
            setCourts(inventoryCourts || []);
          } catch (error) {
            console.error("Failed to fetch courts:", error);
          } finally {
            setLoading("");
          }
        }

  


        useEffect(()=>{
  // Fetch the inventory items when the component is mounted
  if (activeTab === "items") {
    fetchItems();
  } else if (activeTab === "courts") {
    fetchCourts();
  }

        }, [activeTab])
  
    // Use Effect hook to fetch inventory items on mount
    // useEffect(() => {
    //   checkAuthorization();
    // }, []);
  
    // Handle deletion of an item
    async function handleDelete(itemId: string) {
      setLoading(itemId); // Set loading for the specific item
      try {
        await DeleteInventoryItem(itemId);
        fetchItems(); // Refetch items after successful deletion
      } catch (error) {
        console.error("Failed to delete the item:", error);
      } finally {
        setLoading(null); // Reset loading state
      }
    }

    async function handleCourtDelete(itemId: string) {
      setLoading(itemId); // Set loading for the specific item
      try {
        await DeleteCourtItem(itemId);
        fetchCourts(); // Refetch items after successful deletion
      } catch (error) {
        console.error("Failed to delete the court:", error);
      } finally {
        setLoading(null); // Reset loading state
      }
    }
  
    // Handle quantity change
    const handleQuantityChange = (itemId: string, field: keyof EditedItem, change: number) => {
      setEditedItems((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [field]: (prev[itemId]?.[field] ?? items.find(item => item.$id === itemId)![field]) + change,
        },
      }));
    };
  
    // Handle saving changes
    async function handleChange(itemId: string) {
      setLoading(itemId); // Set loading for the specific item
      const item = items.find((i) => i.$id === itemId);
    
      if (!item) {
        console.error("Item not found");
        return;
      }
    
      const totalQuantity = editedItems[itemId]?.totalQuantity ?? item.totalQuantity;
      const availableQuantity = editedItems[itemId]?.availableQuantity ?? item.availableQuantity;
      const damagedQuantity = editedItems[itemId]?.damagedQuantity ?? item.damagedQuantity;
    
      try {
        await UpdateInventoryItem(itemId, totalQuantity, availableQuantity, damagedQuantity);
        fetchItems(); // Refetch items after successful update
    
        // After saving, reset the edited item to show the delete button
        setEditedItems((prev) => {
          const newItems = { ...prev };
          delete newItems[itemId]; // Remove the edited state for this item
          return newItems;
        });
      } catch (error) {
        console.error("Failed to update the item:", error);
      } finally {
        setLoading(null); // Reset loading state
      }
    }
  
    // Handle canceling changes
    const handleCancelChanges = (itemId: string) => {
      setEditedItems((prev) => {
        const newItems = { ...prev };
        delete newItems[itemId]; // Remove the key instead of setting it to undefined
        return newItems;
      });
    };
  
    const filteredItems = items.filter((item) =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCourts = courts.filter((court) =>
      court.courtName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Function to download data as CSV
    const handleDownloadCSV = () => {
      const headers = ["Item Name", "Stock Entry","Society", "Council", "Total Quantity", "Available Quantity", "Issued Quantity", "Damaged", ];
      const csvRows = [
        headers.join(","), // Join headers with commas
        ...items.map(item => [
          item.itemName,
          item.description,
          item.societyName,
          item.councilName,
          item.totalQuantity,
          item.availableQuantity,
          item.issuedQuantity,
          item.totalQuantity - item.availableQuantity - item.issuedQuantity, // Damaged quantity
        ].join(",")) // Join each row's data with commas
      ].join("\n"); // Join rows with new lines
    
      const blob = new Blob([csvRows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', 'inventory_data.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    
  
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold mb-6">Inventory Items</h1>
          <Button onClick={handleDownloadCSV}>Download CSV</Button>
        </div>
        <div className="mb-6">
        <div className="relative">
          <Input
            placeholder={`Search ${activeTab}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background shadow-none appearance-none pl-8"
          />
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {/* ------------------------ TABS -------------------- */}
      <div className="mb-6 flex space-x-4">
        <Button
          variant={activeTab === "items" ? "default" : "outline"}
          onClick={() => setActiveTab("items")}
        >
          Items
        </Button>
        <Button
          variant={activeTab === "courts" ? "default" : "outline"}
          onClick={() => setActiveTab("courts")}
        >
          Courts
        </Button>
      </div>

      {/* CARD GRID */}
      {activeTab==="items" && (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Total Quantity</TableHead>
              <TableHead>Available Quantity</TableHead>
              <TableHead>Total Issued</TableHead>
              <TableHead>Damaged</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {filteredItems.length > 0 ? (
            [...filteredItems].reverse().map((item) => (
              <TableRow
                key={item.$id}
                className="border-b border-gray-200 hover:bg-muted"
              >
                <TableCell>
                  <Link href={`/inventory-admin/${item.$id}`}>
                  {item.itemName}
                  </Link>
                  
                    
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Button onClick={() => handleQuantityChange(item.$id, 'totalQuantity', -1)}>-</Button>
                    <span className="mx-2">{editedItems[item.$id]?.totalQuantity ?? item.totalQuantity}</span>
                    <Button onClick={() => handleQuantityChange(item.$id, 'totalQuantity', 1)}>+</Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Button onClick={() => handleQuantityChange(item.$id, 'availableQuantity', -1)}>-</Button>
                    <span className="mx-2">{editedItems[item.$id]?.availableQuantity ?? item.availableQuantity}</span>
                    <Button onClick={() => handleQuantityChange(item.$id, 'availableQuantity', 1)}>+</Button>
                  </div>
                </TableCell>
                <TableCell><div className="flex items-center">
                    <Button onClick={() => handleQuantityChange(item.$id, 'damagedQuantity', -1)}>-</Button>
                    <span className="mx-2">{editedItems[item.$id]?.damagedQuantity ?? item.damagedQuantity}</span>
                    <Button onClick={() => handleQuantityChange(item.$id, 'damagedQuantity', 1)}>+</Button>
                  </div>
                  </TableCell>
                <TableCell>{item.issuedQuantity}</TableCell>
               
                <TableCell className="flex items-center gap-2 w-40 left-5">
                  {loading === item.$id ? (
                    <Loading /> // Placeholder for your loading component
                  ) : (
                    <>
                      {editedItems[item.$id] ? (
                        <>
                          <Button
                            variant="outline"
                            title="Save"
                            size="sm"
                            onClick={()=> handleChange(item.$id)}
                          >
                            <Check/>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleCancelChanges(item.$id)}
                            title="Cancel"
                            size="sm"
                          >
                            <X/>
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(item.$id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No matching items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      )}

{activeTab==="courts" && (
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {filteredCourts.length > 0 ? (
            [...filteredCourts].reverse().map((court) => (
              <TableRow
                key={court.$id}
                className="border-b border-gray-200 hover:bg-muted"
              >
                <TableCell>
                  <Link href={`/court-modify/${court.$id}`}>
                  {court.courtName}
                  </Link>
                  
                    
                </TableCell>
                <TableCell>
                 {court.location}
                  
                    
                </TableCell>
                
               
                <TableCell className="flex items-center gap-2 w-40 left-5">
                  {loading === court.$id ? (
                    <Loading /> // Placeholder for your loading component
                  ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCourtDelete(court.$id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    
             
                </TableCell>
              </TableRow>
            ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No matching items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      )}



        
      </div>
    );
  }

  
  // SVG Trash Icon Component
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
    );
  }