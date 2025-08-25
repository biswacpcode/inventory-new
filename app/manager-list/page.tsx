"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import ItemsRequestsTable from "@/components/manager-list/items-requests-table";
import CourtsRequestsTable from "@/components/manager-list/courts-requests-table";
import { ReadItemBookingsByRequestedBy } from "@/lib/items/item";

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [checkLateBookings, setcheckLateBookings] = useState<() => void>();

  // Read query param from window.location (runs only on client)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get("type");
      if (typeParam === "courts" || typeParam === "items") {
        setActiveTab(typeParam);
      }
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;
  };

  return (
    <div className="container py-8 px-4 md:px-6 mx-auto">
      <h1 className="text-3xl font-bold mb-6">All History</h1>

      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between">
          <TabsList className="mb-6">
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="courts">Courts</TabsTrigger>
          </TabsList>
          <Button onClick={() => checkLateBookings?.()}>Mark Late</Button>
        </div>
        <form onSubmit={handleSearch} className="relative mb-6">
          <Input
            type="search"
            placeholder={`Search by user email...`}
            className="w-full text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            variant="ghost"
          >
            <Search className="w-4 h-4" />
          </Button>
        </form>

        <TabsContent value="items">
          <ItemsRequestsTable
            isLoading={isSearching}
            searchQuery={searchQuery}
            action={(fn) => setcheckLateBookings(() => fn)}
          />
        </TabsContent>
``
        <TabsContent value="courts">
          <CourtsRequestsTable
            isLoading={isSearching}
            searchQuery={searchQuery}
            action={(fn) => setcheckLateBookings(() => fn)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
