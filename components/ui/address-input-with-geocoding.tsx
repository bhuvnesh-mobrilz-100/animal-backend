"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AddressInputWithGeocodingProps {
  value?: string
  onChange: (address: string, lat: number, lng: number) => void
  placeholder?: string
  label?: string
  description?: string
  error?: string
}

export function AddressInputWithGeocoding({
  value = "",
  onChange,
  placeholder = "Enter address",
  label,
  description,
  error
}: AddressInputWithGeocodingProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    // Update the form field immediately for manual typing
    onChange(e.target.value, 0, 0)
  }

  const geocodeAddress = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter an address")
      return
    }

    setIsGeocoding(true)
    try {
      const response = await fetch(`/api/places?input=${encodeURIComponent(inputValue)}`)
      const data = await response.json()

      if (!response.ok || !data.predictions || data.predictions.length === 0) {
        toast.error(data.error || "Could not find coordinates for this address")
        return
      }

      const placeId = data.predictions[0].place_id
      const detailsResponse = await fetch(`/api/places/details?place_id=${placeId}`)
      const detailsData = await detailsResponse.json()

      if (detailsResponse.ok && detailsData.result) {
        const result = detailsData.result
        const location = result.geometry.location
        const formattedAddress = result.formatted_address

        setInputValue(formattedAddress)
        onChange(formattedAddress, location.lat, location.lng)
        toast.success("Address geocoded successfully")
      } else {
        toast.error(detailsData.error || "Could not find coordinates for this address")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      toast.error("Failed to geocode address")
    } finally {
      setIsGeocoding(false)
    }
  }

  if (label) {
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={geocodeAddress}
              disabled={isGeocoding || !inputValue.trim()}
            >
              {isGeocoding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </div>
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    )
  }

  return (
    <div className="flex gap-2">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={geocodeAddress}
        disabled={isGeocoding || !inputValue.trim()}
      >
        {isGeocoding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
