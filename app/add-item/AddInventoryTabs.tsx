// components/AddInventoryTabs.tsx

"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Models } from "node-appwrite";
import { CreateInventoryItem } from "@/lib/items/item";
import { CreateInventoryCourt } from "@/lib/courts/court";

interface User {
  $id: string;
  firstName: string;
  lastName: string;
  id: string; // Assuming there's an 'id' field
}

interface AddInventoryTabsProps {
  societies: Models.Document[];
  councils: Models.Document[];
}

export default function AddInventoryTabs({ societies, councils }: AddInventoryTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("item");

  return (
    <div>
      {/* ------------------------ TABS -------------------- */}
      <div className="mb-6 flex space-x-4">
        <Button
          variant={activeTab === "item" ? "default" : "outline"}
          onClick={() => setActiveTab("item")}
        >
          Add Item
        </Button>
        <Button
          variant={activeTab === "court" ? "default" : "outline"}
          onClick={() => setActiveTab("court")}
        >
          Add Court
        </Button>
      </div>

      {/* ------------------------ FORMS -------------------- */}
      {activeTab === "item" && (
        <form
          action={CreateInventoryItem}
          className="grid gap-6"
          encType="multipart/form-data"
        >
          {/* Name and Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input id="name" name="name" placeholder="Enter item name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image" className="text-sm font-medium">
                Image
              </Label>
              <Input
                id="image"
                type="file"
                name="itemImage"
                accept="image/*"
                
              />
            </div>
          </div>

          {/* Stock Register Entry */}
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Stock Register Entry
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter item Stock Register Entry"
              required
            />
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="total-quantity" className="text-sm font-medium">
                Total Quantity
              </Label>
              <Input
                id="total-quantity"
                name="total-quantity"
                type="number"
                placeholder="Enter total quantity"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="available-quantity" className="text-sm font-medium">
                Available Quantity
              </Label>
              <Input
                id="available-quantity"
                name="available-quantity"
                type="number"
                placeholder="Enter available quantity"
                required
              />
            </div>
          </div>

          {/* Allowed Quantities and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="allowed-quantity" className="text-sm font-medium">
                Maximum Allowed Quantity
              </Label>
              <Input
                id="allowed-quantity"
                name="allowed-quantity"
                type="number"
                placeholder="Enter maximum quantity"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="allowed-time" className="text-sm font-medium">
                Maximum Allowed Time (in days)
              </Label>
              <Input
                id="allowed-time"
                name="allowed-time"
                type="number"
                placeholder="Enter maximum allowed time"
                required
              />
            </div>
          </div>

          {/* Society and Council */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="society" className="text-sm font-medium">
                Society
              </Label>
              <Select name="society" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select society" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Societies</SelectLabel>
                    {societies.map((society) => (
                      <SelectItem key={society.$id} value={society.id}>
                        {society.firstName} {society.lastName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="council" className="text-sm font-medium">
                Council
              </Label>
              <Select name="council" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select council" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Councils</SelectLabel>
                    {councils.map((council) => (
                      <SelectItem key={council.$id} value={council.id}>
                        {council.firstName} {council.lastName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Default Request Status */}
          <div className="grid gap-2">
            <Label htmlFor="defaultStatus" className="text-sm font-medium">
              Default Request Status
            </Label>
            <Select name="defaultStatus" required>
              <SelectTrigger>
                <SelectValue placeholder="Select default status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Statuses</SelectLabel>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button type="submit">Save Item</Button>
        </form>
      )}

      {activeTab === "court" && (
        <form
          action={CreateInventoryCourt}
          className="grid gap-6"
          encType="multipart/form-data"
        >
          {/* Name and Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="court-name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="court-name"
                name="court-name"
                placeholder="Enter court name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="court-image" className="text-sm font-medium">
                Image
              </Label>
              <Input
                id="court-image"
                type="file"
                name="courtImage"
                accept="image/*"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <Label htmlFor="court-location" className="text-sm font-medium">
              Location
            </Label>
            <Input
              id="court-location"
              name="court-location"
              placeholder="Enter court location"
              required
            />
          </div>

          {/* Total Courts and Max Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Type Of Court
            </Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Select Type of Court" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Statuses</SelectLabel>
                  <SelectItem value="Badminton">Badminton</SelectItem>
                  <SelectItem value="Basketball">Basketball</SelectItem>
                  <SelectItem value="Volleyball">Volleyball</SelectItem>
                  <SelectItem value="Table Tennis">Table Tennis</SelectItem>
                  <SelectItem value="Lawn Tennis">Lawn Tennis</SelectItem>
                  <SelectItem value="Football">Football</SelectItem>
                  <SelectItem value="Cricket">Cricket</SelectItem>
                  <SelectItem value="Squash">Squash</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
            <div className="grid gap-2">
              <Label htmlFor="max-time" className="text-sm font-medium">
                Maximum Time for User (in hours)
              </Label>
              <Input
                id="max-time"
                name="max-time"
                type="number"
                placeholder="Enter maximum time"
                required
              />
            </div>
          </div>

          {/* Minimum Users */}
          <div className="grid gap-2">
            <Label htmlFor="min-users" className="text-sm font-medium">
              Minimum Number of Users to Get Access
            </Label>
            <Input
              id="min-users"
              name="min-users"
              type="number"
              placeholder="Enter minimum number of users"
              required
            />
          </div>

          {/* Time Slots */}
          <div className="grid gap-2">
            <Label htmlFor="time-slots" className="text-sm font-medium">
              Time Slots for Every Day
            </Label>
            <Textarea
              id="time-slots"
              name="time-slots"
              placeholder="Enter time slots in format: [Day]:- [Start-End], e.g., Monday:- 05:00-10:00, 17:00-21:00"
              required
            />
            <small className="text-muted-foreground">
              Example: Monday:- 05:00-10:00, 17:00-21:00; Tuesday:- 05:00-10:00, 17:00-21:00
            </small>
          </div>

          {/* Submit Button */}
          <Button type="submit">Save Court</Button>
        </form>
      )}
    </div>
  );
}
