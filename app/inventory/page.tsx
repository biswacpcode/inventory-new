"use client"

import { useEffect, useState } from "react"
import { ReadCourtByName, ReadInventoryCourts } from "@/lib/courts/court"
import { SearchBar } from "@/components/inventory/search-bar"
import { TabNavigation } from "@/components/inventory/tab-navigation"
import { ItemGrid } from "@/components/inventory/item-grid"
import { CourtGrid } from "@/components/inventory/court-grid"
import { ItemSkeleton } from "@/components/inventory/item-skeleton"
import { CourtSkeleton } from "@/components/inventory/court-skeleton"
import { ReadInventoryItems, ReadItemByName } from "@/lib/items/item"
import { EmptySearchResult } from "@/components/inventory/empty-search-result"
// Define data types
export interface InventoryItem {
  $id: string
  itemName: string
  itemImage: string
  totalQuantity: number
  availableQuantity: number
  description: string
  society: string
  council: string
}

export interface Court {
  $id: string
  courtName: string
  courtImage: string
  location: string
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("items")
  const [isSearching, setIsSearching] = useState(false)
  const [hasPerformedDeepSearch, setHasPerformedDeepSearch] = useState(false)

  // Fetch data based on active tab
  useEffect(() => {
    setLoading(true)
    setHasPerformedDeepSearch(false)

    async function fetchItems() {
      try {
        const inventoryItems = await ReadInventoryItems()
        setItems(inventoryItems || [])
      } catch (error) {
        console.error("Failed to fetch inventory items:", error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchCourts() {
      try {
        const inventoryCourts = await ReadInventoryCourts()
        setCourts(inventoryCourts || [])
      } catch (error) {
        console.error("Failed to fetch courts:", error)
      } finally {
        setLoading(false)
      }
    }

    if (activeTab === "items") {
      fetchItems()
    } else if (activeTab === "courts") {
      fetchCourts()
    }
  }, [activeTab])

  // Filter items/courts based on search term
  const filteredItems = items.filter((item) => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredCourts = courts.filter((court) => court.courtName.toLowerCase().includes(searchTerm.toLowerCase()))

  // Handle deep search in database
  const handleDeepSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setHasPerformedDeepSearch(true)

    try {
      
      if (activeTab === "items") {
        const results = await ReadItemByName(searchTerm)

        setItems(results || [])
      } else if (activeTab === "courts") {
        const results = await ReadCourtByName(searchTerm)

        setCourts(results || [])
      }
    } catch (error) {
      console.error(`Failed to perform deep search for ${activeTab}:`, error)
    } finally {
      setIsSearching(false)
    }
  }

  // Reset search and reload original data
  const handleResetSearch = async () => {
    setSearchTerm("")
    setHasPerformedDeepSearch(false)

    // If we performed a deep search, reload the original data
    if (hasPerformedDeepSearch) {
      setLoading(true)

      try {
        if (activeTab === "items") {
          const inventoryItems = await ReadInventoryItems()
          setItems(inventoryItems || [])
        } else if (activeTab === "courts") {
          const inventoryCourts = await ReadInventoryCourts()
          setCourts(inventoryCourts || [])
        }
      } catch (error) {
        console.error(`Failed to reload original ${activeTab} data:`, error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Search Box */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeTab={activeTab}
        onReset={handleResetSearch}
        onDeepSearch={handleDeepSearch}
        hasPerformedDeepSearch={hasPerformedDeepSearch}
      />

      {/* Tabs */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content */}
      {activeTab === "items" &&
        (loading || isSearching ? (
          <ItemSkeleton count={8} />
        ) : filteredItems.length > 0 ? (
          <ItemGrid items={filteredItems} />
        ) : (
          <EmptySearchResult
            searchTerm={searchTerm}
            hasPerformedDeepSearch={hasPerformedDeepSearch}
            onDeepSearch={handleDeepSearch}
          />
        ))}

      {activeTab === "courts" &&
        (loading || isSearching ? (
          <CourtSkeleton count={8} />
        ) : filteredCourts.length > 0 ? (
          <CourtGrid courts={filteredCourts} />
        ) : (
          <EmptySearchResult
            searchTerm={searchTerm}
            hasPerformedDeepSearch={hasPerformedDeepSearch}
            onDeepSearch={handleDeepSearch}
          />
        ))}
    </div>
  )
}
