"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
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
import { ServiceProvider } from "./schema"

interface ServiceProviderSelectorProps {
  value?: number
  onValueChange: (value: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ServiceProviderSelector({
  value,
  onValueChange,
  placeholder = "Select service provider...",
  disabled = false,
  className,
}: ServiceProviderSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)

  // Debounce search term
  const debouncedSearchTerm = useMemo(() => {
    const handler = setTimeout(() => {
      return searchTerm
    }, 300)

    return () => clearTimeout(handler)
  }, [searchTerm])

  // Load initial selected provider
  useEffect(() => {
    if (value && !selectedProvider) {
      loadSelectedProvider(value)
    }
  }, [value, selectedProvider])

  // Search providers when search term changes (after debounce)
  useEffect(() => {
    if (searchTerm.length >= 3) {
      searchProviders(searchTerm)
    } else if (searchTerm.length === 0) {
      setProviders([])
    }
  }, [debouncedSearchTerm])

  const loadSelectedProvider = async (providerId: number) => {
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select("service_provider_id, name, service_category_id, is_active")
        .eq("service_provider_id", providerId)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .single()

      if (error) throw error
      if (data) {
        setSelectedProvider(data)
      }
    } catch (error) {
      console.error("Error loading selected provider:", error)
    }
  }

  const searchProviders = async (search: string) => {
    if (search.length < 3) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select("service_provider_id, name, service_category_id, is_active")
        .eq("is_active", true)
        .eq("is_deleted", false)
        .ilike("name", `%${search}%`)
        .order("name", { ascending: true })
        .limit(20)

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error("Error searching providers:", error)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    onValueChange(provider.service_provider_id)
    setOpen(false)
    setSearchTerm("")
  }

  const handleClear = () => {
    setSelectedProvider(null)
    onValueChange(undefined)
    setSearchTerm("")
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
            <span className="truncate">
              {selectedProvider ? selectedProvider.name : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type at least 3 characters to search..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>
              {searchTerm.length < 3 
                ? "Type at least 3 characters to search" 
                : loading 
                ? "Searching..." 
                : "No providers found"}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {selectedProvider && (
                <CommandItem onSelect={handleClear}>
                  <span className="text-muted-foreground">Clear selection</span>
                </CommandItem>
              )}
              {loading && (
                <CommandItem disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching providers...
                </CommandItem>
              )}
              {providers.map((provider) => (
                <CommandItem
                  key={provider.service_provider_id}
                  value={provider.service_provider_id.toString()}
                  onSelect={() => handleSelect(provider)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === provider.service_provider_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{provider.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {provider.service_provider_id}
                    </span>
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
