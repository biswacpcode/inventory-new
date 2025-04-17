'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BookOpen, Calendar, WarehouseIcon as Inventory } from "lucide-react"
import Developers from "./Developers"
import { useMemo } from "react"
import Image from "next/image"

export default function Home() {

    const { siteName, variant , logo} = useMemo(() => {
        if (typeof window === "undefined") return { siteName: "Vault IITBBS Gymkhana", variant: "vault" , logo: '/iitlogo.png'};
    
        const hostname = window.location.hostname;
    
        if (hostname.includes("inventory-iitbbs")) {
          return { siteName: "Inventory Gymkhana", variant: "inventory" , logo: '/gymkhana.png'};
        } else if (hostname.includes("vault")) {
          return { siteName: "Vault IITBBS Gymkhana", variant: "vault" , logo: '/iitlogo.png'};
        } else {
          return { siteName: "Vault IITBBS Gymkhana", variant: "vault" , logo: '/iitlogo.png'};
        }
      }, []);
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section
      className={`relative py-20 ${
        variant === "inventory"
          ? "bg-gradient-to-b from-white to-gray-400 dark:from-gray-950 dark:to-gray-500"
          : "bg-gradient-to-b from-white to-blue-200 dark:from-gray-950 dark:to-gray-500"
      }`}
    >
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="w-full md:w-5/12 flex justify-center md:justify-start">
            
              <img
                src={logo}
                alt="IIT Bhubaneswar Campus"
                className="object-cover"
              />

          </div>

          <div className="w-full md:w-7/12 flex flex-col items-center md:items-start text-center md:text-left">
            <h1
              className={`font-bold tracking-tight text-4xl sm:text-5xl md:text-6xl ${
                variant === "inventory" ? "text-black dark:text-white" : "text-blue-700 dark:text-blue-200"
              }`}
            >
              {siteName}
            </h1>
            <p className="max-w-2xl mt-6 text-lg text-gray-600 dark:text-gray-300">
              {variant === "vault"
                ? "Streamlined inventory management and court reservation system for the people at IIT Bhubaneswar."
                : "Streamlined inventory management and room reservation system for the members of Gymkhana at IIT Bhubaneswar."}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-10">
              <Button asChild size="lg">
                <Link href="/inventory">
                  Browse Inventory <Inventory className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/requests">
                  View Requests <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* How to Use Section */}
      <section
        className={`relative py-20 ${
          variant === "inventory"
            ? "bg-gradient-to-b from-gray-400 to-gray-50 dark:from-gray-500 dark:to-gray-900"
            : "bg-gradient-to-b from-blue-200 to-gray-50 dark:from-blue-500 dark:to-gray-900"
        }`}>
        <div className="container px-4 mx-auto max-w-7xl">
          <h2 className="mb-12 text-3xl font-bold text-center">How to Use</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 text-primary">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">1. Browse Items</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Explore available sports equipment and courts in our inventory.
              </p>
            </div>
            <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 text-primary">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">2. Make Reservation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select your desired items or courts and submit a reservation request.
              </p>
            </div>
            <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 text-primary">
                <ArrowRight className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">3. Collect Items</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Visit the Gymkhana with your QR code to collect items or use courts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developers Section */}

      <Developers/>


      
    </main>
  )
}
