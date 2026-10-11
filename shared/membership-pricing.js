// Official E4N membership pricing (Gross amounts including 20% KDV)
// Baz: 4 Aylık Paket (1 Shuffle Dönemi) = 14.000 TL + %20 KDV = 16.800 TL (Aylık denk: 3.500 TL + KDV = 4.200 TL)
// 8 Aylık Paket (2 Shuffle Dönemi, %15 İndirim): 23.800 TL + %20 KDV = 28.560 TL (Aylık denk: 2.975 TL + KDV = 3.570 TL, Kazanç: 5.040 TL)
// 12 Aylık Paket (3 Shuffle Dönemi / Yıllık, %25 İndirim): 31.500 TL + %20 KDV = 37.800 TL (Aylık denk: 2.625 TL + KDV = 3.150 TL, Kazanç: 12.600 TL)

export const membershipPrices = Object.freeze({
  '4_MONTHS': 16800,
  '8_MONTHS': 28560,
  '12_MONTHS': 37800,
  // Geriye dönük uyumluluk (Eski testler ve geçmiş kayıtlar için)
  '1_MONTH': 4800,
  '6_MONTHS': 21600,
});

export const membershipNetPrices = Object.freeze({
  '4_MONTHS': 14000,
  '8_MONTHS': 23800,
  '12_MONTHS': 31500,
  // Geriye dönük uyumluluk (Eski testler ve geçmiş kayıtlar için)
  '1_MONTH': 4000,
  '6_MONTHS': 18000,
});

export const ACTIVE_MEMBERSHIP_PLANS = Object.freeze(['4_MONTHS', '8_MONTHS', '12_MONTHS']);

export const VAT_RATE = 0.20;
