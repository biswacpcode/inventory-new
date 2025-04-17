import { Separator } from "@/components/ui/separator"
import { PackageIcon, BuildingIcon, UsersIcon } from "./icons"
import Image from "next/image"

interface ItemDetailsProps {
  item: any
  societyName: string
  councilName: string
}

export default function ItemDetails({ item, societyName, councilName }: ItemDetailsProps) {
  return (
    <div className="grid gap-4">
      <Image
        src={item.itemImage || "/placeholder.svg"}
        alt={item.itemName}
        width={600}
        height={400}
        className="rounded-lg object-cover w-full aspect-[3/2]"
      />
      <div className="grid gap-2">
        <h2 className="text-2xl font-bold">{item.itemName}</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <PackageIcon className="w-5 h-5" />
          <span>Available: {item.availableQuantity}</span>
          <Separator orientation="vertical" className="h-5" />
          <span>Damaged: {item.damagedQuantity || 0}</span>
          <Separator orientation="vertical" className="h-5" />
          <span>Total: {item.totalQuantity}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <PackageIcon className="w-5 h-5" />
          <span>Maximum Amount: {item.maxQuantity}</span>
          <Separator orientation="vertical" className="h-5" />
          <span>Allowed Time to Keep: {item.maxTime} days</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <UsersIcon className="w-5 h-5" />
          <span>Society: {societyName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BuildingIcon className="w-5 h-5" />
          <span>Council: {councilName}</span>
        </div>
      </div>
    </div>
  )
}
