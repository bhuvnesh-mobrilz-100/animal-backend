"use client"

import { motion } from "framer-motion"
import { Check, MapPin, Mail, Phone, Tag, ImageIcon } from "lucide-react"
import Image from "next/image"

import type { Vendor } from "@/components/vendor/RegisterVendor";
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface SummaryStepProps {
  vendor: Vendor
  updateVendor: (updates: Partial<Vendor>) => void
}

export default function SummaryStep({ vendor }: SummaryStepProps) {
  const fadeInUp = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Your Information</h2>
        <p className="text-muted-foreground">
          Please review the information below before completing your registration.
        </p>
      </div>

      <div className="space-y-8">
        <motion.div className="space-y-4" initial="hidden" animate="visible" custom={0} variants={fadeInUp}>
          <h3 className="text-lg font-semibold">Vendor Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{vendor.name || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{vendor.email || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{vendor.phone || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{vendor.category || "Not selected"}</p>
              </div>
            </div>
          </div>

          {vendor.imagePreview && (
            <div className="flex items-center gap-3 mt-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <ImageIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Vendor Logo</p>
                <div className="mt-2 relative w-20 h-20">
                  <Image
                    src={vendor.imagePreview || "/placeholder.svg"}
                    alt="Vendor"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <Separator />

        <motion.div className="space-y-4" initial="hidden" animate="visible" custom={1} variants={fadeInUp}>
          <h3 className="text-lg font-semibold">System Configuration</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Online System</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={vendor.useOnline ? "default" : "outline"}>
                  {vendor.useOnline ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Number of Locations</p>
              <p className="font-medium mt-1">{vendor.locationCount}</p>
            </div>
          </div>
        </motion.div>

        <Separator />

        <motion.div className="space-y-4" initial="hidden" animate="visible" custom={2} variants={fadeInUp}>
          <h3 className="text-lg font-semibold">Locations</h3>
          <div className="space-y-4">
            {vendor.locations.map((location, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Location {index + 1}</h4>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p>{location.name || "Not provided"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="break-words">{location.address || "Not provided"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
