import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { InventoryItem } from "@/app/inventory/page"
import Image from "next/image"

interface ItemCardProps {
  item: InventoryItem
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <div
      className="bg-background rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-2xl hover:scale-105 border-2 border-white"
      style={{ transition: "all 0.3s ease" }}
    >
      <Image
        src={item.itemImage || "/placeholder.svg"}
        alt={item.itemName}
        width={400}
        height={300}
        className="w-full h-60 object-cover"
        style={{ aspectRatio: "400/300", objectFit: "cover" }}
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{item.itemName}</h3>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-muted-foreground">Total:</span>{" "}
            <span className="font-medium">{item.totalQuantity}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Available:</span>{" "}
            <span className="font-medium">{item.availableQuantity}</span>
          </div>
        </div>
        <Link href={`/inventory/item/${item.$id}`}>
          <Button size="sm" className="mt-4 w-full">
            Reserve
          </Button>
        </Link>
      </div>
    </div>
  )
}
