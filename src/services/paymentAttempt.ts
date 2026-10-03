export type PaymentAttempt = { requestKey: string; amount: number; invoiceId?: string; receiptToken?: string };

const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([key,item]) => [key,canonical(item)])) : value;
async function storageKey(context: string) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical(JSON.parse(context)))));
    return 'e4n-payment-attempt:' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
function valid(entry: PaymentAttempt) {
    return entry && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(entry.requestKey)
        && Number.isFinite(entry.amount) && entry.amount > 0
        && (entry.invoiceId === undefined || (typeof entry.invoiceId === 'string' && !!entry.invoiceId))
        && (entry.receiptToken === undefined || (typeof entry.receiptToken === 'string' && !!entry.receiptToken));
}
export async function readPaymentAttempt(context: string): Promise<PaymentAttempt | null> {
    const raw = sessionStorage.getItem(await storageKey(context));
    if (raw === null) return null;
    const entry = JSON.parse(raw);
    if (!valid(entry)) throw new Error('Önceki ödeme kaydı okunamadı.');
    return entry;
}
export async function savePaymentAttempt(context: string, entry: PaymentAttempt) {
    if (!valid(entry)) throw new Error('Ödeme kaydı doğrulanamadı.');
    // Only recovery metadata: never persist card, CVV, billing or action data.
    sessionStorage.setItem(await storageKey(context), JSON.stringify({ requestKey: entry.requestKey, amount: entry.amount,
        invoiceId: entry.invoiceId, receiptToken: entry.receiptToken }));
}
export async function clearPaymentAttempt(context: string, requestKey: string) {
    const key = await storageKey(context);
    const raw = sessionStorage.getItem(key);
    if (raw && JSON.parse(raw).requestKey === requestKey) sessionStorage.removeItem(key);
}
