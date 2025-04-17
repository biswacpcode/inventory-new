import type { InventoryItem } from "@/app/inventory/page"
import { ItemCard } from "./item-card"

interface ItemGridProps {
  items: InventoryItem[]
}

export function ItemGrid({ items }: ItemGridProps) {
  if (items.length === 0) {
    return <p className="text-center py-8">No items match your search</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard key={item.$id} item={item} />
      ))}
    </div>
  )
}
