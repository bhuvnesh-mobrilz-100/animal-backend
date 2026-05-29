"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { Input } from "@/components/ui/input"
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

declare global {
  interface Window {
    google?: any
  }
}

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
  error,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        const apiKey = process.env.Google_API

        if (!apiKey) {
          console.error("Google API key not found. Please set Google_API in your environment variables.")
          return
        }

        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"],
          language: "en",
        })

        await loader.load()

        if (inputRef.current && !autocompleteRef.current && window.google?.maps?.places) {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            fields: ["formatted_address", "geometry.location", "address_components"],
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

          setIsLoaded(true)
        }
      } catch (error) {
        console.error("Error loading Google Places API:", error)
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

  const input = (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      disabled={!isLoaded}
    />
  )

  if (label) {
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>{input}</FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    )
  }

  return input
}