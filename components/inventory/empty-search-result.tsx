"use client"

import { Button } from "@/components/ui/button"
import { SearchX, Database, AlertCircle } from "lucide-react"

interface EmptySearchResultProps {
  searchTerm: string
  hasPerformedDeepSearch: boolean
  onDeepSearch: () => void
}

export function EmptySearchResult({ searchTerm, hasPerformedDeepSearch, onDeepSearch }: EmptySearchResultProps) {
  if (!searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No items to display</h3>
        <p className="text-muted-foreground">Try searching for something specific</p>
      </div>
    )
  }

  if (!hasPerformedDeepSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Needs Searching in Databas</h3>
        {/* <p className="text-muted-foreground mb-6">
          We couldn't find "{searchTerm}" in the current list. Would you like to search in the database?
        </p> */}
        <Button onClick={onDeepSearch} className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Deep Search
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No results found</h3>
      <p className="text-muted-foreground mb-2">We couldn't find "{searchTerm}" anywhere in our database.</p>
      <p className="text-muted-foreground">Try checking your spelling or using different keywords.</p>
    </div>
  )
}
