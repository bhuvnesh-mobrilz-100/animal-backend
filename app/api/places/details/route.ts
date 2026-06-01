import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const placeId = searchParams.get('place_id')
  
  if (!placeId) {
    return NextResponse.json({ error: 'Place ID parameter is required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry&key=${apiKey}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK') {
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: data.error_message || 'Place details API error' }, { status: 400 })
    }
  } catch (error) {
    console.error('Place details API error:', error)
    return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 })
  }
}
