"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { VetService } from "./schema"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

// Schema for the service form
const serviceSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
})

type ServiceFormData = z.infer<typeof serviceSchema>

interface VetServiceFormProps {
  service?: VetService
  vetId: number
  onSuccess: () => void
  onCancel: () => void
}

export function VetServiceForm({ service, vetId, onSuccess, onCancel }: VetServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!service

  // Initialize form with default values or existing service data
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service ? {
      name: service.name,
      description: service.description || "",
    } : {
      name: "",
      description: "",
    },
  })

  async function onSubmit(data: ServiceFormData) {
    setIsLoading(true)
    try {
      if (isEditing) {
        // Update existing service
        const { error } = await supabase
          .from("vet_services")
          .update({
            name: data.name,
            description: data.description,
          })
          .eq("vet_service_id", service.vet_service_id)

        if (error) throw error
        toast.success("Service updated successfully")
      } else {
        // Create new service
        const { error } = await supabase
          .from("vet_services")
          .insert({
            vet_id: vetId,
            name: data.name,
            description: data.description,
          })

        if (error) throw error
        toast.success("Service created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving service:", error)
      toast.error("Failed to save service")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter service name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter service description"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Add"} Service
          </Button>
        </div>
      </form>
    </Form>
  )
}
