"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ColorPickerProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ value = "#000000", onChange, disabled, className, placeholder = "#000000", ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value)
    const [isOpen, setIsOpen] = React.useState(false)

    // Preset colors
    const presetColors = [
      "#000000", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#F3F4F6",
      "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#22C55E",
      "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1",
      "#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#FFFFFF"
    ]

    const handleColorChange = (newValue: string) => {
      setInternalValue(newValue)
      onChange?.(newValue)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      handleColorChange(newValue)
    }

    const handlePresetClick = (color: string) => {
      handleColorChange(color)
      setIsOpen(false)
    }

    const displayValue = value || internalValue

    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {/* Color Preview */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className="w-10 h-10 p-0 border-2 border-gray-300 hover:border-gray-400"
              style={{ backgroundColor: displayValue }}
              aria-label="Open color picker"
            >
              <span className="sr-only">Color preview</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="start">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Custom Color
                </label>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="color"
                    value={displayValue}
                    onChange={(e) => handleColorChange(e.target.value)}
                    disabled={disabled}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Input
                    value={displayValue}
                    onChange={handleInputChange}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium leading-none">
                  Preset Colors
                </label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handlePresetClick(color)}
                      disabled={disabled}
                      className={cn(
                        "w-8 h-8 rounded border-2 hover:scale-110 transition-transform disabled:cursor-not-allowed disabled:hover:scale-100",
                        displayValue === color 
                          ? "border-gray-900 ring-2 ring-gray-900 ring-offset-1" 
                          : "border-gray-300 hover:border-gray-400"
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    >
                      {color === "#FFFFFF" && (
                        <div className="w-full h-full rounded border border-gray-200" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Text Input */}
        <Input
          ref={ref}
          value={displayValue}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn("font-mono", className)}
          {...props}
        />
      </div>
    )
  }
)

ColorPicker.displayName = "ColorPicker"

export { ColorPicker }