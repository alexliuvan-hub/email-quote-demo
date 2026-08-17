/**
 * gwyndow's window cleaning — quote pricing (adapted from BrightPath calculator logic)
 * Exterior is always included for priced tiers; add-ons are optional.
 */

/** @typedef {'25'|'40'|'60'|'80'|'100'|'101+'} PaneTier */

/**
 * Demo rates by pane tier (placeholder — swap for Pinpoint's real numbers).
 * @type {Record<Exclude<PaneTier, '101+'>, {
 *   exterior: number,
 *   screens: number,
 *   interior: number,
 *   tracks: number,
 *   pressureWash: number
 * }>}
 */
export const PRICE_TABLE = {
  '25': { exterior: 275, screens: 50, interior: 100, tracks: 100, pressureWash: 150 },
  '40': { exterior: 315, screens: 80, interior: 160, tracks: 160, pressureWash: 175 },
  '60': { exterior: 345, screens: 100, interior: 195, tracks: 240, pressureWash: 200 },
  '80': { exterior: 495, screens: 150, interior: 320, tracks: 320, pressureWash: 225 },
  '100': { exterior: 595, screens: 200, interior: 400, tracks: 400, pressureWash: 250 },
};

export const TIER_ORDER = ['25', '40', '60', '80', '100', '101+'];

/**
 * @typedef {Object} AddOns
 * @property {boolean} [screens]
 * @property {boolean} [interior]
 * @property {boolean} [tracks]
 * @property {boolean} [pressureWash]
 */

/**
 * @typedef {Object} QuoteResult
 * @property {boolean} isCustom
 * @property {number|null} total
 * @property {string} display
 * @property {string} disclaimer
 * @property {PaneTier|null} tier
 * @property {AddOns} addOns
 */

/**
 * @param {AddOns} [addOns]
 * @returns {{ screens: boolean, interior: boolean, tracks: boolean, pressureWash: boolean }}
 */
export function normalizeAddOns(addOns = {}) {
  return {
    screens: Boolean(addOns.screens),
    interior: Boolean(addOns.interior),
    tracks: Boolean(addOns.tracks),
    pressureWash: Boolean(addOns.pressureWash),
  };
}

/**
 * Calculate estimate for a selected pane tier and add-ons.
 * Exterior is always included for priced tiers.
 * @param {PaneTier|string|null} tier
 * @param {AddOns} [addOns]
 * @returns {QuoteResult}
 */
export function calculateQuote(tier, addOns = {}) {
  const disclaimer =
    'Demo estimate only — sample rates for gwyndow's window cleaning. Final price may vary after an on-site assessment.';

  if (!tier || !TIER_ORDER.includes(String(tier))) {
    return {
      isCustom: false,
      total: null,
      display: 'Select a pane count to see your estimate.',
      disclaimer,
      tier: null,
      addOns: normalizeAddOns(addOns),
    };
  }

  const normalizedTier = /** @type {PaneTier} */ (String(tier));
  const selectedAddOns = normalizeAddOns(addOns);

  if (normalizedTier === '101+') {
    return {
      isCustom: true,
      total: null,
      display: 'Contact us for a custom quote.',
      disclaimer,
      tier: '101+',
      addOns: selectedAddOns,
    };
  }

  const rates = PRICE_TABLE[normalizedTier];
  let total = rates.exterior;
  if (selectedAddOns.screens) total += rates.screens;
  if (selectedAddOns.interior) total += rates.interior;
  if (selectedAddOns.tracks) total += rates.tracks;
  if (selectedAddOns.pressureWash) total += rates.pressureWash;

  return {
    isCustom: false,
    total,
    display: `$${total}`,
    disclaimer,
    tier: normalizedTier,
    addOns: selectedAddOns,
  };
}
