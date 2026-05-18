"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VendorInfoStep from "./steps/vendor-info-step";
import SystemConfigStep from "./steps/system-config-step";
import LocationsStep from "./steps/locations-step";
import SummaryStep from "./steps/summary-step";
import StepIndicator from "./step-indicator";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { ClipLoader } from "react-spinners";
import { validateVendorName } from "@/lib/name-validation";

export type Vendor = {
  name: string;
  email: string;
  phone: string;
  category: string;
  image: File | null;
  imagePreview: string | null;
  locationCount: number;
  useOnline: boolean;
  locations: Location[];
};

export type Location = {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
};

const initialVendorState: Vendor = {
  name: "",
  email: "",
  phone: "",
  category: "",
  image: null,
  imagePreview: null,
  locationCount: 1,
  useOnline: false,
  locations: [
    {
      name: "",
      address: "",
      coordinates: null,
    },
  ],
};

export default function RegisterVendor({ isAdmin }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const [vendor, setVendor] = useState<Vendor>(initialVendorState);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { title: "Vendor Information", component: VendorInfoStep },
    { title: "System Configuration", component: SystemConfigStep },
    { title: "Locations", component: LocationsStep },
    { title: "Summary", component: SummaryStep },
  ];

  const updateVendor = (updates: Partial<Vendor>) => {
    setVendor((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  function generateUniqueFileName(file: File) {
    const extension = file.name.split(".").pop();
    const uniqueName = `${uuidv4()}.${extension}`;
    return uniqueName;
  }

  async function uploadFile(file: File) {
    try {
      const filePath = generateUniqueFileName(file);

      const { error } = await supabase.storage
        .from("animalclickposts")
        .upload(`vendors/${filePath}`, file);

      if (error) {
        setIsLoading(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
      }

      const { data } = supabase.storage
        .from("animalclickposts")
        .getPublicUrl(`vendors/${filePath}`);

      return data.publicUrl;
    } catch (error) {
      setIsLoading(false);
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Check name uniqueness
      const { isUnique, error: validationError } = await validateVendorName(vendor.name);

      if (validationError) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: validationError,
        });
        setIsLoading(false);
        return;
      }

      if (!isUnique) {
        Swal.fire({
          icon: "error",
          title: "Name Already Exists",
          text: "A vendor with this name already exists. Please choose a different name.",
        });
        setIsLoading(false);
        return;
      }

      // Here you would typically send the data to your backend
      var url = null;
      if (vendor.image) {
        url = await uploadFile(vendor.image);
      }

      //add to supabase

      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .insert({
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          vendor_image_url: url,
          view_count: 0,
          average_vendor_rating: 0,
        })
        .select("vendor_id")
        .single();

    var locations: any = vendor.locations.map((x) => {
      return {
        vendor_id: vendorData?.vendor_id,
        name: x.name,
        online_only: false,
        address: x.address,
        latitude: x.coordinates?.lat,
        longitude: x.coordinates?.lng,
      };
    });

    if (vendor.useOnline) {
      locations.push({
        vendor_id: vendorData?.vendor_id,
        name: `${vendor.name}_Online`,
        online_only: true,
      });
    }

      const { data: vendor_locations, error: locationError } = await supabase
        .from("vendor_locations")
        .insert(locations)
        .select();

      Swal.fire({
        icon: "success",
        title: "Vendor Created",
        confirmButtonColor: "#426FB6",
      }).then(() => {
        router.push("/dashboard/vendors");
      });
    } catch (error) {
      console.error("Error creating vendor:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create vendor. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator
        steps={steps.map((step) => step.title)}
        currentStep={currentStep}
      />

      <Card className="mt-8">
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                vendor={vendor}
                updateVendor={updateVendor}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button disabled={isLoading} onClick={handleSubmit}>
                {!isLoading && (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Registration
                  </>
                )}
                {isLoading && <ClipLoader />}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
