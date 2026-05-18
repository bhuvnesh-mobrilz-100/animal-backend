"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Copy, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface OperatingHoursTabProps {
  form: any
}

// Default operating hours structure
const DEFAULT_HOURS = {
  monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
  saturday: { isOpen: true, openTime: "09:00", closeTime: "13:00" },
  sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" }
}

const QUICK_PRESETS = {
  "Standard Business": {
    monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    saturday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
    sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" }
  },
  "Retail Hours": {
    monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
    saturday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    sunday: { isOpen: true, openTime: "10:00", closeTime: "16:00" }
  },
  "Veterinary Clinic": {
    monday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
    tuesday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
    wednesday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
    thursday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
    friday: { isOpen: true, openTime: "08:00", closeTime: "18:00" },
    saturday: { isOpen: true, openTime: "08:00", closeTime: "13:00" },
    sunday: { isOpen: false, openTime: "08:00", closeTime: "18:00" }
  },
  "24/7 Emergency": {
    monday: { isOpen: true, openTime: "00:00", closeTime: "23:59" },
    tuesday: { isOpen: true, openTime: "00:00", closeTime: "23:59" },
    wednesday: { isOpen: true, openTime: "00:00", closeTime: "23:59" },
    thursday: { isOpen: true, openTime: "00:00", closeTime: "23:59" },
    friday: { isOpen: true, openTime: "00:00", closeTime: "23:59" },
    saturday: { isOpen: true, openTime: "00:00", closeTime: "23:59" },
    sunday: { isOpen: true, openTime: "00:00", closeTime: "23:59" }
  }
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" }
]

// Generate time options (every 30 minutes)
const generateTimeOptions = () => {
  const times = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      times.push({ value: timeString, label: displayTime })
    }
  }
  return times
}

const TIME_OPTIONS = generateTimeOptions()

export function OperatingHoursTab({ form }: OperatingHoursTabProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  // Get current operating hours or set default
  const currentHours = form.watch("operating_hours") || DEFAULT_HOURS

  const updateOperatingHours = (newHours: any) => {
    form.setValue("operating_hours", newHours)
  }

  const applyPreset = (presetName: string) => {
    if (presetName && QUICK_PRESETS[presetName as keyof typeof QUICK_PRESETS]) {
      updateOperatingHours(QUICK_PRESETS[presetName as keyof typeof QUICK_PRESETS])
      toast.success(`Applied ${presetName} hours`)
    }
  }

  const resetToDefault = () => {
    updateOperatingHours(DEFAULT_HOURS)
    setSelectedPreset("")
    toast.success("Reset to default hours")
  }

  const copyFromDay = (sourceDay: string, targetDay: string) => {
    const sourceHours = currentHours[sourceDay]
    if (sourceHours) {
      const newHours = {
        ...currentHours,
        [targetDay]: { ...sourceHours }
      }
      updateOperatingHours(newHours)
      toast.success(`Copied hours from ${sourceDay} to ${targetDay}`)
    }
  }

  const updateDayHours = (day: string, field: string, value: any) => {
    const newHours = {
      ...currentHours,
      [day]: {
        ...currentHours[day],
        [field]: value
      }
    }
    updateOperatingHours(newHours)
  }

  const toggleAllDays = (isOpen: boolean) => {
    const newHours = { ...currentHours }
    DAYS_OF_WEEK.forEach(day => {
      newHours[day.key] = {
        ...newHours[day.key],
        isOpen
      }
    })
    updateOperatingHours(newHours)
    toast.success(isOpen ? "Opened all days" : "Closed all days")
  }

  return (
    <FormField
      control={form.control}
      name="operating_hours"
      render={() => (
        <FormItem>
          <div className="space-y-6">
            {/* Header and Quick Actions */}
            <div className="flex items-center justify-between">
              <div>
                <FormLabel className="text-lg font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operating Hours
                </FormLabel>
                <FormDescription>
                  Set the business hours for each day of the week
                </FormDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllDays(true)}
                >
                  Open All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllDays(false)}
                >
                  Close All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Quick Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Presets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(QUICK_PRESETS).map((presetName) => (
                    <Button
                      key={presetName}
                      type="button"
                      variant={selectedPreset === presetName ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedPreset(presetName)
                        applyPreset(presetName)
                      }}
                    >
                      {presetName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Days Configuration */}
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const dayHours = currentHours[day.key] || DEFAULT_HOURS[day.key as keyof typeof DEFAULT_HOURS]
                
                return (
                  <Card key={day.key}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-24">
                            <span className="font-medium">{day.label}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={dayHours.isOpen}
                              onCheckedChange={(checked) => updateDayHours(day.key, 'isOpen', checked)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {dayHours.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </div>

                          {dayHours.isOpen && (
                            <div className="flex items-center gap-2">
                              <Select
                                value={dayHours.openTime}
                                onValueChange={(value) => updateDayHours(day.key, 'openTime', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map((time) => (
                                    <SelectItem key={time.value} value={time.value}>
                                      {time.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <span className="text-muted-foreground">to</span>
                              
                              <Select
                                value={dayHours.closeTime}
                                onValueChange={(value) => updateDayHours(day.key, 'closeTime', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map((time) => (
                                    <SelectItem key={time.value} value={time.value}>
                                      {time.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* Copy from other days */}
                        <div className="flex items-center gap-2">
                          <Select
                            value=""
                            onValueChange={(sourceDay) => {
                              if (sourceDay !== day.key) {
                                copyFromDay(sourceDay, day.key)
                              }
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Copy from..." />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.filter(d => d.key !== day.key).map((otherDay) => (
                                <SelectItem key={otherDay.key} value={otherDay.key}>
                                  <div className="flex items-center gap-2">
                                    <Copy className="h-3 w-3" />
                                    {otherDay.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Hours Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hours Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayHours = currentHours[day.key] || DEFAULT_HOURS[day.key as keyof typeof DEFAULT_HOURS]
                    return (
                      <div key={day.key} className="flex justify-between">
                        <span className="font-medium">{day.label}:</span>
                        <span className={dayHours.isOpen ? "text-green-600" : "text-red-600"}>
                          {dayHours.isOpen 
                            ? `${new Date(`2000-01-01T${dayHours.openTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${new Date(`2000-01-01T${dayHours.closeTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                            : 'Closed'
                          }
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
