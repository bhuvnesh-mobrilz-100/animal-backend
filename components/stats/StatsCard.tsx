"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight } from "lucide-react"

export interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  change?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  className?: string
}

export function StatsCard({ title, value, icon, change, subtitle, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{value}</h2>
          {change && (
            <div className="flex items-center">
              <ArrowUpRight className={`w-3.5 h-3.5 ${change.isPositive ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`ml-1 text-xs ${change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {change.isPositive ? '+' : '-'}{Math.abs(change.value)}%
              </span>
            </div>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
