"use client";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectGroup,
  } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import  {Input}  from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { JSX, SVGProps, useState, useEffect, FormEvent } from "react";
import Loading from "@/app/inventory/loading";
import { Models } from "node-appwrite";
import Modal from "@/components/layout/Modal";
import { ModifyInventoryItem, ReadItemById, UpdateImage } from "@/lib/items/item";
import { fetchUsersByRole } from "@/lib/action";

export default function Component({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [purpose, setPurpose] = useState("");
  const [societies, setSocieties] = useState<Models.Document[]>([]);
  const [councils, setCouncils] = useState<Models.Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);



  useEffect(() => {
    async function checkAuthorization() {
        const isAdmin = true //await checkRole("Admin");
        if (!isAdmin) {
          alert("You are unauthorized.");
           // Redirect if unauthorized
           window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}`;
        } else {
          fetchItem(); // Fetch data if authorized
        }
      }
    async function fetchItem() {
      const fetchedItem = await ReadItemById(params.id);
      setItem(fetchedItem);
        const fetchedSocieties = await fetchUsersByRole("Society");
        const fetchedCouncils = await fetchUsersByRole("Council");
        setCouncils(fetchedCouncils);
        setSocieties(fetchedSocieties);

     
    }

    checkAuthorization();
  }, [params.id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submit clicked");

    // Validate form fields if necessary

    setIsLoading(true);
    const formdata = new FormData(e.currentTarget);
      const changedSociety = formdata.get("society");
      const changedCouncil = formdata.get("council");
      const changedStatus = formdata.get("defaultStatus");
      const parts = (item.itemImage).split('/');
        const fileId = parts[parts.indexOf("files") + 1];
      const imageFile = formdata.get("itemImage") as File;
      const society = (changedSociety)? changedSociety : item.society;
      
      const council = (changedCouncil)?changedCouncil: item.council;
      
      const status = (changedStatus)?changedStatus : item.defaultStatus;
      const itemName = formdata.get("name") !== '' ? formdata.get("name") : item.itemName;
      const description = formdata.get("description") !== '' ? formdata.get("description") : item.description;
      const totalQuantity = formdata.get("total-quantity") !== '' ? parseInt(formdata.get("total-quantity") as string, 10) : item.totalQuantity;
      const availableQuantity = formdata.get("available-quantity") !== '' ? parseInt(formdata.get("available-quantity") as string, 10) : item.availableQuantity;
      const maxQuantity = formdata.get("allowed-quantity") !== '' ? parseInt(formdata.get("allowed-quantity") as string, 10) : item.maxQuantity;
      const maxTime = formdata.get("allowed-time") !== '' ? parseInt(formdata.get("allowed-time") as string, 10) : item.maxTime;
    let itemImage;

    try {
        itemImage = imageFile && imageFile.size > 0 ? await UpdateImage(fileId, formdata) : item.itemImage;
    }catch(error){
        console.error("Error in uploading new image", error);
        throw new Error("Error in uploading new image");
    }
      
        
try{
const isEqualToItemValues = 
    itemName === item.itemName &&
    itemImage === item.itemImage &&
    description === item.description &&
    totalQuantity === item.totalQuantity &&
    availableQuantity === item.availableQuantity &&
    maxQuantity === item.maxQuantity &&
    maxTime === item.maxTime &&
    society === item.society &&
    council === item.council &&
    status === item.defaultStatus;
    if(isEqualToItemValues)
    {
        setModalOpen(true);
    } else{
        const uploadformdata = new FormData();
uploadformdata.append("itemName", itemName);
uploadformdata.append("itemImage", itemImage);
uploadformdata.append("description", description);
uploadformdata.append("total-quantity", totalQuantity);
uploadformdata.append("available-quantity", availableQuantity);
uploadformdata.append("allowed-quantity", maxQuantity);
uploadformdata.append("allowed-time", maxTime);
uploadformdata.append("society", society);
uploadformdata.append("council", council);
uploadformdata.append("defaultStatus", status);


await ModifyInventoryItem(item.$id, uploadformdata);
    }



    
    } catch (error) {
      console.error("Error modifing item:", error);
      // Handle error appropriately (e.g., show a notification)
    } finally {
      setIsLoading(false);
      window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}/inventory-admin/${params.id}`;
    }
  };

  if (!item) return <Loading/>;
  const goToInventory = () => {
    window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}/inventory-admin`; // Redirect to inventory
};
const modalClose= () => {
    setModalOpen(false)
    window.location.href = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_URL!}/inventory-admin/${params.id}`; // Reload
};
  

  return (
    
    <Card className="max-w-2xl mx-auto p-6 sm:p-8 md:p-10">
        <Modal
                isOpen={isModalOpen}
                onClose={modalClose}
                onGoBack={goToInventory}
            />
        
    <CardHeader>
      <CardTitle className="text-3xl font-bold">
        Modify {item.itemName}
        <img
          src={item.itemImage}
          alt="Issue Item"
          width={300}
          height={200}
          className="rounded-lg object-cover w-60 aspect-[3/2]"
        />
      </CardTitle>
      <CardDescription>
        Change the details that are needed to update your inventory.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit} className="grid gap-6" encType="multipart/form-data">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name
            </Label>
            <Input id="name" name="name" placeholder={item.itemName} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image" className="text-sm font-medium">
              Image 
              <span className="text-muted-foreground px-4 text-xs">{item.itemImage.includes("appwrite")?"(Default Image)":"(No Image)"}</span>
            </Label>
            <Input id="image" type="file" name = "itemImage" accept="image/*"/>
            
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description" className="text-sm font-medium" >
            Stock Register Entry
          </Label>
          <Input
            id="description"
            name="description"
            placeholder={item.description}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="total-quantity" className="text-sm font-medium">
              Total Quantity
            </Label>
            <Input
              id="total-quantity"
              name="total-quantity"
              type="number"
              placeholder={item.totalQuantity}
            />
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="available-quantity"
              className="text-sm font-medium"
            >
              Available Quantity
            </Label>
            <Input
              id="available-quantity"
              name="available-quantity"
              type="number"
              placeholder={item.availableQuantity} 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="allowed-quantity" className="text-sm font-medium">
              Maximum Allowed Quantity
            </Label>
            <Input
              id="allowed-quantity"
              name="allowed-quantity"
              type="number"
              placeholder={item.maxQuantity} 
            />
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="allowed-time"
              className="text-sm font-medium"
            >
              Maximum Allowed Time(in days)
            </Label>
            <Input
              id="allowed-time"
              name="allowed-time"
              type="number"
              placeholder={item.maxTime} 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="society" className="text-sm font-medium">
              Society
            </Label>
            <Select name="society">
              <SelectTrigger>
                <SelectValue placeholder={"Change Society"} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Societies</SelectLabel>
                  {
                    societies.map((society) => (
                      <SelectItem key={society.$id} value={society.id}>{society.firstName} {society.lastName}</SelectItem>
                    ))
                  }
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="council" className="text-sm font-medium">
              Council
            </Label>
            <Select name="council">
              <SelectTrigger>
                <SelectValue placeholder="Change council" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Councils</SelectLabel>
                  {
                    councils.map((council) => (
                      <SelectItem key={council.$id} value={council.id}>{council.firstName} {council.lastName}</SelectItem>
                    ))
                  }
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Default Request Status
          </Label>
          <Select name="defaultStatus">
              <SelectTrigger>
                <SelectValue placeholder={item.defaultStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Statuses</SelectLabel>
                  <SelectItem value = "pending">Pending</SelectItem>
                  <SelectItem value = "approved">Approved</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
        </div>
        {
            isLoading ? (
                <Loading/>
            ):(
                <Button>Save Item</Button>
            )
        }
        
      </form>
        

    </CardContent>
    {/* <CardFooter className="flex justify-end">
      
    </CardFooter> */}
  </Card>
  );
}

function BuildingIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
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
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

function PackageIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
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
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function UsersIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
