'use client'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, PackageIcon } from "lucide-react";
import AuthButton from "./auth-button";
import UserMenu from "./user-menu";
import { useEffect, useMemo, useState } from "react";  // Import useState
import { ModeToggle } from "./ModeToggle";
import Image from "next/image";
import { CheckBlocked, checkExistence, GetRole } from "@/lib/action";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);  // State to control the sheet
  const [role, setRole] = useState<string>("");
  const router = useRouter();

  // Function to close the sheet
  const closeSheet = () => setIsOpen(false);

  const { brandName, logo } = useMemo(() => {
    if (typeof window === "undefined") return { brandName: "Vault IITBBS", logo: "/iitlogo.png" };

    const hostname = window.location.hostname;

    if (hostname.includes("inventory-iitbbs")) {
      return { brandName: "Inventory Gymkhana", logo: "/gymkhana.png" };
    } else if (hostname.includes("vault")) {
      return { brandName: "Vault IITBBS", logo: "/iitlogo.png" };
    } else {
      return { brandName: "Vault IITBBS", logo: "/iitlogo.png" };
    }
  }, []);

  useEffect(()=>{
    async function getRole(){
      if(session){
        const response = await checkExistence(session?.user?.email!);
        if (response){
          const role = await GetRole();
          setRole(role);
        }
      }
       
    }
    getRole();
  }, [role, session]);

  useEffect(()=>{
    async function checkBlocked(){
      const isBlocked = await CheckBlocked(session?.user?.email!);
      if (isBlocked)
      {
        alert("Your account has been blocked!!😭\nPlease contact office.sg@iitbbs.ac.in");
        router.push('/');
      }
    }
    checkBlocked();
  }, []);

  const inventory = useMemo(() => {
    switch (role) {
      case "Society":
        return "/inventory-check";
      case "Manager":
        return "/manager-list";
      case "Admin":
        return "/inventory-admin";
      default:
        return "/inventory";
    }
  }, [role]);

  const link = useMemo(() => {
    switch (role) {
      case "Society":
        return "/items-requests";
      case "Manager":
        return "/manager-portal";
      case "Admin":
        return "/requests-admin";
      default:
        return "/requests";
    }
  }, [role]);

  return (
    <header className="flex h-16 w-full shrink-0 items-center px-4 md:px-6 sticky top-0 z-10 bg-white dark:bg-gray-950">
      {/* Mobile Navigation Menu */}
      <div className="flex w-full lg:w-0 items-center justify-between">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setIsOpen(true)}>
              {/* <MenuIcon className="h-6 w-6" /> */}
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="max-w-[50dvw]">
            <SheetHeader>
            <SheetTitle>{brandName}</SheetTitle>
            </SheetHeader>
            <Link href="#" className="mr-6 hidden lg:flex" prefetch={false} onClick={closeSheet}>
              {/* <MountainIcon className="h-6 w-6" /> */}
              {/* <div className="text-xl bg-red-300">Acme Inc</div> */}
              <span className="sr-only">Vault IIT BBS</span>
            </Link>
            <div className="grid gap-2 py-6">
              <Link
                href="/"
                className="flex w-full items-center py-2 text-base"
                prefetch={false}
                onClick={closeSheet}
              >
                Home
              </Link>
              <Link
                href={inventory}
                className="flex w-full items-center py-2 text-base"
                prefetch={false}
                onClick={closeSheet}
              >
                 {role === "Manager" ? "All Bookings" : role === "Society" || role === "Admin" ? "Inventory List" : "Reserve"}
              </Link>
              <Link
                href={link}
                className="flex w-full items-center py-2 text-base"
                prefetch={false}
                onClick={closeSheet}
              >
                {role === "Manager" ? "Issue" : role === "Society" ? "Item Requests" : role === "Admin" ? "All Bookings" : "My Bookings"}
              </Link>
              {role === "Admin" && (
  <>
    <Link href="/add-item" className="flex w-full items-center py-2 text-base" prefetch={false} onClick={closeSheet}>
      Add Item
    </Link>
    <Link href="/assign-role" className="flex w-full items-center py-2 text-base" prefetch={false} onClick={closeSheet}>
      Assign Roles
    </Link>
    <Link href="/block" className="flex w-full items-center py-2 text-base" prefetch={false} onClick={closeSheet}>
      Block Users
    </Link>
    <Link href="/block/unblock" className="flex w-full items-center py-2 text-base" prefetch={false} onClick={closeSheet}>
      Unblock Users
    </Link>
  </>
)}

            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-3 lg:hidden">
        {session ? <UserMenu /> : <AuthButton />}
          <ModeToggle />
        </div>
      </div>

      {/* Desktop Navigation Menu */}
      <Link
        href="/"
        className="mr-6 hidden lg:flex items-center justify-center"
        prefetch={false}
      >
        {/* <Image src={logoLight} alt="Vault IIT BBS" width={150}  /> */}

        <Image src={logo} alt="Logo" width={32} height={32} />
        <span className="text-lg font-bold ml-5">{brandName} | Developed by WebnD</span>
        {/* <Vault IIT BBSLogo /> */}
        {/* <Badge className="mx-2 h-8">BETA</Badge> */}
        <span className="sr-only">{brandName} | Developed by WebnD</span>
      </Link>
      <nav className="ml-auto hidden lg:flex gap-3 lg:items-center">
        <Link
          href="/"
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
          Home
        </Link>
        <Link
          href={inventory}
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
           {role === "Manager" ? "All Bookings" : role === "Society" || role === "Admin" ? "Inventory List" : "Reserve"}
        </Link>
        <Link
          href={link}
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
          {role === "Manager" ? "Issue" : role === "Society" ? "Item Requests" : role === "Admin" ? "All Bookings" : "My Bookings"}
        </Link>
        {role === "Admin" && (
  <>
   <Link
          href={'/add-item'}
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
      Add Item
    </Link>
    <Link
          href={'/assign-role'}
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
      Assign Roles
    </Link>
    <Link
          href={'/block'}
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
      Block Users
    </Link>
    <Link
          href={'/block/unblock'}
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        >
      Unblock Users
    </Link>
  </>
)}

        {session ? <UserMenu /> : <AuthButton />}
        <ModeToggle />
      </nav>
      
      
    </header>
    
  );
}
