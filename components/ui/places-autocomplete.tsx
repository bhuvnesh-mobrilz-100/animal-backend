"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin } from "lucide-react"
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface PlacesAutocompleteProps {
  value?: string
  onChange: (address: string, lat: number, lng: number) => void
  placeholder?: string
  label?: string
  description?: string
  error?: string
}

declare global {
  interface Window {
    google?: any
  }
}

let googleMapsScriptPromise: Promise<void> | null = null

function loadGoogleMapsScript(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"))
  }

  if (window.google?.maps?.places) {
    return Promise.resolve()
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-places-script")

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.id = "google-maps-places-script"
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Maps script"))
    document.head.appendChild(script)
  })

  return googleMapsScriptPromise
}

export function PlacesAutocomplete({
  value = "",
  onChange,
  placeholder = "Enter address",
  label,
  description,
  error,
}: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API 

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!apiKey) {
      setLoadError("Google Maps API key is not available for the browser.")
      return
    }

    let cancelled = false

    const initializeAutocomplete = async () => {
      setIsLoading(true)

      try {
        await loadGoogleMapsScript(apiKey)

        if (cancelled || !inputRef.current || !window.google?.maps?.places) {
          return
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "address_components", "name"],
        })

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace()

          if (!place?.geometry?.location) {
            return
          }

          const formattedAddress = place.formatted_address || place.name || inputRef.current?.value || ""
          const location = place.geometry.location

          setInputValue(formattedAddress)
          onChangeRef.current(formattedAddress, location.lat(), location.lng())
        })

        setIsReady(true)
        setLoadError("")
      } catch (error) {
        console.error("Google Maps autocomplete load error:", error)
        setLoadError("Unable to load Google Maps suggestions.")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAutocomplete()

    return () => {
      cancelled = true
    }
  }, [apiKey])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    setInputValue(nextValue)

    if (!nextValue) {
      onChangeRef.current("", 0, 0)
    }
  }

  const inputField = (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pr-10"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <MapPin className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      {loadError && <p className="mt-2 text-sm text-destructive">{loadError}</p>}
      {isReady && !loadError && <p className="mt-2 text-sm text-muted-foreground">Search for a city, hotel, landmark, or address from Google Maps.</p>}
    </div>
  )

  if (label) {
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>{inputField}</FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    )
  }

  return inputField
}