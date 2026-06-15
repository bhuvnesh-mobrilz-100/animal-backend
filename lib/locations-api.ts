import { supabase } from "@/lib/supabase"

export type LocationInput = {
  address: string
  latitude?: string | null
  longitude?: string | null
  show_publicly?: boolean
}

export type LocationRecord = LocationInput & {
  location_id: number
  created_at: string
  updated_at: string | null
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`
  }
  return headers
}

export async function createLocation(input: LocationInput): Promise<LocationRecord> {
  const headers = await getAuthHeaders()
  const res = await fetch("/api/v1/locations", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to create location")
  return data.location
}

export async function updateLocation(locationId: number, input: Partial<LocationInput>): Promise<LocationRecord> {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api/v1/locations?location_id=${locationId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to update location")
  return data.location
}

export async function fetchLocations(search?: string): Promise<LocationRecord[]> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  const res = await fetch(`/api/v1/locations${params.toString() ? `?${params.toString()}` : ""}`, { headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to fetch locations")
  return data.locations
}

export async function deleteLocation(locationId: number): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`/api/v1/locations?location_id=${locationId}`, { method: "DELETE", headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to delete location")
}

export async function upsertLocation(input: LocationInput): Promise<LocationRecord> {
  const { data: existing } = await supabase
    .from('locations')
    .select('*')
    .eq('address', input.address)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('locations')
      .update({
        latitude: input.latitude ?? existing.latitude,
        longitude: input.longitude ?? existing.longitude,
        show_publicly: input.show_publicly ?? existing.show_publicly,
      })
      .eq('location_id', existing.location_id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('locations')
    .insert([input])
    .select()
    .single()

  if (error) throw error
  return data
}
