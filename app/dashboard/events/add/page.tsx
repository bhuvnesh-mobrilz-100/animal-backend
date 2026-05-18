"use client"

import { useRouter } from "next/navigation"
import { EventForm } from "@/components/crud/events/EventForm"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function AddEventPage() {
  const router = useRouter()

  const handleSuccess = () => {
    toast.success("Event created successfully")
    router.push("/dashboard/events")
  }

  const handleCancel = () => {
    router.push("/dashboard/events")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/events")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
        <h1 className="text-3xl font-bold">Add New Event</h1>
        <p className="text-muted-foreground">
          Create a new event with all the necessary details
        </p>
      </div>

      <div className="max-w-4xl">
        <EventForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
