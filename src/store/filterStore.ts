import { create } from 'zustand'
import type { AlgorithmPreset } from '@/utils/scoring'

export type ColorMode = 'busyness' | 'weather' | 'bestTime' | 'overall'
export type SortBy = 'overall' | 'bestTime' | 'distance' | 'cost' | 'name'

export interface FilterState {
  selectedMonths: number[]
  busynessMax: number
  tempMin: number | null
  tempMax: number | null
  sunshineMin: number | null
  rainfallMax: number | null
  selectedActivities: string[]
  selectedLandscapes: string[]
  showShortlistOnly: boolean
  hideRisky: boolean
  agentAppliedKeys: string[]
  colorMode: ColorMode
  algorithmPreset: AlgorithmPreset
  sortBy: SortBy
  userLocation: [number, number] | null
}

interface FilterActions {
  setMonths: (months: number[]) => void
  toggleMonth: (month: number) => void
  setBusynessMax: (max: number) => void
  setTempRange: (min: number | null, max: number | null) => void
  setSunshineMin: (min: number | null) => void
  setRainfallMax: (max: number | null) => void
  toggleActivity: (activity: string) => void
  toggleLandscape: (landscape: string) => void
  setShowShortlistOnly: (show: boolean) => void
  setHideRisky: (hide: boolean) => void
  setFilter: (key: string, value: unknown) => void
  clearFilter: (key: string) => void
  setFilters: (filters: Partial<FilterState>, fromAgent?: boolean) => void
  setColorMode: (mode: ColorMode) => void
  setAlgorithmPreset: (preset: AlgorithmPreset) => void
  setSortBy: (sort: SortBy) => void
  setUserLocation: (loc: [number, number] | null) => void
  resetAll: () => void
}

const initialState: FilterState = {
  selectedMonths: [new Date().getMonth() + 1],
  busynessMax: 10,
  tempMin: null,
  tempMax: null,
  sunshineMin: null,
  rainfallMax: null,
  selectedActivities: [],
  selectedLandscapes: [],
  showShortlistOnly: false,
  hideRisky: false,
  agentAppliedKeys: [],
  colorMode: 'overall' as ColorMode,
  algorithmPreset: 'balanced' as AlgorithmPreset,
  sortBy: 'overall' as SortBy,
  userLocation: null,
}

export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  ...initialState,

  setMonths: (months) => set({ selectedMonths: months }),

  toggleMonth: (month) =>
    set((s) => {
      const has = s.selectedMonths.includes(month)
      if (has && s.selectedMonths.length === 1) return s // keep at least 1
      return {
        selectedMonths: has
          ? s.selectedMonths.filter((m) => m !== month)
          : [...s.selectedMonths, month].sort((a, b) => a - b),
      }
    }),

  setBusynessMax: (max) => set({ busynessMax: max }),

  setTempRange: (min, max) => set({ tempMin: min, tempMax: max }),

  setSunshineMin: (min) => set({ sunshineMin: min }),

  setRainfallMax: (max) => set({ rainfallMax: max }),

  toggleActivity: (activity) =>
    set((s) => ({
      selectedActivities: s.selectedActivities.includes(activity)
        ? s.selectedActivities.filter((a) => a !== activity)
        : [...s.selectedActivities, activity],
    })),

  toggleLandscape: (landscape) =>
    set((s) => ({
      selectedLandscapes: s.selectedLandscapes.includes(landscape)
        ? s.selectedLandscapes.filter((l) => l !== landscape)
        : [...s.selectedLandscapes, landscape],
    })),

  setShowShortlistOnly: (show) => set({ showShortlistOnly: show }),
  setHideRisky: (hide) => set({ hideRisky: hide }),

  setFilter: (key, value) => set({ [key]: value } as Partial<FilterState>),

  clearFilter: (key) => {
    const defaults: Record<string, unknown> = {
      busynessMax: 10,
      tempMin: null,
      tempMax: null,
      sunshineMin: null,
      rainfallMax: null,
      selectedActivities: [],
      selectedLandscapes: [],
      showShortlistOnly: false,
      hideRisky: false,
    }
    set((s) => ({
      ...s,
      [key]: defaults[key] ?? null,
      agentAppliedKeys: s.agentAppliedKeys.filter((k) => k !== key),
    }))
  },

  setFilters: (filters, fromAgent = false) =>
    set((s) => ({
      ...s,
      ...filters,
      agentAppliedKeys: fromAgent
        ? [...new Set([...s.agentAppliedKeys, ...Object.keys(filters)])]
        : s.agentAppliedKeys,
    })),

  setColorMode: (mode) => set({ colorMode: mode }),
  setAlgorithmPreset: (preset) => set({ algorithmPreset: preset }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setUserLocation: (loc) => set({ userLocation: loc }),

  resetAll: () => set(initialState),
}))
