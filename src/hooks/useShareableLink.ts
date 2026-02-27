import { useEffect, useRef } from 'react'
import { useFilterStore, type FilterState } from '@/store/filterStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { supabase } from '@/lib/supabase'

// Default values — only non-default values are written to URL
const DEFAULTS: Record<string, string> = {
  crowds: '5',
  sort: 'overall',
  color: 'overall',
  preset: 'balanced',
  risky: '1',
}

function stateToParams(s: FilterState): URLSearchParams {
  const p = new URLSearchParams()

  const set = (key: string, val: string) => {
    if (val && val !== DEFAULTS[key]) p.set(key, val)
  }

  // Always write months (default changes per calendar month)
  p.set('months', s.selectedMonths.join(','))
  set('crowds', String(s.busynessMax))
  if (s.tempMin !== null) p.set('tmin', String(s.tempMin))
  if (s.tempMax !== null) p.set('tmax', String(s.tempMax))
  if (s.sunshineMin !== null) p.set('sun', String(s.sunshineMin))
  if (s.rainfallMax !== null) p.set('rain', String(s.rainfallMax))
  if (s.selectedActivities.length) p.set('activities', s.selectedActivities.join(','))
  if (s.selectedLandscapes.length) p.set('landscapes', s.selectedLandscapes.join(','))
  if (s.selectedContinents.length) p.set('continents', s.selectedContinents.join(','))
  set('sort', s.sortBy)
  set('color', s.colorMode)
  set('preset', s.algorithmPreset)
  set('risky', s.hideRisky ? '1' : '0')

  return p
}

function paramsToFilters(p: URLSearchParams): Partial<FilterState> {
  const f: Partial<FilterState> = {}

  const months = p.get('months')
  if (months) f.selectedMonths = months.split(',').map(Number).filter(Boolean)

  const crowds = p.get('crowds')
  if (crowds) f.busynessMax = Number(crowds)

  const tmin = p.get('tmin')
  if (tmin) f.tempMin = Number(tmin)

  const tmax = p.get('tmax')
  if (tmax) f.tempMax = Number(tmax)

  const sun = p.get('sun')
  if (sun) f.sunshineMin = Number(sun)

  const rain = p.get('rain')
  if (rain) f.rainfallMax = Number(rain)

  const activities = p.get('activities')
  if (activities) f.selectedActivities = activities.split(',')

  const landscapes = p.get('landscapes')
  if (landscapes) f.selectedLandscapes = landscapes.split(',')

  const continents = p.get('continents')
  if (continents) f.selectedContinents = continents.split(',')

  const sort = p.get('sort')
  if (sort) f.sortBy = sort as FilterState['sortBy']

  const color = p.get('color')
  if (color) f.colorMode = color as FilterState['colorMode']

  const preset = p.get('preset')
  if (preset) f.algorithmPreset = preset as FilterState['algorithmPreset']

  const risky = p.get('risky')
  if (risky !== null) f.hideRisky = risky !== '0'

  return f
}

// Hydrate filters from URL synchronously before first render via store
const initialParams = new URLSearchParams(window.location.search)
const initialFilters = paramsToFilters(initialParams)
if (Object.keys(initialFilters).length > 0) {
  // Apply URL params to store before any component renders
  useFilterStore.getState().setFilters(initialFilters)
}

// Legacy base64 format — also apply synchronously
const legacyParam = initialParams.get('filters')
if (legacyParam) {
  try {
    const decoded = JSON.parse(atob(legacyParam))
    useFilterStore.getState().setFilters(decoded)
  } catch {
    console.warn('Failed to decode legacy filter params')
  }
}

export function useShareableLink() {
  const filters = useFilterStore()
  const shortlist = useShortlistStore()
  const skipFirst = useRef(true)

  // On mount: handle shared shortlist (async, can't be synchronous)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
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

  // Live sync: filters → URL
  useEffect(() => {
    // Skip the first render (initial mount already has correct URL)
    if (skipFirst.current) {
      skipFirst.current = false
      return
    }

    const state = useFilterStore.getState()
    const params = stateToParams(state)
    const search = params.toString()
    const newUrl = search
      ? `${window.location.pathname}?${search}`
      : window.location.pathname
    window.history.replaceState(null, '', newUrl)
  }, [
    filters.selectedMonths,
    filters.busynessMax,
    filters.tempMin,
    filters.tempMax,
    filters.sunshineMin,
    filters.rainfallMax,
    filters.selectedActivities,
    filters.selectedLandscapes,
    filters.selectedContinents,
    filters.sortBy,
    filters.colorMode,
    filters.algorithmPreset,
    filters.hideRisky,
  ])

  const shareFilters = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    return url
  }

  const shareShortlist = async () => {
    const state = useFilterStore.getState()
    const { data, error } = await supabase
      .from('travel_shortlists')
      .insert({
        region_slugs: shortlist.shortlistedSlugs,
        filter_state: {
          selectedMonths: state.selectedMonths,
          busynessMax: state.busynessMax,
          tempMin: state.tempMin,
          tempMax: state.tempMax,
          sunshineMin: state.sunshineMin,
          rainfallMax: state.rainfallMax,
          selectedActivities: state.selectedActivities,
          selectedLandscapes: state.selectedLandscapes,
          selectedContinents: state.selectedContinents,
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
