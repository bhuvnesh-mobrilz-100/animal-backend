"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Star, Eye, Calendar, ArrowLeft, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { BreederBreedsManager } from "@/components/crud/breeders/BreederBreedsManager"
import { toast } from "sonner";

interface BreederDetail {
  breeder_id: number
  name: string
  image_url?: string
  bio?: string
  rating?: number
  is_verified: boolean
  phone?: string
  views: number
  created_at: string
  address?: string
  latitude?: string
  longitude?: string
  breeds: string
  review_count: number
  avg_rating?: number
}

export default function BreederDetailPage({ params }: { params: { id: string } }) {
  const [breeder, setBreeder] = useState<BreederDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBreeder();
  }, [params.id]);

  const fetchBreeder = async () => {
    try {
      const { data, error } = await supabase
        .from("breeders")
        .select("*")
        .eq("breeder_id", params.id)
        .single();

      if (error) {
        console.error("Error fetching breeder:", error);
        toast.error("Failed to load breeder details");
        router.push("/dashboard/breeders");
        return;
      }

      setBreeder(data);
    } catch (error) {
      console.error("Error fetching breeder:", error);
      toast.error("Failed to load breeder details");
      router.push("/dashboard/breeders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!breeder) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Breeder not found</h1>
          <Button asChild>
            <Link href="/dashboard/breeders">Back to Breeders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayRating = breeder.avg_rating || breeder.rating || 0

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/breeders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Breeders
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
                    src={breeder.image_url || "/placeholder.svg?height=80&width=80"}
                    alt={breeder.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{breeder.name}</CardTitle>
                    {breeder.is_verified && <Badge variant="secondary">Verified Breeder</Badge>}
                  </div>
                  <div className="flex items-center gap-6">
                    {displayRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{displayRating}</span>
                        {breeder.review_count > 0 && (
                          <span className="text-muted-foreground">({breeder.review_count} reviews)</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{breeder.views} views</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {breeder.bio && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground leading-relaxed">{breeder.bio}</p>
                </div>
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
              {breeder.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{breeder.phone}</span>
                </div>
              )}
              {breeder.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{breeder.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Member since {new Date(breeder.created_at).toLocaleDateString()}</span>
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
                <span className="font-medium">{breeder.views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-medium">{breeder.review_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-medium">{displayRating}/5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified</span>
                <span className="font-medium">{breeder.is_verified ? "Yes" : "No"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Breeds Management Section */}
      <div id="breeds" className="mt-8">
        <BreederBreedsManager 
          breederId={breeder.breeder_id} 
          breederName={breeder.name} 
        />
      </div>
    </div>
  )
}
