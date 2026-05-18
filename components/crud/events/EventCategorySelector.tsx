"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"

interface EventCategory {
  event_category_id: number
  name: string
  description?: string
  icon?: string
  color?: string
}

interface EventCategorySelectorProps {
  value?: number
  onValueChange: (value: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function EventCategorySelector({
  value,
  onValueChange,
  placeholder = "Select event category...",
  disabled = false,
  className,
}: EventCategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null)

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Load selected category when value changes
  useEffect(() => {
    if (value && categories.length > 0) {
      const category = categories.find(c => c.event_category_id === value)
      setSelectedCategory(category || null)
    } else if (!value) {
      setSelectedCategory(null)
    }
  }, [value, categories])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("event_categories")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error loading event categories:", error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (category: EventCategory) => {
    setSelectedCategory(category)
    onValueChange(category.event_category_id)
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedCategory(null)
    onValueChange(undefined)
    setOpen(false)
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate flex items-center gap-2">
              {selectedCategory ? (
                <>
                  {selectedCategory.icon && (
                    <span className="text-sm">{selectedCategory.icon}</span>
                  )}
                  {selectedCategory.name}
                </>
              ) : (
                placeholder
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandEmpty>
              {loading ? "Loading categories..." : "No categories found"}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {selectedCategory && (
                <CommandItem onSelect={handleClear}>
                  <span className="text-muted-foreground">Clear selection</span>
                </CommandItem>
              )}
              {categories.map((category) => (
                <CommandItem
                  key={category.event_category_id}
                  value={category.name}
                  onSelect={() => handleSelect(category)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.event_category_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {category.icon && (
                      <span className="text-sm">{category.icon}</span>
                    )}
                    <div className="flex flex-col">
                      <span>{category.name}</span>
                      {category.description && (
                        <span className="text-xs text-muted-foreground">
                          {category.description}
                        </span>
                      )}
                    </div>
                    {category.color && (
                      <div
                        className="w-3 h-3 rounded-full border ml-auto"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
