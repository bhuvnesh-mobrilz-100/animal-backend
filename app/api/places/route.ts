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
    const fetchPredictions = async (biasIndia: boolean) => {
      const autocompleteUrl = biasIndia
        ? `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:in&region=in&key=${apiKey}`
        : `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`

      const geocodeUrl = biasIndia
        ? `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&components=country:IN&region=in&key=${apiKey}`
        : `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${apiKey}`

      const [autocompleteResponse, geocodeResponse] = await Promise.all([
        fetch(autocompleteUrl),
        fetch(geocodeUrl),
      ])

      const [autocompleteData, geocodeData] = await Promise.all([
        autocompleteResponse.json(),
        geocodeResponse.json(),
      ])

      const autocompletePredictions = Array.isArray(autocompleteData.predictions)
        ? autocompleteData.predictions
        : []

      const geocodePredictions = Array.isArray(geocodeData.results)
        ? geocodeData.results.map((result: any) => ({
            place_id: result.place_id,
            description: result.formatted_address,
            structured_formatting: {
              main_text: result.formatted_address,
              secondary_text: result.geometry?.location ? `${result.geometry.location.lat}, ${result.geometry.location.lng}` : '',
            },
          }))
        : []

      const mergedPredictions = [...autocompletePredictions, ...geocodePredictions].filter(
        (prediction, index, allPredictions) =>
          index === allPredictions.findIndex((item) => item.place_id === prediction.place_id || item.description === prediction.description)
      )

      return {
        autocompleteData,
        geocodeData,
        mergedPredictions,
      }
    }

    const indiaLookup = await fetchPredictions(true)
    const globalLookup = indiaLookup.mergedPredictions.length > 0 ? indiaLookup : await fetchPredictions(false)

    const { autocompleteData, geocodeData, mergedPredictions } = globalLookup

    if (mergedPredictions.length > 0) {
      return NextResponse.json({
        status: 'OK',
        predictions: mergedPredictions.slice(0, 10),
      })
    }

    return NextResponse.json(
      {
        status: autocompleteData.status || geocodeData.status || 'ZERO_RESULTS',
        predictions: [],
        error: autocompleteData.error_message || geocodeData.error_message || 'No matching locations found',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Places API error:', error)
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
}
