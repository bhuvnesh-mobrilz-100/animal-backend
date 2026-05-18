"use client"

import { Service } from "./schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (serviceId: number) => void
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium">{service.name}</h4>
              <Badge variant={service.is_active ? "default" : "secondary"}>
                {service.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {service.description && (
              <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
            )}
            <div className="flex space-x-4 text-sm text-muted-foreground">
              {service.price && <span>Price: ${service.price}</span>}
              {service.duration_minutes && <span>Duration: {service.duration_minutes} min</span>}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(service)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => onDelete(service.service_id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
