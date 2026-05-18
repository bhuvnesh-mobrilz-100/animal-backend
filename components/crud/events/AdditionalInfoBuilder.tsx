"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AdditionalInfoBuilderProps {
  value?: any
  onChange: (value: any) => void
}

// Predefined options for common fields
const COMMON_INCLUDES = [
  "spay_neuter",
  "vaccinations", 
  "microchip",
  "starter_kit",
  "training_materials",
  "guide_booklet",
  "certificate",
  "vaccination",
  "health_checkup",
  "deworming"
]

const COMMON_REQUIREMENTS = [
  "application",
  "id_document", 
  "proof_of_residence",
  "vaccination_card",
  "pet_leash",
  "bring_dog",
  "bring_cat"
]

const COMMON_BRING_ITEMS = [
  "dog",
  "cat",
  "leash",
  "treats",
  "vaccination_card",
  "id_document",
  "blanket",
  "toys"
]

const COMMON_SERVICES = [
  "vaccination",
  "health_checkup", 
  "deworming",
  "grooming",
  "training",
  "boarding",
  "consultation"
]

interface AdditionalInfoData {
  includes: string[]
  requirements: string[]
  bring: string[]
  services: string[]
  custom_fields: Record<string, string>
  [key: string]: any
}

export function AdditionalInfoBuilder({ value, onChange }: AdditionalInfoBuilderProps) {
  const [data, setData] = useState<AdditionalInfoData>({
    includes: [],
    requirements: [],
    bring: [],
    services: [],
    custom_fields: {},
    ...value
  })

  const [customFieldKey, setCustomFieldKey] = useState("")
  const [customFieldValue, setCustomFieldValue] = useState("")
  const [customInputs, setCustomInputs] = useState({
    includes: "",
    requirements: "",
    bring: "",
    services: ""
  })

  useEffect(() => {
    // Clean up empty arrays and fields before sending to parent
    const cleanData = Object.entries(data).reduce((acc, [key, val]) => {
      if (Array.isArray(val) && val.length > 0) {
        acc[key] = val
      } else if (typeof val === 'string' && val.trim() !== '') {
        acc[key] = val.trim()
      } else if (typeof val === 'object' && val !== null && Object.keys(val).length > 0) {
        acc[key] = val
      }
      return acc
    }, {} as any)

    onChange(Object.keys(cleanData).length > 0 ? cleanData : null)
  }, [data, onChange])

  const handleArrayToggle = (field: string, item: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) 
        ? prev[field].filter((i: string) => i !== item)
        : [...prev[field], item]
    }))
  }

  const handleStringChange = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addCustomField = () => {
    if (customFieldKey.trim() && customFieldValue.trim()) {
      setData(prev => ({
        ...prev,
        custom_fields: {
          ...prev.custom_fields,
          [customFieldKey.trim()]: customFieldValue.trim()
        }
      }))
      setCustomFieldKey("")
      setCustomFieldValue("")
    }
  }

  const removeCustomField = (key: string) => {
    setData(prev => ({
      ...prev,
      custom_fields: Object.fromEntries(
        Object.entries(prev.custom_fields).filter(([k]) => k !== key)
      )
    }))
  }

  const addCustomItem = (field: string) => {
    const customValue = customInputs[field as keyof typeof customInputs].trim()
    if (customValue && !data[field].includes(customValue)) {
      setData(prev => ({
        ...prev,
        [field]: [...prev[field], customValue]
      }))
      setCustomInputs(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const removeCustomItem = (field: string, item: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].filter((i: string) => i !== item)
    }))
  }

  const renderCheckboxSection = (title: string, field: string, options: string[]) => {
    // Separate predefined and custom items
    const predefinedItems = data[field].filter((item: string) => options.includes(item))
    const customItems = data[field].filter((item: string) => !options.includes(item))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Predefined checkboxes */}
          <div className="grid grid-cols-2 gap-2">
            {options.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field}-${option}`}
                  checked={data[field].includes(option)}
                  onCheckedChange={() => handleArrayToggle(field, option)}
                />
                <Label 
                  htmlFor={`${field}-${option}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
              </div>
            ))}
          </div>

          {/* Custom item input */}
          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder={`Add custom ${title.toLowerCase().slice(0, -1)}...`}
              value={customInputs[field as keyof typeof customInputs]}
              onChange={(e) => setCustomInputs(prev => ({
                ...prev,
                [field]: e.target.value
              }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomItem(field)
                }
              }}
            />
            <Button 
              type="button" 
              size="sm" 
              onClick={() => addCustomItem(field)}
              disabled={!customInputs[field as keyof typeof customInputs].trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Display selected items */}
          {data[field].length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Selected:</div>
              <div className="flex flex-wrap gap-1">
                {/* Predefined items */}
                {predefinedItems.map((item: string) => (
                  <Badge key={item} variant="secondary" className="text-xs">
                    {item.replace(/_/g, ' ')}
                  </Badge>
                ))}
                {/* Custom items with remove button */}
                {customItems.map((item: string) => (
                  <Badge key={item} variant="outline" className="text-xs pr-1">
                    {item}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeCustomItem(field, item)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderCheckboxSection("What's Included", "includes", COMMON_INCLUDES)}
        {renderCheckboxSection("Requirements", "requirements", COMMON_REQUIREMENTS)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderCheckboxSection("What to Bring", "bring", COMMON_BRING_ITEMS)}
        {renderCheckboxSection("Services Provided", "services", COMMON_SERVICES)}
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Custom Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Field name"
              value={customFieldKey}
              onChange={(e) => setCustomFieldKey(e.target.value)}
            />
            <Input
              placeholder="Field value"
              value={customFieldValue}
              onChange={(e) => setCustomFieldValue(e.target.value)}
            />
            <Button 
              type="button" 
              size="sm" 
              onClick={addCustomField}
              disabled={!customFieldKey.trim() || !customFieldValue.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {Object.entries(data.custom_fields).length > 0 && (
            <div className="space-y-2">
              {Object.entries(data.custom_fields).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">
                    <strong>{key}:</strong> {value as string}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomField(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
