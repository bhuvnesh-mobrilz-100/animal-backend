"use client"
import { motion } from "framer-motion"
import { MapPin, Building, Plus, Trash } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Vendor,Location } from "@/components/vendor/RegisterVendor";

interface LocationsStepProps {
  vendor: Vendor
  updateVendor: (updates: Partial<Vendor>) => void
}

export default function LocationsStep({ vendor, updateVendor }: LocationsStepProps) {
  const handleLocationChange = (index: number, updates: Partial<Location>) => {
    const updatedLocations = [...vendor.locations]
    updatedLocations[index] = { ...updatedLocations[index], ...updates }
    updateVendor({ locations: updatedLocations })
  }

  const handleAddLocation = () => {
    if (vendor.locations.length < 10) {
      const updatedLocations = [...vendor.locations, { name: "", address: "", coordinates: null }]
      updateVendor({
        locations: updatedLocations,
        locationCount: updatedLocations.length,
      })
    }
  }

  const handleRemoveLocation = (index: number) => {
    if (vendor.locations.length > 1) {
      const updatedLocations = vendor.locations.filter((_, i) => i !== index)
      updateVendor({
        locations: updatedLocations,
        locationCount: updatedLocations.length,
      })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <h2 className="text-2xl font-bold">Location Details</h2>
      <p className="text-muted-foreground">
        {vendor.locationCount === 1
          ? "Enter the details for your location."
          : `Enter the details for your ${vendor.locationCount} locations.`}
      </p>

      <div className="space-y-4">
        {vendor.locations.map((location, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Location {index + 1}</h3>
                </div>
                {vendor.locations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLocation(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`location-name-${index}`}>Location Name</Label>
                  <Input
                    id={`location-name-${index}`}
                    value={location.name}
                    onChange={(e) => handleLocationChange(index, { name: e.target.value })}
                    placeholder="e.g., Headquarters, Downtown Branch"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`location-address-${index}`}>Address</Label>
                  <Input
                    id={`location-address-${index}`}
                    value={location.address}
                    onChange={(e) =>
                      handleLocationChange(index, {
                        address: e.target.value,
                        // Set dummy coordinates when address is entered
                        coordinates: e.target.value ? { lat: 40.7128, lng: -74.006 } : null,
                      })
                    }
                    placeholder="Enter full address"
                  />
                </div>

                {location.address && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Address saved</span>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {vendor.locations.length < 10 && (
          <Button
            variant="outline"
            className="w-full flex items-center gap-2 border-dashed"
            onClick={handleAddLocation}
          >
            <Plus className="h-4 w-4" />
            Add Another Location
          </Button>
        )}
      </div>
    </motion.div>
  )
}
