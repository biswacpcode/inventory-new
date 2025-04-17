import EmailBlockerForm from "@/components/unblock/email-blocker-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center my-auto p-4 bg-white mb-20">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-black">Email UnBlocker</h1>
        <EmailBlockerForm />
      </div>
    </main>
  )
}
