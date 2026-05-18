import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const input = searchParams.get('input')
  
  if (!input) {
    return NextResponse.json({ error: 'Input parameter is required' }, { status: 400 })
  }

  const apiKey = process.env.Google_API
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:za&key=${apiKey}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK') {
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: data.error_message || 'Places API error' }, { status: 400 })
    }
  } catch (error) {
    console.error('Places API error:', error)
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
}
