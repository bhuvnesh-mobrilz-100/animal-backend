"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload, X, Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vendor } from "@/components/vendor/RegisterVendor";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";

interface VendorInfoStepProps {
  vendor: Vendor;
  updateVendor: (updates: Partial<Vendor>) => void;
}

export default function VendorInfoStep({
  vendor,
  updateVendor,
}: VendorInfoStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    if (!value.trim()) {
      return `${name} is required`;
    }

    if (name === "Email" && !/^\S+@\S+\.\S+$/.test(value)) {
      return "Please enter a valid email address";
    }

    if (name === "Phone" && !/^[0-9+\-\s()]{7,15}$/.test(value)) {
      return "Please enter a valid phone number";
    }

    return "";
  };

  const handleInputChange = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field.toLowerCase()]: error,
    }));

    updateVendor({ [field.toLowerCase()]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateVendor({
        image: file,
        imagePreview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    updateVendor({
      image: null,
      imagePreview: null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold">Vendor Information</h2>
      <p className="text-muted-foreground">
        Please provide the basic information about the vendor.
      </p>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Vendor Name</Label>
          <Input
            id="name"
            value={vendor.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter vendor name"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={vendor.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="vendor@example.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={vendor.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="011 3456 789"
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-row gap-4">
            <Label>Vendor Logo</Label>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {vendor.imagePreview ? (
            <div className="relative w-40 h-40 mx-auto">
              <Image
                src={vendor.imagePreview || "/placeholder.svg"}
                alt="Vendor preview"
                fill
                className="object-cover rounded-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-dashed flex flex-col items-center justify-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-muted-foreground">Upload Logo</span>
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button className="flex flex-row text-sm gap-1 items-center  p-2">
                <Info className="h-4 w-4" />
                <span>Guidelines</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <h2 className="font-bold mb-2">Logo Upload Guidelines</h2>
              <p className="text-sm">
                To ensure your logo looks great across all devices and
                backgrounds, please follow these guidelines:
              </p>
              <div className="pl-4">
                <ul className="list-disc">
                  <li>
                    <strong>Recommended size:</strong> <code>1024x1024</code>{" "}
                    pixels
                  </li>
                  <li>
                    <strong>Aspect ratio:</strong> <code>1:1</code> (square)
                  </li>
                  <li>
                    <strong>File format:</strong> PNG with transparent
                    background (preferably)
                  </li>
                  <li>
                    <strong>Maximum file size:</strong> 2MB
                  </li>
                </ul>
              </div>

              <p className="text-xs pt-2">
                ⚠️ Please note: We are not responsible for logos that do not
                follow these guidelines. Uploading logos that don't meet the
                recommendations may result in display issues.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </motion.div>
  );
}
