import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Star, Eye, Calendar, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"


interface PlaceDetail {
  pet_friendly_place_id: number
  name: string
  image_url?: string
  description?: string
  phone?: string
  rating?: number
  views: number
  created_at: string
  address?: string
  latitude?: string
  longitude?: string
  accepted_animals: string
  review_count: number
  avg_rating?: number
}

async function getPlace(id: string): Promise<PlaceDetail | null> {
  const { data, error } = await supabase
    .from("pet_friendly_places")
    .select("*")
    .eq("pet_friendly_place_id", id)
    .single()

  if (error) {
    console.error("Error fetching place:", error)
    return null
  }

  return data
}

export default async function PlaceDetailPage({ params }: { params: { id: string } }) {
  const place = await getPlace(params.id)

  if (!place) {
    notFound()
  }

  const displayRating = place.avg_rating || place.rating || 0

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/pet-friendly-places">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Places
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
                    src={place.image_url || "/placeholder.svg?height=80&width=80"}
                    alt={place.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{place.name}</CardTitle>
                  <div className="flex items-center gap-6">
                    {displayRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{displayRating}</span>
                        {place.review_count > 0 && (
                          <span className="text-muted-foreground">({place.review_count} reviews)</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{place.views} views</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {place.description && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground leading-relaxed">{place.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Accepted Animals</h3>
                <p className="text-muted-foreground">{place.accepted_animals}</p>
              </div>
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
              {place.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{place.phone}</span>
                </div>
              )}
              {place.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{place.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Listed since {new Date(place.created_at).toLocaleDateString()}</span>
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
                <span className="font-medium">{place.views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-medium">{place.review_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-medium">{displayRating}/5.0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
