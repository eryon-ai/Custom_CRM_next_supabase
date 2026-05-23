// ============================================================
// GST Configuration for Marble Industry
// ============================================================

// HSN (Harmonised System of Nomenclature) codes for marble & stone
export const MARBLE_HSN_CODES: Record<string, { code: string; description: string; gstRate: number; category: string }> = {
  // Rough marble blocks
  rough_marble_block: {
    code: '2515',
    description: 'Marble, travertine and other calcareous monumental or building stone — crude or roughly trimmed',
    gstRate: 5,
    category: 'Rough Stone',
  },
  // Cut/sawn marble blocks
  cut_marble_block: {
    code: '25151210',
    description: 'Marble blocks, merely cut by sawing into blocks or slabs of rectangular/square shape',
    gstRate: 12,
    category: 'Semi-Processed',
  },
  // Polished marble slabs
  polished_marble_slab: {
    code: '68022110',
    description: 'Marble slabs — polished, worked beyond simple cutting',
    gstRate: 18,
    category: 'Processed Stone',
  },
  // Marble tiles
  marble_tiles: {
    code: '68022120',
    description: 'Marble tiles — polished, cubes and similar articles',
    gstRate: 18,
    category: 'Processed Stone',
  },
  // Marble articles (statues, decor)
  marble_articles: {
    code: '68022190',
    description: 'Other worked marble articles — statues, decor items',
    gstRate: 18,
    category: 'Processed Stone',
  },
  // Granite
  granite: {
    code: '68022310',
    description: 'Granite — polished slabs and tiles',
    gstRate: 18,
    category: 'Processed Stone',
  },
  // Marble powder / chips
  marble_powder: {
    code: '25174100',
    description: 'Marble powder, granules, chippings',
    gstRate: 5,
    category: 'Stone By-product',
  },
};

// Map marble types to appropriate HSN codes
export const MARBLE_TYPE_HSN_MAP: Record<string, string> = {
  // Italian imports — typically polished
  'italian-carrara': 'polished_marble_slab',
  'statuario': 'polished_marble_slab',
  'calacatta': 'polished_marble_slab',
  // Indian premium
  'makrana-white': 'polished_marble_slab',
  'makrana-dungri': 'polished_marble_slab',
  'indian-green': 'polished_marble_slab',
  'rainforest-green': 'polished_marble_slab',
  'bidasar-brown': 'polished_marble_slab',
  'albeta-grey': 'polished_marble_slab',
  // Imported other
  'onyx-white': 'polished_marble_slab',
  'travertine-roman': 'polished_marble_slab',
  'katni-beige': 'polished_marble_slab',
  // Default fallback
  'default': 'polished_marble_slab',
};

// GST rate lookup by HSN code key
export function getGstInfo(marbleTypeId: string): { hsnCode: string; gstRate: number; description: string } {
  const hsnKey = MARBLE_TYPE_HSN_MAP[marbleTypeId] || 'polished_marble_slab';
  const hsn = MARBLE_HSN_CODES[hsnKey] || MARBLE_HSN_CODES['polished_marble_slab']!;
  return {
    hsnCode: hsn.code,
    gstRate: hsn.gstRate,
    description: hsn.description,
  };
}

// GST calculation helpers
export function calculateGst(
  subtotal: number,
  gstRate: number,
  state: 'same' | 'different' = 'same'
): { cgst: number; sgst: number; igst: number; totalGst: number; grandTotal: number } {
  const totalGst = Math.round(subtotal * gstRate) / 100;

  if (state === 'different') {
    // Interstate — IGST only
    return {
      cgst: 0,
      sgst: 0,
      igst: totalGst,
      totalGst,
      grandTotal: subtotal + totalGst,
    };
  }

  // Same state — CGST + SGST (split equally)
  const half = Math.round(totalGst / 2 * 100) / 100;
  return {
    cgst: half,
    sgst: half,
    igst: 0,
    totalGst,
    grandTotal: subtotal + totalGst,
  };
}

// Transport GST calculation (5% on freight for marble)
export const TRANSPORT_GST_RATE = 5;

export function calculateTransportGst(transportCost: number): number {
  return Math.round(transportCost * TRANSPORT_GST_RATE) / 100;
}

// E-way bill threshold for marble (interstate/intercity movement)
export const EWAY_BILL_THRESHOLD = 50000; // ₹50,000

export function requiresEwayBill(consignmentValue: number): boolean {
  return consignmentValue >= EWAY_BILL_THRESHOLD;
}

// Invoice number generator
export function generateInvoiceNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  return `MMI-${yy}${mm}-${seq}`;
}

// GST state codes (Indian states — common ones for marble trade)
export const GST_STATE_CODES: Record<string, { code: string; name: string }> = {
  'Rajasthan': { code: '08', name: 'Rajasthan' },
  'Gujarat': { code: '24', name: 'Gujarat' },
  'Maharashtra': { code: '27', name: 'Maharashtra' },
  'Karnataka': { code: '29', name: 'Karnataka' },
  'Tamil Nadu': { code: '33', name: 'Tamil Nadu' },
  'Delhi': { code: '07', name: 'Delhi' },
  'Haryana': { code: '06', name: 'Haryana' },
  'Uttar Pradesh': { code: '09', name: 'Uttar Pradesh' },
  'Madhya Pradesh': { code: '23', name: 'Madhya Pradesh' },
  'Telangana': { code: '36', name: 'Telangana' },
  'Punjab': { code: '03', name: 'Punjab' },
  'West Bengal': { code: '19', name: 'West Bengal' },
};
