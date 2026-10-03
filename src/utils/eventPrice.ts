export const readEventPrice = (value: unknown): number | null => {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+(\.\d+)?$/.test(value))) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= Number.MAX_SAFE_INTEGER ? amount : null;
};

export const readEventCurrency = (value: unknown): string | null =>
  typeof value === 'string' && /^[A-Z]{3}$/.test(value) ? value : null;

export const formatEventPrice = (amount: number | null, currency: string | null): string =>
  amount === 0 ? 'Ücretsiz' : amount !== null && currency ? `${amount.toLocaleString('tr-TR')} ${currency}` : 'Bilinmiyor';
