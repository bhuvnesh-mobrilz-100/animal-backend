"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle } from "lucide-react"

interface OperatingHoursDisplayProps {
  operatingHours?: any
  showTitle?: boolean
  compact?: boolean
  className?: string
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" }
]

const formatTime = (timeString: string) => {
  try {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return timeString
  }
}

const getCurrentDayStatus = (operatingHours: any) => {
  if (!operatingHours) return { isOpen: false, message: "Hours not set" }
  
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const dayKey = DAYS_OF_WEEK.find(d => d.label.toLowerCase() === dayName)?.key
  
  if (!dayKey || !operatingHours[dayKey]) {
    return { isOpen: false, message: "Hours not available" }
  }
  
  const todayHours = operatingHours[dayKey]
  if (!todayHours.isOpen) {
    return { isOpen: false, message: "Closed today" }
  }
  
  const now = today.getHours() * 60 + today.getMinutes()
  const [openHour, openMin] = todayHours.openTime.split(':').map(Number)
  const [closeHour, closeMin] = todayHours.closeTime.split(':').map(Number)
  const openTime = openHour * 60 + openMin
  const closeTime = closeHour * 60 + closeMin
  
  if (now >= openTime && now <= closeTime) {
    return { 
      isOpen: true, 
      message: `Open until ${formatTime(todayHours.closeTime)}` 
    }
  } else if (now < openTime) {
    return { 
      isOpen: false, 
      message: `Opens at ${formatTime(todayHours.openTime)}` 
    }
  } else {
    return { 
      isOpen: false, 
      message: `Closed - Opens ${formatTime(todayHours.openTime)}` 
    }
  }
}

export function OperatingHoursDisplay({ 
  operatingHours, 
  showTitle = true, 
  compact = false,
  className = "" 
}: OperatingHoursDisplayProps) {
  if (!operatingHours) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Operating hours not set
      </div>
    )
  }

  const currentStatus = getCurrentDayStatus(operatingHours)

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {currentStatus.isOpen ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <XCircle className="h-3 w-3 text-red-600" />
          )}
          <span className={`text-xs font-medium ${
            currentStatus.isOpen ? 'text-green-600' : 'text-red-600'
          }`}>
            {currentStatus.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {currentStatus.message}
        </span>
      </div>
    )
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Operating Hours
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={currentStatus.isOpen ? "default" : "secondary"}>
              {currentStatus.isOpen ? 'Currently Open' : 'Currently Closed'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentStatus.message}
            </span>
          </div>
        </CardHeader>
      )}
      <CardContent className={showTitle ? "" : "pt-6"}>
        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => {
            const dayHours = operatingHours[day.key]
            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day.label.toLowerCase()
            
            return (
              <div 
                key={day.key} 
                className={`flex justify-between items-center py-1 px-2 rounded ${
                  isToday ? 'bg-muted font-medium' : ''
                }`}
              >
                <span className="text-sm">
                  {day.label}
                  {isToday && <span className="ml-1 text-xs text-primary">(Today)</span>}
                </span>
                <span className={`text-sm ${
                  dayHours?.isOpen ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dayHours?.isOpen 
                    ? `${formatTime(dayHours.openTime)} - ${formatTime(dayHours.closeTime)}`
                    : 'Closed'
                  }
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Utility function to get just the current status
export function getCurrentStatus(operatingHours: any) {
  return getCurrentDayStatus(operatingHours)
}

// Utility function to format hours for a specific day
export function formatDayHours(dayHours: any) {
  if (!dayHours || !dayHours.isOpen) return "Closed"
  return `${formatTime(dayHours.openTime)} - ${formatTime(dayHours.closeTime)}`
}
