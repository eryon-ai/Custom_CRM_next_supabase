// ============================================================
// Marble Industry Constants — Premium Marble Types & Config
// ============================================================

// --- Marble Types with properties ---
export const MARBLE_TYPES = [
  {
    id: 'italian-carrara',
    name: 'Italian Carrara',
    category: 'Imported Italian',
    origin: 'Carrara, Italy',
    colorFamily: 'White',
    colors: ['White', 'Grey'],
    veins: ['Fine', 'Linear', 'Feathery'],
    pricePerSqft: 180,
    grade: 'Premium',
    availableFinishes: ['Polished', 'Honed', 'Leathered'],
    thicknesses: [15, 18, 20],
    description: 'Classic white marble with subtle grey veining. Ideal for flooring, wall cladding, and countertops.',
  },
  {
    id: 'statuario',
    name: 'Statuario',
    category: 'Imported Italian',
    origin: 'Carrara, Italy',
    colorFamily: 'White',
    colors: ['White', 'Grey'],
    veins: ['Bold', 'Dramatic', 'Thick'],
    pricePerSqft: 350,
    grade: 'Luxury',
    availableFinishes: ['Polished'],
    thicknesses: [18, 20],
    description: 'Pure white background with dramatic grey veining. Premium luxury marble for high-end projects.',
  },
  {
    id: 'calacatta',
    name: 'Calacatta Gold',
    category: 'Imported Italian',
    origin: 'Carrara, Italy',
    colorFamily: 'White',
    colors: ['White', 'Gold'],
    veins: ['Bold', 'Golden', 'Dramatic'],
    pricePerSqft: 450,
    grade: 'Luxury',
    availableFinishes: ['Polished'],
    thicknesses: [18, 20],
    description: 'White marble with distinctive gold veining. Used in luxury hotels, palaces, and premium residences.',
  },
  {
    id: 'makrana-white',
    name: 'Makrana White',
    category: 'Indian Premium',
    origin: 'Makrana, Rajasthan',
    colorFamily: 'White',
    colors: ['Pure White'],
    veins: ['Minimal', 'None'],
    pricePerSqft: 120,
    grade: 'Premium',
    availableFinishes: ['Polished', 'Honed'],
    thicknesses: [15, 18, 20],
    description: 'Pure white marble used in Taj Mahal. Excellent for flooring, temples, and premium projects.',
  },
  {
    id: 'makrana-dungri',
    name: 'Makrana Dungri',
    category: 'Indian Premium',
    origin: 'Makrana, Rajasthan',
    colorFamily: 'White',
    colors: ['White', 'Grey'],
    veins: ['Medium', 'Scattered'],
    pricePerSqft: 80,
    grade: 'Standard',
    availableFinishes: ['Polished', 'Honed'],
    thicknesses: [15, 18],
    description: 'White-grey marble from Makrana. Cost-effective for large residential and commercial projects.',
  },
  {
    id: 'indian-green',
    name: 'Indian Green Marble',
    category: 'Indian Classic',
    origin: 'Udaipur, Rajasthan',
    colorFamily: 'Green',
    colors: ['Dark Green', 'Emerald'],
    veins: ['Wavy', 'Natural'],
    pricePerSqft: 75,
    grade: 'Standard',
    availableFinishes: ['Polished', 'Honed'],
    thicknesses: [15, 18],
    description: 'Rich green marble ideal for accents, borders, and decorative flooring.',
  },
  {
    id: 'rainforest-green',
    name: 'Rainforest Green',
    category: 'Indian Premium',
    origin: 'Rajasthan',
    colorFamily: 'Green',
    colors: ['Green', 'Brown', 'White'],
    veins: ['Tree-like', 'Dramatic'],
    pricePerSqft: 95,
    grade: 'Premium',
    availableFinishes: ['Polished'],
    thicknesses: [15, 18],
    description: 'Unique tree-bark pattern. Perfect for feature walls and statement flooring.',
  },
  {
    id: 'onyx-white',
    name: 'White Onyx',
    category: 'Imported Onyx',
    origin: 'Turkey / Iran',
    colorFamily: 'White',
    colors: ['White', 'Honey'],
    veins: ['Wavy', 'Translucent'],
    pricePerSqft: 250,
    grade: 'Luxury',
    availableFinishes: ['Polished'],
    thicknesses: [15, 18, 20],
    description: 'Translucent white onyx. Backlit applications for reception desks, bars, and feature walls.',
  },
  {
    id: 'travertine-roman',
    name: 'Roman Travertine',
    category: 'Imported',
    origin: 'Italy',
    colorFamily: 'Beige',
    colors: ['Beige', 'Cream', 'Walnut'],
    veins: ['Holes', 'Natural'],
    pricePerSqft: 110,
    grade: 'Standard',
    availableFinishes: ['Honed', 'Tumbled', 'Brushed'],
    thicknesses: [15, 18],
    description: 'Classic beige travertine with natural holes. Popular for exterior cladding and flooring.',
  },
  {
    id: 'bidasar-brown',
    name: 'Bidasar Brown',
    category: 'Indian Classic',
    origin: 'Rajasthan',
    colorFamily: 'Brown',
    colors: ['Brown', 'Gold'],
    veins: ['Scattered', 'Natural'],
    pricePerSqft: 65,
    grade: 'Standard',
    availableFinishes: ['Polished', 'Honed'],
    thicknesses: [15, 18],
    description: 'Brown marble with golden speckles. Budget-friendly for residential flooring.',
  },
  {
    id: 'katni-beige',
    name: 'Katni Beige',
    category: 'Indian Classic',
    origin: 'Madhya Pradesh',
    colorFamily: 'Beige',
    colors: ['Beige', 'Light Brown'],
    veins: ['Subtle', 'Minimal'],
    pricePerSqft: 55,
    grade: 'Economy',
    availableFinishes: ['Polished', 'Honed'],
    thicknesses: [15, 18],
    description: 'Affordable beige marble for large-scale residential projects.',
  },
  {
    id: 'albeta-grey',
    name: 'Albeta Grey',
    category: 'Indian Premium',
    origin: 'Rajasthan',
    colorFamily: 'Grey',
    colors: ['Grey', 'Silver'],
    veins: ['Medium', 'Linear'],
    pricePerSqft: 90,
    grade: 'Premium',
    availableFinishes: ['Polished', 'Honed'],
    thicknesses: [15, 18],
    description: 'Elegant grey marble for modern, minimalist interiors.',
  },
];

export const MARBLE_COLORS = [
  'White', 'Grey', 'Beige', 'Brown', 'Green', 'Black', 'Pink', 'Gold', 'Blue',
] as const;

export const MARBLE_FINISHES = [
  { id: 'polished', label: 'Polished', icon: '✨', description: 'Glossy mirror finish — most popular' },
  { id: 'honed', label: 'Honed', icon: '🪨', description: 'Matte satin finish — scratch resistant' },
  { id: 'leathered', label: 'Leathered', icon: '🧵', description: 'Textured matte — hides fingerprints' },
  { id: 'tumbled', label: 'Tumbled', icon: '🪵', description: 'Aged rustic look — antique finish' },
  { id: 'brushed', label: 'Brushed', icon: '🖌️', description: 'Soft textured — modern look' },
] as const;

export const MARBLE_THICKNESSES = [
  { mm: 15, label: '15mm', category: 'Standard', usage: 'Wall cladding, light flooring' },
  { mm: 18, label: '18mm', category: 'Premium', usage: 'Flooring, countertops' },
  { mm: 20, label: '20mm', category: 'Heavy Duty', usage: 'High-traffic flooring, stairs' },
  { mm: 30, label: '30mm', category: 'Industrial', usage: 'External flooring, pavements' },
] as const;

export const MARBLE_SIZES = [
  { label: '30x30 cm', sqft: 0.97 },
  { label: '40x40 cm', sqft: 1.72 },
  { label: '60x30 cm', sqft: 1.94 },
  { label: '60x60 cm', sqft: 3.88 },
  { label: '60x120 cm', sqft: 7.75 },
  { label: '2x4 ft (Slab)', sqft: 8 },
  { label: '3x6 ft (Slab)', sqft: 18 },
  { label: '4x8 ft (Jumbo Slab)', sqft: 32 },
  { label: 'Custom Cut', sqft: 0 },
] as const;

export const PROJECT_TYPES = [
  { id: 'residential-flooring', label: 'Residential Flooring' },
  { id: 'commercial-flooring', label: 'Commercial Flooring' },
  { id: 'wall-cladding', label: 'Wall Cladding' },
  { id: 'kitchen-countertop', label: 'Kitchen Countertop' },
  { id: 'bathroom-vanity', label: 'Bathroom Vanity' },
  { id: 'staircase', label: 'Staircase' },
  { id: 'temple-pooja', label: 'Temple / Pooja Room' },
  { id: 'feature-wall', label: 'Feature Wall' },
  { id: 'exterior-facade', label: 'Exterior Facade' },
  { id: 'lobby-reception', label: 'Lobby / Reception' },
  { id: 'hotel-project', label: 'Hotel Project' },
  { id: 'villa-bungalow', label: 'Villa / Bungalow' },
  { id: 'other', label: 'Other' },
] as const;

// --- Marble pricing factors ---
export const WASTAGE_PERCENTAGE = 10; // 10% standard wastage
export const INSTALLATION_CHARGE_PER_SQFT = 35; // ₹35/sqft
export const TRANSPORTATION_BASE_CHARGE = 1500; // ₹1500 base
export const TRANSPORTATION_PER_KM = 15; // ₹15/km
export const GST_RATE = 18; // 18% GST on marble

// --- Marble area calculation ---
export function calculateAreaSqft(lengthFt: number, widthFt: number): number {
  return Math.round(lengthFt * widthFt * 100) / 100;
}

export function calculateWastage(areaSqft: number): number {
  return Math.round(areaSqft * (WASTAGE_PERCENTAGE / 100) * 100) / 100;
}

export function calculateTotalArea(areaSqft: number): number {
  const wastage = calculateWastage(areaSqft);
  return Math.round((areaSqft + wastage) * 100) / 100;
}

export function calculateMarbleCost(areaSqft: number, pricePerSqft: number): number {
  const totalArea = calculateTotalArea(areaSqft);
  return Math.round(totalArea * pricePerSqft);
}

export function calculateInstallation(areaSqft: number): number {
  return Math.round(areaSqft * INSTALLATION_CHARGE_PER_SQFT);
}

export function calculateTransportation(distanceKm: number): number {
  return Math.round(TRANSPORTATION_BASE_CHARGE + distanceKm * TRANSPORTATION_PER_KM);
}

export function calculateGST(subtotal: number): number {
  return Math.round(subtotal * (GST_RATE / 100));
}

export interface MarbleEstimate {
  areaSqft: number;
  wastageSqft: number;
  totalAreaSqft: number;
  marbleCost: number;
  installationCost: number;
  transportationCost: number;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  pricePerSqft: number;
}

export function calculateMarbleEstimate(
  lengthFt: number,
  widthFt: number,
  pricePerSqft: number,
  distanceKm: number = 0
): MarbleEstimate {
  const areaSqft = calculateAreaSqft(lengthFt, widthFt);
  const wastageSqft = calculateWastage(areaSqft);
  const totalAreaSqft = calculateTotalArea(areaSqft);
  const marbleCost = areaSqft * pricePerSqft;
  const installationCost = calculateInstallation(areaSqft);
  const transportationCost = calculateTransportation(distanceKm);
  const subtotal = marbleCost + installationCost + transportationCost;
  const gstAmount = calculateGST(subtotal);
  const grandTotal = subtotal + gstAmount;

  return {
    areaSqft,
    wastageSqft,
    totalAreaSqft,
    marbleCost,
    installationCost,
    transportationCost,
    subtotal,
    gstAmount,
    grandTotal,
    pricePerSqft,
  };
}

// --- Helper: find marble type ---
export function getMarbleById(id: string) {
  return MARBLE_TYPES.find((m) => m.id === id);
}

export function getMarblesByColor(color: string) {
  return MARBLE_TYPES.filter((m) => m.colorFamily === color);
}

export function getMarblesByCategory(category: string) {
  return MARBLE_TYPES.filter((m) => m.category === category);
}

export function getMarblesByPriceRange(min: number, max: number) {
  return MARBLE_TYPES.filter((m) => m.pricePerSqft >= min && m.pricePerSqft <= max);
}
