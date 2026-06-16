"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/providers/AuthProvider"
import { WhatsNew, whatsNewSchema } from "./schema"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { validateWhatsNewTitle } from "@/lib/name-validation"

interface WhatsNewFormProps {
  whatsNew?: WhatsNew
  onSuccess: () => void
  onCancel: () => void
}

export function WhatsNewForm({ whatsNew, onSuccess, onCancel }: WhatsNewFormProps) {
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!whatsNew

  const form = useForm<WhatsNew>({
    resolver: zodResolver(whatsNewSchema),
    defaultValues: whatsNew || {
      title: "",
      description: "",
      image_url: "",
      is_active: true,
    },
  })

  useEffect(() => {
    form.reset(
      whatsNew
        ? {
            title: whatsNew.title,
            description: whatsNew.description || "",
            image_url: whatsNew.image_url || "",
            is_active: whatsNew.is_active ?? true,
            whats_new_id: whatsNew.whats_new_id,
            created_at: whatsNew.created_at,
            updated_at: whatsNew.updated_at,
            created_by: whatsNew.created_by,
          }
        : {
            title: "",
            description: "",
            image_url: "",
            is_active: true,
          }
    )
  }, [whatsNew, form])

  async function onSubmit(data: WhatsNew) {
    setIsLoading(true)
    try {
      const { isUnique, error: validationError } = await validateWhatsNewTitle(
        data.title,
        isEditing ? whatsNew.whats_new_id : undefined
      )

      if (validationError) {
        toast.error(validationError)
        return
      }

      if (!isUnique) {
        form.setError("title", {
          type: "manual",
          message: "A entry with this title already exists"
        })
        return
      }

      const payload = {
        title: data.title,
        description: data.description || null,
        image_url: data.image_url?.trim() || null,
        is_active: data.is_active,
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      if (isEditing) {
        const response = await fetch(`/api/v1/whats-new/${whatsNew.whats_new_id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Failed to update entry")
        toast.success("Entry updated successfully")
      } else {
        const response = await fetch("/api/v1/whats-new", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Failed to create entry")
        toast.success("Entry created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving entry:", error)
      toast.error("Failed to save entry")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
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
                  placeholder="Enter description"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  label="Image"
                  folder="whats-new"
                  placeholder="Upload image or enter URL"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <FormDescription>
                  Show this entry on the public site
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Entry
          </Button>
        </div>
      </form>
    </Form>
  )
}
