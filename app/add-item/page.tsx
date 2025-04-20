// components/AddInventory.tsx

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unstable_noStore as noStore } from "next/cache";
import AddInventoryTabs from "./AddInventoryTabs";
import { fetchUsersByRole } from "@/lib/action";

export default async function AddInventory() {
  noStore();
  
  // FETCH USERS BY ROLE
  const societies = await fetchUsersByRole("Society");
  const councils = await fetchUsersByRole("Council");

  return (
    <Card className="max-w-2xl mx-auto p-6 sm:p-8 md:p-10">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">
          Add New Inventory
        </CardTitle>
        <CardDescription>
          Choose to add a new item or a new court to your inventory.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AddInventoryTabs societies={societies} councils={councils} />
      </CardContent>
    </Card>
  );
}
