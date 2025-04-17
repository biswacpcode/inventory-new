import ItemReservationPage from "@/components/item-reservation/item-reservation-page"

export default function Page({ params }: { params: { id: string } }) {
  return <ItemReservationPage params={params} />
}
