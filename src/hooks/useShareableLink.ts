import { useEffect } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { supabase } from '@/lib/supabase'

export function useShareableLink() {
  const filters = useFilterStore()
  const shortlist = useShortlistStore()

  // On mount: check URL for shared state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // Restore filter state
    const filtersParam = params.get('filters')
    if (filtersParam) {
      try {
        const decoded = JSON.parse(atob(filtersParam))
        filters.setFilters(decoded)
      } catch {
        console.warn('Failed to decode filter params')
      }
    }

    // Restore shared shortlist
    const listParam = params.get('list')
    if (listParam) {
      supabase
        .from('travel_shortlists')
        .select('*')
        .eq('share_token', listParam)
        .single()
        .then(({ data }) => {
          if (data) {
            shortlist.setAll(data.region_slugs)
            if (data.filter_state) {
              filters.setFilters(data.filter_state as Record<string, unknown>)
            }
          }
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shareFilters = () => {
    const state = {
      selectedMonths: filters.selectedMonths,
      busynessMax: filters.busynessMax,
      tempMin: filters.tempMin,
      tempMax: filters.tempMax,
      sunshineMin: filters.sunshineMin,
      rainfallMax: filters.rainfallMax,
      selectedActivities: filters.selectedActivities,
      selectedLandscapes: filters.selectedLandscapes,
    }
    const encoded = btoa(JSON.stringify(state))
    const url = `${window.location.origin}${window.location.pathname}?filters=${encoded}`
    navigator.clipboard.writeText(url)
    return url
  }

  const shareShortlist = async () => {
    const { data, error } = await supabase
      .from('travel_shortlists')
      .insert({
        region_slugs: shortlist.shortlistedSlugs,
        filter_state: {
          selectedMonths: filters.selectedMonths,
          busynessMax: filters.busynessMax,
          tempMin: filters.tempMin,
          tempMax: filters.tempMax,
          sunshineMin: filters.sunshineMin,
          rainfallMax: filters.rainfallMax,
          selectedActivities: filters.selectedActivities,
          selectedLandscapes: filters.selectedLandscapes,
        },
      })
      .select('share_token')
      .single()

    if (error || !data) {
      console.error('Failed to create shortlist share:', error)
      return null
    }

    const url = `${window.location.origin}${window.location.pathname}?list=${data.share_token}`
    navigator.clipboard.writeText(url)
    return url
  }

  return { shareFilters, shareShortlist }
}
