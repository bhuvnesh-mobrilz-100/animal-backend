"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ServiceProvider } from "@/components/crud/service-providers/schema"
import { ServiceProviderForm } from "@/components/crud/service-providers/ServiceProviderForm"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function EditServiceProviderPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const providerId = params.providerId as string
  
  const [provider, setProvider] = useState<ServiceProvider | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (providerId) {
      fetchProvider()
    }
  }, [providerId])

  const fetchProvider = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          *,
          location:locations(*),
          service_category:service_categories(*)
        `)
        .eq("service_provider_id", providerId)
        .single()

      if (error) throw error
      setProvider(data)
    } catch (error) {
      console.error("Error fetching provider:", error)
      toast.error("Failed to load service provider")
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    // Navigate back to the main service providers page with preserved search params
    const currentParams = searchParams.toString()
    const backUrl = `/dashboard/service-providers${currentParams ? `?${currentParams}` : ''}`
    router.push(backUrl)
    toast.success("Service provider updated successfully")
  }

  const handleCancel = () => {
    // Navigate back to the main service providers page with preserved search params
    const currentParams = searchParams.toString()
    const backUrl = `/dashboard/service-providers${currentParams ? `?${currentParams}` : ''}`
    router.push(backUrl)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Service Provider Not Found</h2>
          <Button onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Service Provider</h1>
          <p className="text-muted-foreground">
            Update {provider.name} details
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <ServiceProviderForm
          provider={provider}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
