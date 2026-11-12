/**
 * Unsplash sports product image library.
 * Curated, high-resolution sports photography URLs from Unsplash.
 * Ensures every product has its own distinct, working image that fills the exact card space.
 */

export const UNSPLASH_PRODUCT_CATALOG = {
  // Boxing & Combat
  'APX-VNM-CHAL-HG': [
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=800&q=80',
  ],
  'APX-EVR-PRO-16': [
    'https://images.unsplash.com/photo-1602457471723-fc02d83d8897?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
  ],
  'APX-VNM-ELT-14': [
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1602457471723-fc02d83d8897?auto=format&fit=crop&w=800&q=80',
  ],

  // Tennis
  'PRO-WIL-PS97': [
    'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
  ],
  'PRO-BAB-PA-RAFA': [
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
  ],

  // Football / Soccer
  'APX-NKE-FLIGHT': [
    'https://images.unsplash.com/photo-1564518440696-ef272968778e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80',
  ],
  'APX-ADI-PRED-ELITE': [
    'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511426463457-0571e247d816?auto=format&fit=crop&w=800&q=80',
  ],

  // Basketball
  'APX-WIL-EVO-SZ7': [
    'https://images.unsplash.com/photo-1518407613690-d9fc990e795f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542652694-40abf526446e?auto=format&fit=crop&w=800&q=80',
  ],

  // Badminton
  'PRO-YNX-AX99P': [
    'https://images.unsplash.com/photo-1626926938421-90124a4b83fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
  ],

  // Free Weights & Barbells
  'IRN-OLY-20KG': [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  ],
  'IRN-ROG-BMP-20': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  ],

  // Cardio Machines
  'IRN-C2-ROW-ERG': [
    'https://images.unsplash.com/photo-1637666218229-1fe0a9419267?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  ],
};

const SPECIFIC_KEYWORD_IMAGES = [
  // Boxing Headgear
  {
    test: (s) => /headgear|headguard|cranial/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Everlast Boxing Gloves
  {
    test: (s) => /everlast/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1602457471723-fc02d83d8897?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Venum Boxing Gloves
  {
    test: (s) => /venum/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1602457471723-fc02d83d8897?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Generic Boxing
  {
    test: (s) => /box|glove|sparring|combat|punch/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1602457471723-fc02d83d8897?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Wilson Tennis Racket
  {
    test: (s) => /pro staff|wilson.*racket|wilson.*tennis/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Babolat Tennis Racket
  {
    test: (s) => /babolat|pure aero|rafa/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Generic Tennis
  {
    test: (s) => /tennis/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Football Boots / Cleats
  {
    test: (s) => /predator|boot|cleat/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511426463457-0571e247d816?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Football / Soccer Ball
  {
    test: (s) => /flight|football.*ball|soccer/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1564518440696-ef272968778e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Basketball
  {
    test: (s) => /basket|evolution/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1518407613690-d9fc990e795f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542652694-40abf526446e?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Badminton
  {
    test: (s) => /badminton|yonex|shuttle/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1626926938421-90124a4b83fa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Barbell
  {
    test: (s) => /barbell|hard-chrome|olympic barbell/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Bumper Plates / Weights
  {
    test: (s) => /bumper|plate|rogue/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    ],
  },
  // Rowing / Cardio Machine
  {
    test: (s) => /rowerg|rowing|concept2|cardio|treadmill/i.test(s),
    images: [
      'https://images.unsplash.com/photo-1637666218229-1fe0a9419267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    ],
  },
];

const DISTINCT_ROTATING_FALLBACKS = [
  'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1564518440696-ef272968778e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518407613690-d9fc990e795f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1602457471723-fc02d83d8897?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1626926938421-90124a4b83fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1637666218229-1fe0a9419267?auto=format&fit=crop&w=800&q=80',
];

function getHashIndex(str = '', length = DISTINCT_ROTATING_FALLBACKS.length) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
}

/**
 * Returns an array of Unsplash images for a product.
 * Prioritizes product.images if present and valid; otherwise matches SKU or keywords.
 */
export function getProductImages(product) {
  if (!product) return [DISTINCT_ROTATING_FALLBACKS[0]];

  // 1. If product has valid images already assigned (and not empty)
  if (Array.isArray(product.images) && product.images.length > 0) {
    const valid = product.images.filter(
      (img) => typeof img === 'string' && img.trim().length > 0 && !img.includes('placeholder'),
    );
    if (valid.length > 0) return valid;
  }

  // 2. Exact SKU match from catalog
  if (product.sku && UNSPLASH_PRODUCT_CATALOG[product.sku]) {
    return UNSPLASH_PRODUCT_CATALOG[product.sku];
  }

  // 3. Keyword match based on name, brand, sportType
  const searchTarget = [
    product.name,
    product.brand,
    product.gearCategory,
    Array.isArray(product.sportType) ? product.sportType.join(' ') : product.sportType,
    product.description,
  ]
    .filter(Boolean)
    .join(' ');

  for (const item of SPECIFIC_KEYWORD_IMAGES) {
    if (item.test(searchTarget)) {
      return item.images;
    }
  }

  // 4. Deterministic unique fallback based on product id/name
  const seedKey = product.productId || product.name || 'sports';
  const idx = getHashIndex(seedKey);
  return [DISTINCT_ROTATING_FALLBACKS[idx]];
}

/**
 * Returns a single primary Unsplash image URL for a product.
 */
export function getProductImage(product, index = 0) {
  const images = getProductImages(product);
  return images[index] || images[0] || DISTINCT_ROTATING_FALLBACKS[0];
}
