"use client"

import { useState, useEffect } from "react"
import { CheckBlocked, ReadUserById } from "@/lib/action"
import { useRouter } from "next/navigation"
import ItemDetails from "./item-details"
import BookingForm from "./booking-form"
import ItemSkeleton from "./item-skeleton"
import { ReadItemById } from "@/lib/items/item"

export default function ItemReservationPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null)
  const [societyName, setSocietyName] = useState<string>("")
  const [councilName, setCouncilName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(()=>{
        async function checkBlocked(){
          const isBlocked = await CheckBlocked();
          if (isBlocked)
          {
            alert("Your account has been blocked!!😭\nPlease contact office.sg@iitbbs.ac.in");
            router.push('/');
          }
        }
        checkBlocked();
      }, []);

  useEffect(() => {
    async function fetchItem() {
      try {
        const fetchedItem = await ReadItemById(params.id)
        setItem(fetchedItem)

        if (fetchedItem) {
          const [society, council] = await Promise.all([
            ReadUserById(fetchedItem.society),
            ReadUserById(fetchedItem.council),
          ])

          setSocietyName(society.lastName)
          setCouncilName(council.lastName)
        }
      } catch (error) {
        console.error("Error fetching item details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchItem()
  }, [params.id])

  if (isLoading) return <ItemSkeleton />
  if (!item) return <div className="p-8 text-center">Item not found</div>

  return (
    <div className="grid md:grid-cols-2 gap-8 p-4 md:p-8 lg:p-12">
      <ItemDetails item={item} societyName={societyName} councilName={councilName} />
      <BookingForm item={item} onSuccess={() => router.push('/requests')} />
    </div>
  )
}
