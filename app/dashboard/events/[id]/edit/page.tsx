"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Event } from "@/components/crud/events/schema"
import { EventForm } from "@/components/crud/events/EventForm"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface EditEventPageProps {
  params: {
    id: string
  }
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
  }, [params.id])

  const fetchEvent = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          service_provider:service_providers(
            name,
            service_provider_id
          ),
          event_category:event_categories(
            name,
            event_category_id,
            icon,
            color
          )
        `)
        .eq("event_id", params.id)
        .single()

      if (error) throw error
      setEvent(data)
    } catch (error) {
      console.error("Error fetching event:", error)
      toast.error("Failed to load event")
      router.push("/dashboard/events")
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    toast.success("Event updated successfully")
    router.push("/dashboard/events")
  }

  const handleCancel = () => {
    router.push("/dashboard/events")
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Button onClick={() => router.push("/dashboard/events")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </div>
      </div>
    )
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
        <h1 className="text-3xl font-bold">Edit Event</h1>
        <p className="text-muted-foreground">
          Update the details for "{event.title}"
        </p>
      </div>

      <div className="max-w-4xl">
        <EventForm
          event={event}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
