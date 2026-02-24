// Hardcoded representative monthly sea surface temperatures for coastal regions.
// Based on NOAA OISST climatological normals.
// Using hardcoded values instead of live ERDDAP calls for reliability.

// Key: approximate latitude band + ocean basin → monthly SST normals
// Format: [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]

const SST_NORMALS: Record<string, number[]> = {
  // Tropical Western Pacific (Philippines, Indonesia, etc.) ~5-15°N
  'tropical-wpac': [28.0, 27.8, 28.2, 29.0, 29.5, 29.2, 28.8, 28.5, 28.8, 29.0, 29.0, 28.5],
  // South China Sea / Gulf of Thailand ~10-20°N
  'south-china-sea': [26.5, 26.8, 27.5, 28.5, 29.5, 29.8, 29.5, 29.2, 29.0, 28.5, 27.8, 27.0],
  // Hainan / Southern China coast
  'hainan-coast': [22.0, 21.5, 23.0, 25.5, 28.0, 29.5, 30.0, 29.8, 29.0, 27.0, 25.0, 23.0],
  // Andaman Sea (Phuket, Krabi)
  'andaman': [28.0, 28.5, 29.0, 29.5, 29.5, 29.0, 28.5, 28.2, 28.5, 28.8, 28.5, 28.0],
  // Vietnam coast
  'vietnam-coast': [24.0, 24.0, 25.0, 27.0, 28.5, 29.0, 29.0, 28.5, 28.0, 27.0, 26.0, 25.0],
  // East Malaysia / Borneo
  'borneo-coast': [28.0, 28.0, 28.5, 29.0, 29.5, 29.2, 28.8, 28.5, 29.0, 29.0, 28.8, 28.5],
  // Japan - Kanto (Pacific side) ~35°N
  'japan-pacific': [15.0, 14.5, 15.5, 17.5, 20.0, 22.5, 25.0, 27.0, 26.0, 23.0, 20.0, 17.0],
  // Japan - Okinawa ~26°N
  'okinawa': [22.0, 21.5, 22.0, 23.5, 25.5, 27.5, 29.0, 29.5, 28.5, 27.0, 25.0, 23.0],
  // Aegean Sea (Greece) ~37°N
  'aegean': [15.0, 14.5, 14.5, 16.0, 19.0, 22.5, 25.0, 26.0, 25.0, 22.0, 19.0, 16.5],
  // Ionian Sea (western Greece)
  'ionian': [16.0, 15.0, 15.0, 16.5, 19.5, 23.0, 25.5, 26.5, 25.5, 22.5, 19.5, 17.0],
  // Eastern Mediterranean (Crete, Dodecanese)
  'east-med': [16.5, 15.5, 15.5, 17.0, 20.0, 23.5, 26.0, 27.0, 26.0, 23.0, 20.0, 17.5],
  // Portuguese Atlantic ~38°N
  'portugal-atlantic': [15.0, 14.5, 14.5, 15.5, 16.5, 18.0, 19.5, 20.0, 19.5, 18.5, 17.0, 15.5],
  // Algarve ~37°N
  'algarve': [16.0, 15.5, 15.5, 16.5, 17.5, 19.5, 21.0, 22.0, 21.5, 20.0, 18.0, 16.5],
  // Azores ~38°N mid-Atlantic
  'azores': [17.0, 16.5, 16.0, 16.5, 17.5, 19.5, 22.0, 23.5, 23.0, 21.5, 19.5, 18.0],
  // Madeira ~33°N
  'madeira': [18.5, 18.0, 17.5, 18.0, 19.0, 21.0, 22.5, 23.5, 24.0, 22.5, 21.0, 19.5],
  // Morocco Atlantic ~30°N
  'morocco-atlantic': [17.5, 17.0, 17.0, 17.5, 18.5, 20.0, 21.5, 22.0, 22.0, 21.0, 19.5, 18.0],
  // Sri Lanka West Coast
  'sri-lanka-west': [28.0, 28.5, 29.0, 29.5, 29.0, 28.0, 27.5, 27.5, 27.5, 28.0, 28.0, 28.0],
  // Sri Lanka East Coast
  'sri-lanka-east': [26.5, 27.0, 28.0, 29.0, 29.0, 28.5, 27.5, 27.0, 27.5, 28.0, 27.5, 27.0],
  // Indian Ocean (Maldives) ~4°N
  'maldives': [28.5, 28.5, 29.0, 29.5, 29.5, 29.0, 28.5, 28.0, 28.5, 29.0, 29.0, 28.5],
  // Red Sea (Egypt) ~25°N
  'red-sea': [22.5, 22.0, 22.5, 24.0, 26.0, 28.0, 29.5, 30.0, 29.0, 27.5, 25.5, 23.5],
  // South Africa - Cape Town ~34°S (Southern Hemisphere)
  'cape-town-coast': [19.0, 20.0, 19.5, 18.0, 16.0, 14.5, 13.5, 13.0, 13.5, 15.0, 16.5, 18.0],
  // South Africa - Durban / KZN ~30°S
  'durban-coast': [25.5, 26.0, 26.0, 24.5, 23.0, 22.0, 21.0, 20.5, 21.0, 22.0, 23.5, 25.0],
  // South Africa - Garden Route ~34°S
  'garden-route': [20.5, 21.0, 20.5, 19.5, 18.0, 16.5, 15.5, 15.5, 16.0, 17.5, 18.5, 19.5],
  // Zanzibar / Tanzania coast ~6°S
  'zanzibar': [28.5, 29.0, 29.0, 28.5, 27.5, 26.0, 25.0, 25.0, 25.5, 26.5, 27.5, 28.5],
  // Caribbean Colombia ~10°N
  'caribbean-colombia': [27.0, 27.0, 27.5, 28.0, 28.5, 28.5, 28.5, 28.5, 28.5, 28.5, 28.0, 27.5],
  // Mexican Caribbean / Riviera Maya ~20°N
  'mexican-caribbean': [26.5, 26.5, 27.0, 27.5, 28.5, 29.0, 29.5, 29.5, 29.0, 28.5, 27.5, 27.0],
  // Pacific Mexico (Puerto Vallarta) ~20°N
  'mexico-pacific': [25.5, 25.0, 25.0, 25.5, 27.0, 28.5, 29.5, 30.0, 29.5, 29.0, 27.5, 26.0],
  // Baja California ~28°N Pacific
  'baja-pacific': [18.5, 18.0, 18.5, 19.5, 21.0, 23.0, 25.5, 27.0, 26.5, 24.5, 22.0, 19.5],
  // Argentina - Buenos Aires ~35°S
  'buenos-aires-coast': [22.0, 22.5, 22.0, 19.5, 16.5, 13.5, 11.5, 11.0, 12.0, 14.5, 17.5, 20.0],
  // Iceland south coast ~64°N
  'iceland-coast': [5.0, 4.5, 4.0, 4.5, 6.0, 8.0, 10.0, 10.5, 9.5, 8.0, 6.5, 5.5],
  // Norway - Bergen/Fjords ~60°N
  'norway-fjords': [6.0, 5.5, 5.5, 6.5, 9.0, 11.5, 14.0, 14.5, 13.5, 11.5, 9.0, 7.0],
  // Norway - Lofoten ~68°N
  'lofoten': [5.5, 5.0, 5.0, 5.5, 7.0, 9.0, 11.5, 12.5, 11.5, 9.5, 7.5, 6.0],
  // Norway - Tromsø ~70°N
  'tromso-coast': [4.5, 4.0, 4.0, 4.5, 5.5, 8.0, 10.5, 11.0, 10.0, 8.0, 6.0, 5.0],
}

// Map region slugs to their SST zone
const REGION_SST_MAP: Record<string, string> = {
  'ph-palawan': 'tropical-wpac',
  'ph-cebu-bohol': 'tropical-wpac',
  'ph-siargao': 'tropical-wpac',
  'ph-batanes': 'south-china-sea',
  'cn-hainan': 'hainan-coast',
  'th-gulf-coast': 'south-china-sea',
  'th-andaman-coast': 'andaman',
  'vn-da-nang': 'vietnam-coast',
  'vn-hoi-an': 'vietnam-coast',
  'vn-ho-chi-minh': 'vietnam-coast',
  'vn-phu-quoc': 'south-china-sea',
  'id-bali': 'tropical-wpac',
  'id-lombok-gili': 'tropical-wpac',
  'id-raja-ampat': 'tropical-wpac',
  'id-komodo-flores': 'tropical-wpac',
  'id-sulawesi': 'tropical-wpac',
  'my-kl-west-coast': 'south-china-sea',
  'my-penang': 'south-china-sea',
  'my-langkawi': 'andaman',
  'my-perhentian-east-coast': 'south-china-sea',
  'my-borneo-sabah': 'borneo-coast',
  'my-borneo-sarawak': 'borneo-coast',
  'jp-tokyo-kanto': 'japan-pacific',
  'jp-okinawa': 'okinawa',
  'jp-miyako-yaeyama': 'okinawa',
  'gr-athens': 'aegean',
  'gr-cyclades': 'aegean',
  'gr-ionian-islands': 'ionian',
  'gr-crete': 'east-med',
  'gr-dodecanese': 'east-med',
  'gr-northern-greece': 'aegean',
  'pt-lisbon': 'portugal-atlantic',
  'pt-algarve': 'algarve',
  'pt-porto-douro': 'portugal-atlantic',
  'pt-azores-sao-miguel': 'azores',
  'pt-azores-pico-faial': 'azores',
  'pt-azores-flores': 'azores',
  'pt-madeira': 'madeira',
  'ma-agadir-atlantic': 'morocco-atlantic',
  'lk-colombo-west-coast': 'sri-lanka-west',
  'lk-galle-south-coast': 'sri-lanka-west',
  'lk-trincomalee-east': 'sri-lanka-east',
  'mv-maldives-atolls': 'maldives',
  'eg-red-sea-coast': 'red-sea',
  'eg-sinai': 'red-sea',
  'za-cape-town': 'cape-town-coast',
  'za-garden-route': 'garden-route',
  'za-durban-kzn': 'durban-coast',
  'tz-zanzibar': 'zanzibar',
  'co-cartagena-caribbean': 'caribbean-colombia',
  'mx-riviera-maya': 'mexican-caribbean',
  'mx-puerto-vallarta-pacific': 'mexico-pacific',
  'mx-baja-california': 'baja-pacific',
  'ar-buenos-aires': 'buenos-aires-coast',
  'is-reykjavik-south-coast': 'iceland-coast',
  'is-westfjords': 'iceland-coast',
  'no-bergen-fjords': 'norway-fjords',
  'no-lofoten': 'lofoten',
  'no-tromso-arctic': 'tromso-coast',
}

export function getSeaTemp(slug: string, month: number): number | null {
  const zone = REGION_SST_MAP[slug]
  if (!zone) return null
  const normals = SST_NORMALS[zone]
  if (!normals) return null
  return normals[month - 1]
}
