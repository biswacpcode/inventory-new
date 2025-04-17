"use client"

import type { JSX, SVGProps } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { Input } from "../ui/input"

interface SearchBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  activeTab: string
  onReset?: () => void
}

export function SearchBar({ searchTerm, setSearchTerm, activeTab, onReset }: SearchBarProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Input
          placeholder={`Search ${activeTab}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-background shadow-none appearance-none pl-8 pr-10"
        />
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-8 w-8 p-0"
            onClick={onReset}
            title="Reset search and reload original data"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Reset search</span>
          </Button>
        )}
      </div>
    </div>
  )
}

function SearchIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
