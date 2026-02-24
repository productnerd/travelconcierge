import { create } from 'zustand'

interface UIState {
  sidePanelOpen: boolean
  selectedRegionSlug: string | null
  highlightedSlugs: string[]
  eliminatedSlugs: string[]
  highlightReason: string | null
  inDecisionMode: boolean
  agentPanelOpen: boolean
}

interface UIActions {
  toggleSidePanel: () => void
  setSidePanelOpen: (open: boolean) => void
  selectRegion: (slug: string | null) => void
  setHighlights: (slugs: string[], eliminated: string[], reason: string) => void
  clearHighlights: () => void
  setDecisionMode: (active: boolean) => void
  setAgentPanelOpen: (open: boolean) => void
  toggleAgentPanel: () => void
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  sidePanelOpen: true,
  selectedRegionSlug: null,
  highlightedSlugs: [],
  eliminatedSlugs: [],
  highlightReason: null,
  inDecisionMode: false,
  agentPanelOpen: false,

  toggleSidePanel: () => set((s) => ({ sidePanelOpen: !s.sidePanelOpen })),
  setSidePanelOpen: (open) => set({ sidePanelOpen: open }),

  selectRegion: (slug) =>
    set({
      selectedRegionSlug: slug,
      sidePanelOpen: true,
    }),

  setHighlights: (slugs, eliminated, reason) =>
    set({
      highlightedSlugs: slugs,
      eliminatedSlugs: eliminated,
      highlightReason: reason,
    }),

  clearHighlights: () =>
    set({
      highlightedSlugs: [],
      eliminatedSlugs: [],
      highlightReason: null,
      inDecisionMode: false,
    }),

  setDecisionMode: (active) => set({ inDecisionMode: active }),
  setAgentPanelOpen: (open) => set({ agentPanelOpen: open }),
  toggleAgentPanel: () => set((s) => ({ agentPanelOpen: !s.agentPanelOpen })),
}))
