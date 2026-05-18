"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { Input } from "@/components/ui/input"
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface GooglePlacesAutocompleteProps {
  value?: string
  onChange: (address: string, lat: number, lng: number) => void
  placeholder?: string
  label?: string
  description?: string
  error?: string
}

export function GooglePlacesAutocomplete({
  value = "",
  onChange,
  placeholder = "Enter address",
  label,
  description,
  error
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API
        
        if (!apiKey) {
          console.error("Google API key not found. Please set NEXT_PUBLIC_GOOGLE_API in your environment variables.")
          return
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places"],
          region: "ZA", // Set region to South Africa
          language: "en" // Set language to English
        })

        await loader.load()
        setIsLoaded(true)

        if (inputRef.current && !autocompleteRef.current) {
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ["address"],
            componentRestrictions: { country: "za" }, // Restrict to South Africa
            fields: ["formatted_address", "geometry.location", "address_components"]
          })

          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current?.getPlace()
            if (place && place.geometry && place.geometry.location) {
              const address = place.formatted_address || ""
              const lat = place.geometry.location.lat()
              const lng = place.geometry.location.lng()
              
              setInputValue(address)
              onChange(address, lat, lng)
            }
          })
        }
      } catch (error) {
        console.error("Error loading Google Places API:", error)
        console.error("Please check:")
        console.error("1. Your Google API key is valid")
        console.error("2. Places API is enabled in Google Cloud Console")
        console.error("3. Your domain is authorized in the API key restrictions")
        console.error("4. Billing is enabled for your Google Cloud project")
      }
    }

    initializeAutocomplete()
  }, [onChange])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  if (label) {
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={!isLoaded}
          />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    )
  }

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      disabled={!isLoaded}
    />
  )
}
