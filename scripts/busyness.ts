/**
 * Monthly busyness scores for each region on a 1-5 scale.
 *
 * 1 = Very Quiet (almost no tourists)
 * 2 = Quiet (low season, few tourists)
 * 3 = Moderate (shoulder season)
 * 4 = Busy (popular season)
 * 5 = Peak Season (overcrowded, highest prices)
 *
 * Index: [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
 */
export const busynessData: Record<string, number[]> = {
  // ─── Philippines ───────────────────────────────────────────────────
  // Dry season Nov-May, wet Jun-Oct. Peak Dec-Apr.
  'ph-palawan':            [4, 4, 4, 4, 3, 2, 2, 2, 1, 2, 3, 4],
  'ph-cebu-bohol':         [4, 4, 4, 4, 3, 2, 2, 2, 2, 2, 3, 4],
  'ph-siargao':            [3, 3, 3, 3, 2, 2, 2, 2, 3, 4, 4, 3],
  'ph-batanes':            [2, 2, 3, 3, 3, 2, 1, 1, 1, 2, 2, 2],
  'ph-mindanao-highlands': [2, 2, 3, 3, 2, 2, 2, 2, 1, 2, 2, 2],

  // ─── China ─────────────────────────────────────────────────────────
  // Golden weeks: early Oct, Chinese New Year (Jan/Feb). Summers busy.
  'cn-yunnan':             [3, 3, 3, 4, 4, 4, 5, 5, 3, 4, 3, 2],
  'cn-guilin-guangxi':    [2, 2, 3, 4, 4, 3, 4, 4, 4, 5, 3, 2],
  'cn-sichuan':           [2, 3, 3, 4, 4, 4, 5, 5, 4, 5, 3, 2],
  'cn-xinjiang':          [1, 1, 1, 2, 3, 4, 5, 5, 4, 3, 1, 1],
  'cn-hainan':            [4, 5, 4, 3, 2, 2, 3, 3, 2, 3, 3, 4],
  'cn-beijing-north':     [2, 3, 3, 4, 5, 4, 4, 4, 4, 5, 3, 2],

  // ─── Thailand ──────────────────────────────────────────────────────
  // High season Nov-Mar, hot Apr-May, monsoon Jun-Oct.
  'th-chiang-mai-north':  [4, 4, 3, 3, 2, 2, 2, 2, 2, 3, 4, 5],
  'th-bangkok-central':   [4, 4, 3, 3, 2, 2, 2, 2, 2, 3, 4, 5],
  'th-gulf-coast':        [3, 3, 3, 3, 2, 2, 3, 3, 2, 2, 2, 4],
  'th-andaman-coast':     [4, 4, 4, 3, 2, 1, 1, 2, 2, 3, 4, 5],

  // ─── Vietnam ───────────────────────────────────────────────────────
  // North: best Oct-Dec, Mar-Apr. Central: Feb-Aug. South: Dec-Apr.
  'vn-hanoi-delta':       [3, 3, 3, 4, 3, 2, 2, 2, 3, 4, 4, 4],
  'vn-sapa-highlands':    [2, 2, 3, 4, 3, 3, 3, 3, 4, 4, 3, 2],
  'vn-da-nang':           [2, 3, 3, 4, 4, 4, 5, 5, 3, 2, 2, 2],
  'vn-hoi-an':            [2, 3, 3, 4, 4, 4, 5, 5, 3, 2, 2, 2],
  'vn-ho-chi-minh':       [4, 4, 3, 3, 2, 2, 2, 2, 2, 3, 3, 4],
  'vn-phu-quoc':          [4, 4, 3, 3, 2, 1, 1, 1, 1, 2, 3, 4],

  // ─── Indonesia ─────────────────────────────────────────────────────
  // Dry season Apr-Oct (peak Jul-Aug), wet Nov-Mar.
  'id-bali':              [3, 3, 3, 4, 4, 4, 5, 5, 4, 3, 3, 4],
  'id-lombok-gili':       [2, 2, 2, 3, 3, 4, 5, 5, 4, 3, 2, 3],
  'id-east-java':         [2, 2, 2, 3, 3, 4, 5, 5, 4, 3, 2, 2],
  'id-raja-ampat':        [3, 3, 3, 3, 2, 2, 2, 2, 2, 3, 4, 4],
  'id-komodo-flores':     [2, 2, 2, 3, 3, 3, 4, 4, 4, 3, 2, 2],
  'id-sulawesi-togean':   [2, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2],

  // ─── Malaysia ──────────────────────────────────────────────────────
  // West coast: year-round. East coast islands close Nov-Feb (monsoon).
  'my-kl-west-coast':     [3, 3, 3, 3, 3, 3, 4, 4, 3, 3, 3, 4],
  'my-penang':            [3, 4, 3, 3, 3, 3, 4, 4, 3, 3, 3, 4],
  'my-langkawi':          [3, 3, 3, 3, 2, 2, 3, 3, 2, 2, 3, 4],
  'my-cameron-highlands': [3, 3, 3, 3, 3, 3, 4, 4, 3, 3, 3, 4],
  'my-perhentian-east':   [1, 1, 1, 2, 3, 4, 5, 5, 4, 3, 1, 1],
  'my-borneo-sabah':      [2, 2, 3, 3, 3, 3, 4, 4, 3, 3, 2, 2],
  'my-borneo-sarawak':    [2, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2],

  // ─── Japan ─────────────────────────────────────────────────────────
  // Peak: cherry blossom (late Mar-Apr), autumn (Oct-Nov), summer holidays (Jul-Aug).
  'jp-tokyo-kanto':       [3, 3, 4, 5, 4, 3, 4, 4, 3, 4, 5, 4],
  'jp-kyoto-kansai':      [3, 3, 4, 5, 4, 3, 4, 4, 3, 4, 5, 3],
  'jp-hokkaido':          [3, 4, 3, 2, 3, 3, 5, 5, 3, 3, 2, 3],
  'jp-okinawa-main':      [2, 2, 3, 4, 3, 3, 5, 5, 3, 3, 2, 2],
  'jp-miyako-yaeyama':    [2, 2, 3, 4, 3, 3, 5, 5, 3, 3, 2, 2],
  'jp-alps':              [3, 4, 3, 3, 4, 3, 4, 5, 3, 4, 4, 3],

  // ─── Greece ────────────────────────────────────────────────────────
  // Peak Jul-Aug. Shoulder May-Jun, Sep-Oct. Quiet Nov-Mar.
  'gr-athens':            [2, 2, 2, 3, 4, 4, 5, 5, 4, 3, 2, 2],
  'gr-cyclades':          [1, 1, 1, 2, 4, 4, 5, 5, 4, 3, 1, 1],
  'gr-ionian':            [1, 1, 1, 2, 3, 4, 5, 5, 4, 3, 1, 1],
  'gr-crete':             [1, 1, 2, 3, 4, 4, 5, 5, 4, 3, 2, 1],
  'gr-dodecanese':        [1, 1, 1, 2, 3, 4, 5, 5, 4, 3, 1, 1],
  'gr-northern':          [1, 1, 2, 3, 3, 4, 5, 5, 4, 3, 2, 2],

  // ─── Portugal ──────────────────────────────────────────────────────
  // Peak Jul-Aug. Lisbon/Porto also busy spring/fall. Azores more summer-weighted.
  'pt-lisbon':            [2, 2, 3, 4, 4, 5, 5, 5, 4, 4, 3, 3],
  'pt-algarve':           [2, 2, 2, 3, 4, 4, 5, 5, 4, 3, 2, 2],
  'pt-porto-douro':       [2, 2, 3, 3, 4, 4, 5, 5, 4, 4, 3, 2],
  'pt-azores-sao-miguel': [1, 1, 2, 3, 3, 4, 5, 5, 4, 3, 2, 1],
  'pt-azores-pico-faial': [1, 1, 2, 2, 3, 4, 5, 4, 3, 2, 1, 1],
  'pt-azores-flores':     [1, 1, 1, 1, 2, 3, 4, 4, 3, 2, 1, 1],
  'pt-madeira':           [3, 3, 3, 4, 3, 3, 4, 4, 3, 3, 3, 4],

  // ─── Morocco ───────────────────────────────────────────────────────
  // Peak Mar-May, Oct-Nov. Jul-Aug very hot inland. Winter moderate.
  'ma-marrakech-atlas':   [3, 3, 4, 5, 4, 2, 2, 2, 3, 4, 5, 3],
  'ma-fes-imperial':      [2, 3, 4, 5, 4, 2, 1, 1, 3, 4, 4, 3],
  'ma-agadir-atlantic':   [3, 3, 3, 4, 3, 3, 4, 4, 3, 3, 3, 3],
  'ma-sahara':            [3, 3, 4, 4, 3, 1, 1, 1, 2, 4, 4, 3],

  // ─── Sri Lanka ─────────────────────────────────────────────────────
  // SW monsoon May-Sep (south/west wet), NE monsoon Oct-Jan (east wet).
  // South/west best Dec-Mar, east best Apr-Sep.
  'lk-colombo-west':      [4, 4, 4, 3, 2, 2, 2, 2, 2, 2, 3, 4],
  'lk-galle-south':       [5, 4, 4, 3, 2, 2, 2, 2, 2, 2, 3, 4],
  'lk-kandy-hills':       [4, 4, 4, 3, 2, 2, 3, 3, 2, 2, 3, 4],
  'lk-trincomalee-east':  [1, 1, 2, 3, 4, 4, 5, 5, 4, 2, 1, 1],
  'lk-yala':              [4, 4, 3, 3, 2, 2, 2, 2, 2, 3, 3, 4],

  // ─── Maldives ──────────────────────────────────────────────────────
  // Dry season (NE monsoon) Dec-Apr peak. Wet season May-Nov quieter.
  'mv-atolls':            [5, 4, 4, 4, 3, 2, 2, 2, 2, 2, 3, 5],

  // ─── Egypt ─────────────────────────────────────────────────────────
  // Best Oct-Apr (cooler). Summers extremely hot at inland sites. Red Sea year-round.
  'eg-cairo-nile':        [4, 4, 4, 3, 2, 1, 1, 1, 2, 4, 4, 5],
  'eg-red-sea':           [3, 3, 3, 3, 3, 3, 4, 4, 3, 3, 3, 4],
  'eg-sinai':             [3, 3, 3, 3, 2, 2, 3, 3, 2, 3, 3, 4],
  'eg-luxor-upper':       [5, 4, 4, 3, 2, 1, 1, 1, 1, 3, 4, 5],

  // ─── South Africa ──────────────────────────────────────────────────
  // Cape Town: summer Dec-Feb peak. Kruger: dry winter Jun-Sep best for game.
  'za-cape-town':         [5, 5, 4, 3, 2, 2, 2, 2, 3, 3, 4, 5],
  'za-garden-route':      [5, 4, 4, 3, 2, 2, 2, 2, 3, 3, 4, 5],
  'za-kruger':            [3, 3, 3, 3, 3, 4, 5, 5, 5, 4, 3, 3],
  'za-durban-kzn':        [4, 4, 4, 4, 3, 3, 4, 4, 3, 3, 3, 4],

  // ─── Tanzania ──────────────────────────────────────────────────────
  // Dry seasons: Jun-Oct and Jan-Feb. Great Migration in Serengeti Jul-Oct.
  'tz-zanzibar':          [4, 4, 3, 2, 2, 3, 4, 4, 4, 3, 2, 3],
  'tz-serengeti':         [4, 4, 3, 2, 2, 4, 5, 5, 5, 4, 3, 3],
  'tz-kilimanjaro':       [4, 4, 3, 2, 2, 3, 4, 4, 4, 3, 2, 3],

  // ─── Colombia ──────────────────────────────────────────────────────
  // Dry seasons: Dec-Mar, Jul-Aug. Rainy Apr-Jun, Sep-Nov.
  'co-cartagena-caribbean':  [5, 4, 4, 3, 2, 2, 3, 3, 2, 2, 3, 5],
  'co-medellin-antioquia':   [4, 3, 3, 3, 2, 2, 3, 3, 2, 2, 3, 4],
  'co-coffee-region':        [3, 3, 3, 3, 2, 2, 3, 3, 2, 2, 2, 3],
  'co-bogota':               [3, 3, 3, 3, 2, 2, 3, 3, 2, 2, 3, 4],

  // ─── Mexico ────────────────────────────────────────────────────────
  // High season Dec-Apr (dry). Hurricane season Jun-Nov on coasts.
  'mx-mexico-city':       [3, 3, 4, 4, 3, 3, 3, 3, 2, 3, 4, 4],
  'mx-riviera-maya':      [4, 4, 4, 4, 3, 2, 3, 3, 2, 2, 3, 5],
  'mx-oaxaca':            [3, 3, 4, 4, 3, 2, 3, 3, 2, 3, 5, 4],
  'mx-baja':              [4, 4, 4, 3, 3, 3, 3, 3, 2, 3, 3, 4],
  'mx-puerto-vallarta':   [4, 4, 4, 4, 3, 2, 2, 2, 2, 3, 4, 5],

  // ─── Argentina ─────────────────────────────────────────────────────
  // Buenos Aires year-round. Patagonia: Nov-Mar (austral summer). Mendoza: Mar-May harvest.
  'ar-buenos-aires':      [3, 3, 4, 3, 3, 2, 2, 2, 3, 4, 4, 3],
  'ar-patagonia':         [5, 4, 3, 2, 1, 1, 1, 1, 1, 2, 3, 4],
  'ar-mendoza':           [4, 4, 5, 4, 3, 2, 2, 2, 2, 3, 3, 3],
  'ar-salta-northwest':   [3, 3, 3, 4, 4, 3, 4, 4, 3, 3, 3, 3],

  // ─── Iceland ───────────────────────────────────────────────────────
  // Summer peak Jun-Aug (midnight sun). Northern lights tourism Sep-Mar.
  'is-reykjavik-south':   [2, 2, 3, 3, 3, 5, 5, 5, 3, 2, 2, 2],
  'is-north':             [1, 1, 1, 2, 3, 4, 5, 5, 3, 2, 1, 1],
  'is-westfjords':        [1, 1, 1, 1, 2, 3, 4, 4, 2, 1, 1, 1],

  // ─── Norway ────────────────────────────────────────────────────────
  // Summer Jun-Aug peak for fjords/hiking. Winter Dec-Feb for northern lights (Tromso/Lofoten).
  'no-oslo-east':         [2, 2, 2, 3, 4, 4, 5, 5, 3, 3, 2, 3],
  'no-bergen-fjords':     [1, 1, 2, 3, 4, 5, 5, 5, 4, 3, 1, 1],
  'no-lofoten':           [2, 3, 3, 3, 3, 4, 5, 5, 3, 2, 2, 2],
  'no-tromso-arctic':     [3, 3, 2, 2, 2, 3, 4, 4, 2, 2, 3, 3],
};
