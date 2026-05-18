"use client"

import { useSearchParams } from "next/navigation"
import { ServiceProviderWizard } from "@/components/crud/service-providers/ServiceProviderWizard"

export default function AddServiceProviderPage() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get("categoryId")

  return (
    <div className="container mx-auto py-6">
      <ServiceProviderWizard preselectedCategoryId={categoryId || undefined} />
    </div>
  )
}
