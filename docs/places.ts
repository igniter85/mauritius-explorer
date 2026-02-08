// Updated PLACE_IDS for scripts/fetch-reviews.ts
// Replace the existing PLACE_IDS object with this one.
// Locations without a placeId (activity-based pins) are excluded
// since Google won't have a matching place entry for them.

const PLACE_IDS: Record<string, string> = {
  // Nature & Landscapes
  "Black River Gorges National Park": "ChIJt8DLt5hofCERPkIVoGc3sbQ",
  "Le Morne Brabant (UNESCO)": "ChIJUbKvu_psfCER8_n3Y6TuK5k",
  "Seven Coloured Earths": "ChIJOSVA3qdufCER1eqGkmZqZz8",
  "Chamarel Waterfall": "ChIJbzVmhbpufCERivQiEa2ZfVI",
  "Trou aux Cerfs Crater": "ChIJfR7_gPZcfCERQNErP59DJ5w",
  // Eau Bleue Waterfall — no Google Place ID (hidden gem, not a formal attraction)

  // Beaches & Islands
  "Île aux Cerfs": "ChIJWROevgzwfCERgS45v3_lbRM",
  "Trou aux Biches Beach": "ChIJs5FkQaSsfSERbH9Y1RR_noc",
  "Flic en Flac Beach": "ChIJJzYqH3xBfCERVSO2RZTiJp4",
  "Blue Bay Marine Park": "ChIJ16w1WRKLfCER5ydjhXmMOWY",
  "Le Morne Beach": "ChIJlZsRYeRsfCERq8EO0pSv-g8",
  // Savinia Beach — no Google Place ID (hidden gem)

  // Water Activities
  "Crystal Rock": "ChIJzdte40JrfCERdFULlc7NxhA",
  "Île aux Aigrettes": "ChIJm7SNNVWLfCERwNVhniqvuDE",
  // Tamarin Bay, Catamaran Cruise, Submarine Safari, Scuba Diving — activity pins, no single place

  // Culture & History
  "Port Louis Central Market": "ChIJT4oHW6tRfCERNzHolp3ATAE",
  "Caudan Waterfront": "ChIJWQHWQUlQfCERUuLoViCAENE",
  "Aapravasi Ghat (UNESCO)": "ChIJPR5dhatRfCERzCZ6gB1QwCE",
  "Cap Malheureux Church": "ChIJQTut9heqfSERXKUeE-z0S9c",
  "Pamplemousses Botanical Garden": "ChIJB0u1o0NUfCERozS9H8g9EbM",
  "Flacq Market": "ChIJZXVqU2b5fCERD7lqSqgrKhk",

  // Food & Drink
  "Bois Chéri Tea Factory": "ChIJtY-hmuZmfCERXHQHiB1gUSM",
  "Rhumerie de Chamarel": "ChIJ_zudTjZpfCERrM6aNE6Tb54",

  // Adventure
  "Casela Nature Park": "ChIJnyzvaKNDfCERqB8AG6IxUxo",
  "La Vanille Nature Park": "ChIJ9XjfW4VjfCERDOuuTXuQI1w",
  "Grand Baie": "ChIJ2269OXerfSERcd_ausyqcLQ",
  // Kitesurfing Le Morne — activity pin, no single place
};
