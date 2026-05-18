"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { createPortal } from "react-dom"
import { MapPin, Loader2 } from "lucide-react"
import { useDebounce } from "use-debounce"

interface PlacesAutocompleteProps {
  value?: string
  onChange: (address: string, lat: number, lng: number) => void
  placeholder?: string
  label?: string
  description?: string
  error?: string
}

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export function PlacesAutocomplete({
  value = "",
  onChange,
  placeholder = "Enter address",
  label,
  description,
  error
}: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [debouncedInput] = useDebounce(inputValue, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    if (debouncedInput && debouncedInput.length > 2) {
      fetchPredictions(debouncedInput)
    } else {
      setPredictions([])
      setIsOpen(false)
    }
  }, [debouncedInput])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      updateDropdownPosition()
    }
  }, [isOpen])

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }

  const fetchPredictions = async (input: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/places?input=${encodeURIComponent(input)}`)
      const data = await response.json()
      
      if (response.ok && data.predictions) {
        setPredictions(data.predictions)
        setIsOpen(data.predictions.length > 0)
      } else {
        setPredictions([])
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error fetching predictions:', error)
      setPredictions([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setInputValue(prediction.description)
    setIsOpen(false)
    setPredictions([])
    
    try {
      const response = await fetch(`/api/places/details?place_id=${prediction.place_id}`)
      const data = await response.json()
      
      if (response.ok && data.result) {
        const result = data.result
        const location = result.geometry.location
        const formattedAddress = result.formatted_address
        
        setInputValue(formattedAddress)
        onChange(formattedAddress, location.lat, location.lng)
      }
    } catch (error) {
      console.error('Error fetching place details:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // If user clears the input, reset coordinates
    if (!newValue) {
      onChange("", 0, 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const renderDropdown = () => {
    if (!isOpen || predictions.length === 0) return null

    return createPortal(
      <div
        className="fixed bg-white border border-gray-200 rounded-md shadow-lg p-0 z-[9999] max-h-60 overflow-y-auto"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
        <Command>
          <CommandList>
            <CommandGroup>
              {predictions.map((prediction) => (
                <CommandItem
                  key={prediction.place_id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelectPlace(prediction)
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    handleSelectPlace(prediction)
                  }}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {prediction.structured_formatting.main_text}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {prediction.structured_formatting.secondary_text}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>,
      document.body
    )
  }

  if (label) {
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="pr-10"
              onFocus={() => {
                if (predictions.length > 0) {
                  setIsOpen(true)
                }
              }}
              onBlur={() => {
                // Delay closing to allow for clicks on dropdown items
                setTimeout(() => setIsOpen(false), 150)
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        {error && <FormMessage>{error}</FormMessage>}
        {renderDropdown()}
      </FormItem>
    )
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pr-10"
        onFocus={() => {
          if (predictions.length > 0) {
            setIsOpen(true)
          }
        }}
        onBlur={() => {
          // Delay closing to allow for clicks on dropdown items
          setTimeout(() => setIsOpen(false), 150)
        }}
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <MapPin className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      {renderDropdown()}
    </div>
  )
}
