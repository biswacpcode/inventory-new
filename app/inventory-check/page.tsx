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
import { ReadItemsInSociety } from "@/lib/items/item";

// Define the type for inventory item
interface InventoryItem {
    $id: string;
    itemName: string;
    totalQuantity: number;
    availableQuantity: number;
    issuedQuantity: number;
  }
  
  // Define a type for the edited item
  interface EditedItem {
    totalQuantity?: number;
    availableQuantity?: number;
  }
  
  export default function InventoryAdmin() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState<string | null>(null); // Loading state for deletion
    const [editedItems, setEditedItems] = useState<{ [key: string]: EditedItem }>({});
    const [searchTerm, setSearchTerm] = useState<string>("");

    async function checkAuthorization() {
      const isSociety = true//await checkRole("Society");
      if (!isSociety) {
        alert("You are unauthorized.");
         // Redirect if unauthorized
         window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}`;
      } else {
        fetchItems(); // Fetch data if authorized
      }
    }
  
    // Fetch the inventory items when the component is mounted
    async function fetchItems() {
      const fetchedItems = await ReadItemsInSociety();
      setItems(fetchedItems ?? []);
    }
  
    // Use Effect hook to fetch inventory items on mount
    useEffect(() => {
      checkAuthorization();
    }, []);

    const filteredItems = items.filter((item) =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
  
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Inventory Items</h1>
        <div className="mb-6">
        <div className="relative">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background shadow-none appearance-none pl-8"
          />
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Available Quantity</TableHead>
                <TableHead>Total Issued</TableHead>
                <TableHead>Damaged</TableHead>
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
                      {item.itemName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      
                      <span className="mx-2">{editedItems[item.$id]?.totalQuantity ?? item.totalQuantity}</span>
                      
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      
                      <span className="mx-2">{editedItems[item.$id]?.availableQuantity ?? item.availableQuantity}</span>
                      
                    </div>
                  </TableCell>
                  <TableCell>{item.issuedQuantity}</TableCell>
                  <TableCell>{(item.totalQuantity-item.availableQuantity)-item.issuedQuantity}</TableCell>
                 
                </TableRow>
              ))):(
                <TableRow>
    <TableCell colSpan={5} className="text-center">
      <Loading/>
    </TableCell>
  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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