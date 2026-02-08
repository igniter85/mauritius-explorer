export type LocationCategory =
  | "nature"
  | "beach"
  | "water"
  | "culture"
  | "food"
  | "adventure";

export interface ReviewData {
  author: string;
  rating: number;
  text: string;
  timeAgo: string;
  profilePhoto?: string;
}

export interface Location {
  name: string;
  lat: number;
  lng: number;
  category: LocationCategory;
  rating?: number;
  notes: string;
  hours?: string;
  phone?: string;
  website?: string;
  placeId?: string;
  reviews?: ReviewData[];
}

export const categoryConfig: Record<
  LocationCategory,
  { label: string; color: string; emoji: string }
> = {
  nature: { label: "Nature & Landscapes", color: "#16a34a", emoji: "🌿" },
  beach: { label: "Beaches & Islands", color: "#0ea5e9", emoji: "🏖️" },
  water: { label: "Water Activities", color: "#6366f1", emoji: "🤿" },
  culture: { label: "Culture & History", color: "#d97706", emoji: "🏛️" },
  food: { label: "Food & Drink", color: "#e11d48", emoji: "🍽️" },
  adventure: { label: "Adventure", color: "#7c3aed", emoji: "🦁" },
};

export const locations: Location[] = [
  // ═══════════════════════════════════════
  // 🌿 Nature & Landscapes
  // ═══════════════════════════════════════
  {
    name: "Black River Gorges National Park",
    lat: -20.4264,
    lng: 57.4509,
    category: "nature",
    rating: 4.6,
    notes:
      "Largest national park — lush rainforest, endemic birds, gorge viewpoints. Half-day hike. Free entry.",
    hours: "Daily 6 AM – 6 PM",
    phone: "+230 464 4053",
    placeId: "ChIJt8DLt5hofCERPkIVoGc3sbQ",
  },
  {
    name: "Le Morne Brabant (UNESCO)",
    lat: -20.45,
    lng: 57.3167,
    category: "nature",
    rating: 4.8,
    notes:
      "556m UNESCO mountain — historic slave refuge with panoramic ocean views. Guided hike recommended, start before 6 AM! Bring 1L+ water per person.",
    placeId: "ChIJUbKvu_psfCER8_n3Y6TuK5k",
  },
  {
    name: "Seven Coloured Earths",
    lat: -20.4401,
    lng: 57.3732,
    category: "nature",
    rating: 4.3,
    notes:
      "Geological marvel — multi-colored sand dunes + giant tortoises. Entry ~750 MUR. Combine with Chamarel Waterfall (same ticket).",
    hours: "Daily 8:30 AM – 5 PM",
    phone: "+230 483 4298",
    placeId: "ChIJOSVA3qdufCER1eqGkmZqZz8",
  },
  {
    name: "Chamarel Waterfall",
    lat: -20.4432,
    lng: 57.3858,
    category: "nature",
    rating: 4.5,
    notes:
      "Tallest single-drop waterfall in Mauritius (~100m). Included with Seven Coloured Earths ticket. Best in early morning light.",
    hours: "Daily 8:30 AM – 5 PM",
    placeId: "ChIJbzVmhbpufCERivQiEa2ZfVI",
  },
  {
    name: "Trou aux Cerfs Crater",
    lat: -20.315,
    lng: 57.505,
    category: "nature",
    rating: 4.2,
    notes:
      "Extinct volcanic crater in Curepipe with a lake inside. 360° island panorama. Free entry, drive right to the top. Quick 30-min stop.",
    placeId: "ChIJfR7_gPZcfCERQNErP59DJ5w",
  },
  {
    name: "Eau Bleue Waterfall",
    lat: -20.4095,
    lng: 57.5989,
    category: "nature",
    rating: 4.5,
    notes:
      "Hidden gem! Beautiful cascade with vivid blue-green pools. Requires some scrambling over rocks — wear grip shoes. Less touristy, locals' favorite. Free entry.",
  },

  // ═══════════════════════════════════════
  // 🏖️ Beaches & Islands
  // ═══════════════════════════════════════
  {
    name: "Île aux Cerfs",
    lat: -20.2724,
    lng: 57.8041,
    category: "beach",
    rating: 4.4,
    notes:
      "Famous island paradise — white sand, turquoise water, water sports. Take a catamaran with BBQ lunch & GRSE waterfall stop. Ferry return 450 MUR.",
    placeId: "ChIJWROevgzwfCERgS45v3_lbRM",
  },
  {
    name: "Trou aux Biches Beach",
    lat: -20.035,
    lng: 57.545,
    category: "beach",
    rating: 4.5,
    notes:
      "Top-rated beach in the north — excellent snorkeling right from shore with colorful fish. Calm, crystal-clear water. Best spot near Dive Spirit end.",
    placeId: "ChIJs5FkQaSsfSERbH9Y1RR_noc",
  },
  {
    name: "Flic en Flac Beach",
    lat: -20.2995,
    lng: 57.3634,
    category: "beach",
    rating: 4.4,
    notes:
      "8km beach on the west coast — legendary sunsets, calm lagoon, great restaurants nearby. Best sunset spot on the island.",
    placeId: "ChIJJzYqH3xBfCERVSO2RZTiJp4",
  },
  {
    name: "Blue Bay Marine Park",
    lat: -20.4448,
    lng: 57.7098,
    category: "beach",
    rating: 4.5,
    notes:
      "Best snorkeling in Mauritius — protected marine park with vibrant coral and fish. Glass-bottom boats available. Bring your own snorkel gear.",
    hours: "Daily 8:30 AM – 4 PM",
    placeId: "ChIJ16w1WRKLfCER5ydjhXmMOWY",
  },
  {
    name: "Le Morne Beach",
    lat: -20.4525,
    lng: 57.3127,
    category: "beach",
    rating: 4.6,
    notes:
      "Stunning beach with Le Morne mountain backdrop. World-class kitesurfing. Amazing sunsets. Free parking, public toilets, beverage stall.",
    placeId: "ChIJlZsRYeRsfCERq8EO0pSv-g8",
  },
  {
    name: "Savinia Beach",
    lat: -20.4897,
    lng: 57.5269,
    category: "beach",
    rating: 4.4,
    notes:
      "Hidden gem in the south! Secluded, uncrowded beach with dramatic coastal scenery. No facilities — bring your own supplies. Great for escaping the tourist crowds.",
  },

  // ═══════════════════════════════════════
  // 🤿 Water Activities
  // ═══════════════════════════════════════
  {
    name: "Crystal Rock",
    lat: -20.4143,
    lng: 57.3376,
    category: "water",
    rating: 4.6,
    notes:
      "Iconic rock formation in the turquoise lagoon — amazing snorkeling & Instagram-worthy photo spot. Boat access only. Shallow water, watch for sea urchins — wear reef shoes.",
    placeId: "ChIJzdte40JrfCERdFULlc7NxhA",
  },
  {
    name: "Île aux Aigrettes",
    lat: -20.4205,
    lng: 57.7325,
    category: "water",
    rating: 4.7,
    notes:
      "Conservation island run by Mauritian Wildlife Foundation — pink pigeons, giant tortoises, endemic species. Guided tours only, book ahead. Bring mosquito repellent!",
    placeId: "ChIJm7SNNVWLfCERwNVhniqvuDE",
  },
  {
    name: "Tamarin Bay — Dolphins, Whales & Surfing",
    lat: -20.3256,
    lng: 57.3719,
    category: "water",
    rating: 4.5,
    notes:
      "THE spot for wild dolphin swimming (sunrise 6 AM, ~90% success rate, spinner & bottlenose dolphins). Also the island's best surfing — left-hand reef break for intermediates+. Whale watching June–November from here too.",
  },
  {
    name: "Catamaran Cruise — Grand Baie",
    lat: -20.0127,
    lng: 57.5804,
    category: "water",
    notes:
      "Full-day catamaran cruises depart Grand Baie heading to northern islands (Coin de Mire, Flat Island, Gabriel Island). Includes snorkeling, BBQ lunch, rum punch, and usually a GRSE waterfall stop. Book at least 1 day ahead.",
  },
  {
    name: "Submarine Safari — Trou aux Biches",
    lat: -20.0336,
    lng: 57.5422,
    category: "water",
    notes:
      "Descend 35m below the surface in a real submarine! See coral, fish, and shipwrecks without getting wet. ~2 hours total, ~€100pp. Unique experience — one of few tourist submarines worldwide.",
    website: "https://www.blue-safari.com",
  },
  {
    name: "Scuba Diving — Flic en Flac",
    lat: -20.2888,
    lng: 57.3585,
    category: "water",
    notes:
      "Premier dive site — Cathedral (underwater cave with light shafts), Rempart Serpent, and several wrecks. Visibility 15–30m. PADI centers offer beginner dives (~€60) and certified dives (~€45). Best conditions Oct–Apr.",
  },

  // ═══════════════════════════════════════
  // 🏛️ Culture & History
  // ═══════════════════════════════════════
  {
    name: "Port Louis Central Market",
    lat: -20.1607,
    lng: 57.503,
    category: "culture",
    rating: 4.0,
    notes:
      "Spices, street food, souvenirs. Try dholl puri at Maraz stall (<$1). Haggle for souvenirs upstairs! Also try alouda (sweet milk drink). Speak French for better prices.",
    hours: "Mon–Sat 5 AM – 5:30 PM, Sun 5 – 11:30 AM",
    placeId: "ChIJT4oHW6tRfCERNzHolp3ATAE",
  },
  {
    name: "Caudan Waterfront",
    lat: -20.1609,
    lng: 57.4981,
    category: "culture",
    rating: 4.3,
    notes:
      "Modern waterfront with shops, restaurants, Umbrella Street, cinema & casino. Nice evening stroll by the harbor. Blue Penny Museum nearby.",
    hours: "Daily ~9 AM – 7 PM",
    phone: "+230 211 9500",
    website: "https://www.caudan.com",
    placeId: "ChIJWQHWQUlQfCERUuLoViCAENE",
  },
  {
    name: "Aapravasi Ghat (UNESCO)",
    lat: -20.1586,
    lng: 57.503,
    category: "culture",
    rating: 4.5,
    notes:
      "Historic immigration depot — free entry. Powerful museum about indentured labour history. The 'Ellis Island of the Indian Ocean'. Allow 1 hour.",
    hours: "Mon–Fri 9 AM – 4 PM, Sat 9 AM – 12 PM",
    phone: "+230 217 7770",
    placeId: "ChIJPR5dhatRfCERzCZ6gB1QwCE",
  },
  {
    name: "Cap Malheureux Church",
    lat: -19.9866,
    lng: 57.6222,
    category: "culture",
    rating: 4.6,
    notes:
      "Iconic red-roofed church against the ocean — one of the most photographed spots in Mauritius. Beautiful beach next door with food trucks and a pier for photos.",
    hours: "Daily 9:30 AM – 6 PM",
    placeId: "ChIJQTut9heqfSERXKUeE-z0S9c",
  },
  {
    name: "Pamplemousses Botanical Garden",
    lat: -20.1047,
    lng: 57.5803,
    category: "culture",
    rating: 4.3,
    notes:
      "Giant water lilies, spice trees, 300+ years of history. Entry 300 MUR (tourists). Hire a guide at entrance. Bring ALL the mosquito repellent! 2–3 hours.",
    hours: "Daily 8:30 AM – 5 PM",
    phone: "+230 243 9401",
    placeId: "ChIJB0u1o0NUfCERozS9H8g9EbM",
  },
  {
    name: "Flacq Market",
    lat: -20.1891,
    lng: 57.7257,
    category: "culture",
    rating: 4.1,
    notes:
      "Largest open-air market in Mauritius — authentic local atmosphere, fresh produce, herbs, spices, clothing. Only open Wed & Sun! Go in the morning for the best experience.",
    hours: "Wed & Sun 6 AM – 5 PM",
    placeId: "ChIJZXVqU2b5fCERD7lqSqgrKhk",
  },

  // ═══════════════════════════════════════
  // 🍽️ Food & Drink
  // ═══════════════════════════════════════
  {
    name: "Bois Chéri Tea Factory",
    lat: -20.4263,
    lng: 57.5257,
    category: "food",
    rating: 4.3,
    notes:
      "Tea plantation tour + generous tasting (~12 varieties) with stunning hilltop views over the tea fields. Last morning tour at 11:30 AM. Entry ~650 MUR. Gift shop with local rum & teas.",
    hours: "Mon–Fri 9 AM – 5 PM, Sat 9 – 11:30 AM, Sun 9 AM – 4 PM",
    phone: "+230 617 9109",
    placeId: "ChIJtY-hmuZmfCERXHQHiB1gUSM",
  },
  {
    name: "Rhumerie de Chamarel",
    lat: -20.4279,
    lng: 57.3963,
    category: "food",
    rating: 4.5,
    notes:
      "Rum distillery tour + tasting of ~12 varieties (clear, aged, vanilla, coffee, mandarin). Free tour with lunch reservation. Try the mandarin liqueur! Closed Sundays.",
    hours: "Mon–Sat 9:30 AM – 4:30 PM",
    phone: "+230 483 4980",
    website: "https://www.rhumeriedechamarel.com",
    placeId: "ChIJ_zudTjZpfCERrM6aNE6Tb54",
  },

  // ═══════════════════════════════════════
  // 🦁 Adventure
  // ═══════════════════════════════════════
  {
    name: "Casela Nature Park",
    lat: -20.2908,
    lng: 57.404,
    category: "adventure",
    rating: 4.2,
    notes:
      "Safari with zebras, rhinos, giraffes, ostriches. Also ziplines, walk with lions, quad biking. Full day recommended. Come at 10 AM opening for best experience.",
    hours: "Daily 9 AM – 5 PM",
    phone: "+230 401 6500",
    website: "https://caselaparks.com",
    placeId: "ChIJnyzvaKNDfCERqB8AG6IxUxo",
  },
  {
    name: "La Vanille Nature Park",
    lat: -20.4992,
    lng: 57.5633,
    category: "adventure",
    rating: 4.4,
    notes:
      "World's largest captive Aldabra tortoise collection + Nile crocodiles. Arrive at 11 AM for tortoise feeding, 11:30 AM for croc feeding. Entry ~975 MUR.",
    hours: "Daily 9 AM – 5 PM",
    phone: "+230 626 2503",
    website: "https://www.lavanillenaturepark.com",
    placeId: "ChIJ9XjfW4VjfCERDOuuTXuQI1w",
  },
  {
    name: "Grand Baie",
    lat: -20.0089,
    lng: 57.5816,
    category: "adventure",
    notes:
      "Lively tourist hub in the north — restaurants, nightlife, shopping, and departure point for catamaran cruises & deep-sea fishing. The 'Riviera of Mauritius'.",
    placeId: "ChIJ2269OXerfSERcd_ausyqcLQ",
  },
  {
    name: "Kitesurfing — Le Morne",
    lat: -20.4618,
    lng: 57.3195,
    category: "adventure",
    notes:
      "World-renowned kitesurfing spot — 'One Eye' wave is famous among pros. Flat-water lagoon perfect for beginners too. Multiple schools on the beach. Best wind June–November. Lessons from ~€80/session.",
  },
];
