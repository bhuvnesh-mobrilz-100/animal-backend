import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Star, Eye, Calendar, ArrowLeft, Stethoscope } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"


interface VetDetail {
  vet_id: number
  name: string
  image_url?: string
  bio?: string
  rating?: number
  is_verified: boolean
  phone?: string
  emergency_number?: string
  views: number
  created_at: string
  address?: string
  latitude?: string
  longitude?: string
  vet_services: any
  review_count: number
  avg_rating?: number
  total_bookings: number
}

async function getVet(id: string): Promise<VetDetail | null> {
  const { data, error } = await supabase.from("vets").select("*,vet_services(name,description)").eq("vet_id", id).single()

  if (error) {
    console.error("Error fetching vet:", error)
    return null
  }

  return data
}

export default async function VetDetailPage({ params }: { params: { id: string } }) {
  const vet = await getVet(params.id)

  if (!vet) {
    notFound()
  }

  const displayRating = vet.avg_rating || vet.rating || 0
  const services = vet?.vet_services;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/veterinarians">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Veterinarians
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 flex-shrink-0">
                  <Image
                    src={vet.image_url || "/placeholder.svg?height=80&width=80"}
                    alt={vet.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{vet.name}</CardTitle>
                    {vet.is_verified && <Badge variant="secondary">Verified Veterinarian</Badge>}
                  </div>
                  <div className="flex items-center gap-6">
                    {displayRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{displayRating}</span>
                        {vet.review_count > 0 && (
                          <span className="text-muted-foreground">({vet.review_count} reviews)</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{vet.views} views</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {vet.bio && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground leading-relaxed">{vet.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Services Offered
              </CardTitle>
              <CardDescription>Professional veterinary services available at this clinic</CardDescription>
            </CardHeader>
            <CardContent>
              {services?.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {services?.map((service:any, index:any) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium">{service.name.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">General veterinary services available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact & Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vet.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span>{vet.phone}</span>
                    <p className="text-xs text-muted-foreground">Main contact</p>
                  </div>
                </div>
              )}
              {vet.emergency_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-red-500" />
                  <div>
                    <span className="text-red-600 font-medium">{vet.emergency_number}</span>
                    <p className="text-xs text-red-500">Emergency contact</p>
                  </div>
                </div>
              )}
              {vet.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{vet.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Practicing since {new Date(vet.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profile Views</span>
                <span className="font-medium">{vet.views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Bookings</span>
                <span className="font-medium">{vet.total_bookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services Offered</span>
                <span className="font-medium">{services?.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-medium">{vet.review_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-medium">{displayRating}/5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified</span>
                <span className="font-medium">{vet.is_verified ? "Yes" : "No"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Book Appointment CTA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Book Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Consultation
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Contact directly to book your appointment
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
