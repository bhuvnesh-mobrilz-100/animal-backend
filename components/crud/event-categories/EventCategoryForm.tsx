"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/lib/supabase"
import { eventCategorySchema, EventCategory } from "./schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Sketch from '@uiw/react-color-sketch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface EventCategoryFormProps {
  category?: EventCategory
  onSuccess: () => void
  onCancel: () => void
}

export function EventCategoryForm({ category, onSuccess, onCancel }: EventCategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(eventCategorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      icon: category?.icon || "",
      color: category?.color || "#3B82F6",
    },
  })

  const onSubmit = async (values: any) => {
    setIsLoading(true)
    try {
      if (category) {
        // Update existing category
        const { error } = await supabase
          .from("event_categories")
          .update(values)
          .eq("event_category_id", category.event_category_id)

        if (error) throw error
        toast.success("Event category updated successfully")
      } else {
        // Create new category
        const { error } = await supabase
          .from("event_categories")
          .insert([values])

        if (error) throw error
        toast.success("Event category created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving event category:", error)
      toast.error("Failed to save event category")
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} />
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
                  placeholder="Enter category description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <Input placeholder="Enter emoji or icon identifier" {...field} />
              </FormControl>
              <FormDescription>
                Use an emoji (🎉) or icon identifier for this category
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="w-full">
                  <Sketch
                    color={field.value}
                    disableAlpha={false}
                    onChange={(color) => {
                      field.onChange(color.hex)
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Choose a color for this category in the UI
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {category ? "Update" : "Create"} Category
          </Button>
        </div>
      </form>
    </Form>
  )
}
