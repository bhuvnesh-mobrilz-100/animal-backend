"use client"

import { useParams } from "next/navigation"
import { ServiceProvidersByCategoryCrud } from "@/components/crud/service-providers/ServiceProvidersByCategoryCrud"

export default function ServiceProvidersByCategoryPage() {
  const params = useParams()
  const categoryId = params.categoryId as string

  return (
    <div className="container mx-auto py-6">
      <ServiceProvidersByCategoryCrud categoryId={categoryId} />
    </div>
  )
}
