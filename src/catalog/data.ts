// Curated demo catalog. Prices in cents. Reasons are hand-written.

export interface CatalogItem {
  id: string;
  title: string;
  merchant: string;
  price: number;
  tags: string[];
  reason: string;
}

export const CATALOG: CatalogItem[] = [
  { id: "c01", title: "Instax Mini 12 Camera Bundle", merchant: "Best Buy", price: 9999, tags: ["gift", "birthday", "photo", "fun", "party"], reason: "Instant photos make it a gift the whole group shows up in." },
  { id: "c02", title: "Ember Mug 2", merchant: "Target", price: 12995, tags: ["gift", "coffee", "tea", "practical", "desk"], reason: "Keeps coffee hot for hours; a daily-use gift." },
  { id: "c03", title: "JBL Flip 6 Speaker", merchant: "Best Buy", price: 12999, tags: ["gift", "music", "party", "trip", "outdoor", "waterproof"], reason: "Waterproof and loud enough for a beach or a dorm." },
  { id: "c04", title: "Lego Botanical Bouquet", merchant: "Target", price: 5999, tags: ["gift", "birthday", "decor", "fun", "creative"], reason: "A build-together activity that ends as decor." },
  { id: "c05", title: "Barefoot Dreams Throw", merchant: "Nordstrom", price: 14700, tags: ["gift", "cozy", "home", "dorm"], reason: "The famously soft blanket; hard to go wrong." },
  { id: "c06", title: "Kindle Paperwhite", merchant: "Amazon", price: 14999, tags: ["gift", "reading", "books", "trip", "practical"], reason: "Weeks of battery and a library in a pocket." },
  { id: "c07", title: "Coleman 6-Person Tent", merchant: "REI", price: 15999, tags: ["trip", "camping", "outdoor", "group"], reason: "Fits the whole group with room for gear." },
  { id: "c08", title: "Yeti Tundra 45 Cooler", merchant: "REI", price: 22500, tags: ["trip", "camping", "outdoor", "beach", "durable"], reason: "Holds ice for days; the trip workhorse." },
  { id: "c09", title: "Coleman Classic Camp Stove", merchant: "REI", price: 5999, tags: ["trip", "camping", "outdoor", "cooking", "budget"], reason: "Cheap, reliable, and cooks for six." },
  { id: "c10", title: "Anker 20K Power Bank (2-pack)", merchant: "Amazon", price: 5998, tags: ["trip", "practical", "tech", "budget", "road trip"], reason: "Keeps every phone alive on a long day out." },
  { id: "c11", title: "Catan Board Game", merchant: "Target", price: 4999, tags: ["game", "party", "fun", "group", "dorm", "house"], reason: "A group-night classic for three to four players." },
  { id: "c12", title: "Nintendo Switch Pro Controller", merchant: "Best Buy", price: 6999, tags: ["game", "tech", "dorm", "house", "fun"], reason: "The shared console finally gets a good second controller." },
  { id: "c13", title: "Ninja Air Fryer 4qt", merchant: "Target", price: 8999, tags: ["house", "dorm", "kitchen", "cooking", "practical"], reason: "Fast, small-kitchen friendly cooking for a shared space." },
  { id: "c14", title: "Keurig K-Mini", merchant: "Target", price: 7999, tags: ["house", "dorm", "kitchen", "coffee", "practical"], reason: "Single-serve coffee that fits on any counter." },
  { id: "c15", title: "Costco Snack Bulk Box", merchant: "Costco", price: 3999, tags: ["house", "dorm", "supply", "snacks", "party", "budget"], reason: "Feeds a house for weeks at the lowest per-unit price." },
  { id: "c16", title: "Bounty + Charmin Supply Pack", merchant: "Costco", price: 4599, tags: ["house", "dorm", "supply", "practical", "budget"], reason: "The supply run nobody wants to make, done once." },
  { id: "c17", title: "Dyson V8 Cordless Vacuum", merchant: "Best Buy", price: 29999, tags: ["house", "dorm", "cleaning", "practical", "durable"], reason: "Shared-space cleaning without the cord fights." },
  { id: "c18", title: "Philips Hue Starter Kit", merchant: "Best Buy", price: 17999, tags: ["house", "dorm", "decor", "tech", "party"], reason: "Instant party lighting, controlled from anyone's phone." },
  { id: "c19", title: "Sephora Favorites Gift Set", merchant: "Sephora", price: 6500, tags: ["gift", "birthday", "beauty", "self-care"], reason: "A sampler of bestsellers; easy to love." },
  { id: "c20", title: "Le Creuset Dutch Oven 5.5qt", merchant: "Williams Sonoma", price: 41995, tags: ["gift", "kitchen", "cooking", "durable", "wedding"], reason: "A lifetime gift for someone who cooks." },
];
