"use client"

import { Button } from "@/components/ui/button"
import { useMemo } from "react";

interface TabNavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}


export function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {

  const { variant } = useMemo(() => {
    if (typeof window === "undefined") return { variant: "vault" };

    const hostname = window.location.hostname;

    if (hostname.includes("inventory-iitbbs")) {
      return {variant: "inventory"  };
    } else if (hostname.includes("vault")) {
      return { variant: "vault"  };
    } else {
      return {variant: "vault" };
    }
  }, []);
  return (
    <div className="mb-6 flex space-x-4">
      <Button variant={activeTab === "items" ? "default" : "outline"} onClick={() => setActiveTab("items")}>
        Items
      </Button>
      {variant === "vault" && 
      <Button variant={activeTab === "courts" ? "default" : "outline"} onClick={() => setActiveTab("courts")}>
      Courts
    </Button>
      }
      
    </div>
  )
}
