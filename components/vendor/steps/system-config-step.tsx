"use client"

import { motion } from "framer-motion"
import { Globe, MapPin } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import type { Vendor } from "@/components/vendor/RegisterVendor";

interface SystemConfigStepProps {
  vendor: Vendor
  updateVendor: (updates: Partial<Vendor>) => void
}

export default function SystemConfigStep({ vendor, updateVendor }: SystemConfigStepProps) {
  const handleLocationCountChange = (value: number[]) => {
    const count = value[0]
    updateVendor({
      locationCount: count,
      locations: Array(count)
        .fill(0)
        .map((_, index) => {
          // Preserve existing locations if available
          return (
            vendor.locations[index] || {
              name: "",
              address: "",
              coordinates: null,
            }
          )
        }),
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <h2 className="text-2xl font-bold">System Configuration</h2>
      <p className="text-muted-foreground">Configure how you want to use the system.</p>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Online System</Label>
              <p className="text-sm text-muted-foreground">Do you want to use this system online?</p>
            </div>
            <Switch checked={vendor.useOnline} onCheckedChange={(checked) => updateVendor({ useOnline: checked })} />
          </div>

          {vendor.useOnline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-6 pl-6 border-l-2 border-muted"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-5 w-5" />
                <p>Your vendor will be accessible online through our platform.</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base">Number of Locations</Label>
            <p className="text-sm text-muted-foreground mb-6">How many locations does this vendor have?</p>
          </div>

          <div className="px-2">
            <Slider
              value={[vendor.locationCount]}
              min={1}
              max={10}
              step={1}
              onValueChange={handleLocationCountChange}
            />

            <div className="flex justify-between mt-2">
              <span className="text-sm">1</span>
              <span className="text-sm">5</span>
              <span className="text-sm">10</span>
            </div>
          </div>

          <div className="flex items-center justify-center mt-4">
            <div className="bg-muted px-4 py-2 rounded-full flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {vendor.locationCount} location{vendor.locationCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 text-center text-sm text-muted-foreground"
          >
            {vendor.locationCount > 1 ? (
              <p>You'll be able to enter details for each location in the next step.</p>
            ) : (
              <p>You'll be able to enter details for your location in the next step.</p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
