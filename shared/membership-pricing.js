// Official E4N membership pricing (Gross amounts including 20% KDV)
// 1 Month:  4.000 TL + 20% KDV =  4.800 TL
// 6 Months: 18.000 TL + 20% KDV = 21.600 TL (Monthly: 3.000 TL + KDV = 3.600 TL, 25% discount)
// 12 Months: 32.400 TL + 20% KDV = 38.880 TL (Monthly: 2.700 TL + KDV = 3.240 TL, 32.5% discount)
export const membershipPrices = Object.freeze({
  '1_MONTH': 4800,
  '6_MONTHS': 21600,
  '12_MONTHS': 38880,
});

export const membershipNetPrices = Object.freeze({
  '1_MONTH': 4000,
  '6_MONTHS': 18000,
  '12_MONTHS': 32400,
});

export const VAT_RATE = 0.20;
