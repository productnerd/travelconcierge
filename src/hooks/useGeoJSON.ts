import { useEffect, useState } from 'react'

export function useGeoJSON() {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}regions.geojson`)
      .then((res) => {
        if (!res.ok) throw new Error('GeoJSON not found')
        return res.json()
      })
      .then((data) => setGeojson(data))
      .catch((err) => {
        console.warn('GeoJSON load failed:', err)
        setGeojson(null)
      })
      .finally(() => setLoading(false))
  }, [])

  return { geojson, loading }
}
