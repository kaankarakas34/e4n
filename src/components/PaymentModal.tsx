import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { TextArea } from '../shared/TextArea';
import { CreditCard, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';
import { readPaymentAttempt, savePaymentAttempt, clearPaymentAttempt, type PaymentAttempt } from '../services/paymentAttempt';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planTitle: string;
    amount: number;
    onSuccess: (paymentDetails?: any) => void | Promise<void>;
    isMembership?: boolean;
    initialBillingData?: {
        company?: string;
        tax_number?: string;
        tax_office?: string;
        billing_address?: string;
        email?: string;
        phone?: string;
    };
    action: {
        type: 'membership' | 'event_registration' | 'visitor_registration';
        data: any;
    };
}

export function PaymentModal({ isOpen, onClose, planTitle, amount, onSuccess, isMembership = false, initialBillingData, action }: PaymentModalProps) {
    const { user, updateUser } = useAuthStore();
    const [step, setStep] = useState<1 | 2>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    
    // Billing form state
    const [billingData, setBillingData] = useState({
        company: '',
        tax_number: '',
        tax_office: '',
        billing_address: ''
    });

    // Promo code state
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [finalAmount, setFinalAmount] = useState(amount);

    // Card details state
    const [cardData, setCardData] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: ''
    });

    const wasOpen = useRef(false);
    const attempt = useRef(0);
    const pending = useRef(false);
    const popupCleanup = useRef<(() => void) | null>(null);
    const paymentContext = JSON.stringify([user?.id,user?.role,action,amount]);
    const currentContext = useRef(paymentContext); currentContext.current = paymentContext;
    const receiptRef = useRef<(PaymentAttempt & {context:string}) | null>(null);
    const [receipt, setReceipt] = useState<(PaymentAttempt & {context:string}) | null>(null);
    const [restoredFor, setRestoredFor] = useState<string | null>(null);
    const canCheck = receipt?.context === paymentContext;

    useEffect(() => {
        setRestoredFor(null);
        const version = ++attempt.current;
        if (isOpen) {
            void readPaymentAttempt(paymentContext).then(saved => {
                if (attempt.current !== version || currentContext.current !== paymentContext) return;
                const restored = saved ? {...saved,context:paymentContext} : null;
                receiptRef.current = restored; setReceipt(restored);
                if (saved) { setFinalAmount(saved.amount); setPromoApplied(saved.amount !== amount); }
                setRestoredFor(paymentContext);
            }).catch(() => {
                if (attempt.current === version && currentContext.current === paymentContext)
                    setError('Önceki ödeme kaydı okunamadı. Yeni ödeme başlatılamıyor.');
            });
        }
        if (!isOpen) {
            pending.current = false;
            setIsProcessing(false);
        }
        return () => {
            attempt.current++;
            pending.current = false;
            popupCleanup.current?.();
            popupCleanup.current = null;
        };
    }, [isOpen, paymentContext]);

    // Pre-populate billing data from user store or initial billing data when modal opens
    useEffect(() => {
        if (isOpen && !wasOpen.current) {
            setBillingData({
                company: initialBillingData?.company || user?.company || '',
                tax_number: initialBillingData?.tax_number || user?.tax_number || '',
                tax_office: initialBillingData?.tax_office || user?.tax_office || '',
                billing_address: initialBillingData?.billing_address || user?.billing_address || ''
            });
            setFinalAmount(amount);
            setPromoCode('');
            setPromoApplied(false);
            setStep(1);
            setError('');
            setCardData({
                cardNumber: '',
                cardName: '',
                expiryDate: '',
                cvv: ''
            });
        }
        wasOpen.current = isOpen;
    }, [isOpen, user, amount, initialBillingData]);

    const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBillingData(prev => ({ ...prev, [name]: value }));
    };

    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'cardNumber') {
            formattedValue = value.replace(/\D/g, '').substring(0, 16).replace(/(\d{4})/g, '$1 ').trim();
        } else if (name === 'expiryDate') {
            formattedValue = value.replace(/\D/g, '').substring(0, 4);
            if (formattedValue.length > 2) {
                formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
            }
        } else if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').substring(0, 3);
        }

        setCardData(prev => ({
            ...prev,
            [name]: name === 'cardName' ? value : formattedValue
        }));
    };

    const handleApplyPromo = () => {
        const validCodes = ['E4N3000', 'REF3000', 'KOD3000', 'E4N3K', '3000'];
        if (validCodes.includes(promoCode.toUpperCase().trim())) {
            setFinalAmount(3000);
            setPromoApplied(true);
            setError('');
        } else {
            setError('Geçersiz referans kodu.');
            setPromoApplied(false);
            setFinalAmount(amount);
        }
    };

    const handleBillingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!(billingData?.company || '').trim()) return setError('Lütfen Şirket / Kurum Unvanı alanını doldurun.');
        if (!(billingData?.tax_office || '').trim()) return setError('Lütfen Vergi Dairesi alanını doldurun.');
        if (!(billingData?.tax_number || '').trim()) return setError('Lütfen Vergi Numarası alanını doldurun.');
        if (!(billingData?.billing_address || '').trim()) return setError('Lütfen Fatura Adresi alanını doldurun.');

        setIsProcessing(true);
        try {
            // Save billing details to database profile asynchronously if user is logged in and not registering a visitor
            if (user && action?.type !== 'visitor_registration') {
                api.updateMe(billingData)
                    .then(() => updateUser(billingData))
                    .catch(err => console.error('Non-blocking billing profile update failed:', err));
            }
            setStep(2);
            setError('');
        } catch (err: any) {
            console.error('Error in billing form transition:', err);
            setError(err.error || err.message || 'Bir hata oluştu.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOpen || pending.current || currentContext.current !== paymentContext || restoredFor !== paymentContext) return;
        if (receiptRef.current?.context === paymentContext && receiptRef.current.invoiceId) {
            setError('Yeni ödeme başlatmadan önce mevcut işlemin durumunu kontrol edin.'); return;
        }
        pending.current = true;
        const currentAttempt = ++attempt.current;
        const isCurrent = () => attempt.current === currentAttempt && currentContext.current === paymentContext;
        const finish = () => {
            if (!isCurrent()) return;
            pending.current = false;
            setIsProcessing(false);
        };
        const confirmPayment = async (payment: PaymentAttempt & {invoiceId:string;receiptToken:string}) => {
            try {
                const status = await api.getPaymentStatus(payment.invoiceId,payment.receiptToken);
                if (!isCurrent()) return;
                if (status.invoice_id !== payment.invoiceId || status.action_type !== action.type || Math.round(status.amount*100) !== Math.round(payment.amount*100)) throw new Error('Ödeme eşleşmedi');
                if (status.status === 'FAILED') {
                    await clearPaymentAttempt(paymentContext,payment.requestKey);
                    if (!isCurrent()) return;
                    receiptRef.current = null; setReceipt(null); setError('Ödeme sağlayıcısı işlemi başarısız olarak doğruladı.'); return;
                }
                if (!['SUCCESS','PAID'].includes(status.status)) { setError('Ödeme henüz kesinleşmedi. Yeni ödeme başlatmadan işlem durumunu kontrol edin.'); return; }
                await onSuccess({ cardName: cardData.cardName, finalAmount:payment.amount, promoApplied, invoiceId:payment.invoiceId });
                await clearPaymentAttempt(paymentContext,payment.requestKey);
            } catch {
                if (isCurrent()) setError('Ödeme bildirimi işlenemedi. Tekrar ödeme yapmadan işlem durumunu kontrol edin.');
            } finally {
                finish();
            }
        };
        setIsProcessing(true);
        setError('');

        try {
            const expiryParts = cardData.expiryDate.split('/');
            if (expiryParts.length !== 2) {
                setError('Geçersiz son kullanma tarihi (AA/YY)');
                finish();
                return;
            }
            const [month, year] = expiryParts;
            const previous = receiptRef.current?.context === paymentContext ? receiptRef.current : null;
            const intent = {requestKey:previous?.requestKey || crypto.randomUUID(),amount:previous?.amount ?? finalAmount};
            await savePaymentAttempt(paymentContext,intent);
            if (!isCurrent()) return;
            receiptRef.current = {...intent,context:paymentContext}; setReceipt(receiptRef.current);
            const res = await api.payWithSipay({
                requestKey: intent.requestKey,
                cardNumber: cardData.cardNumber.replace(/\s+/g, ''),
                cardHolderName: cardData.cardName,
                expiryMonth: month,
                expiryYear: '20' + year,
                cvv: cardData.cvv,
                total: intent.amount,
                email: initialBillingData?.email || user?.email || '',
                phone: initialBillingData?.phone || user?.phone || '',
                company: billingData.company,
                address: billingData.billing_address,
                tax_number: billingData.tax_number,
                tax_office: billingData.tax_office,
                action: action
            });
            if (!isCurrent()) return;
            if (res?.success !== true || !((res.is3D === true && typeof res.html === 'string' && res.html.trim()) || (res.is3D === false && res.recoveryOnly === true))
                || typeof res.invoiceId !== 'string' || !res.invoiceId || typeof res.receiptToken !== 'string' || !res.receiptToken) throw new Error('Ödeme başlatma sonucu doğrulanamadı.');
            const payment = {...intent,context:paymentContext,invoiceId:res.invoiceId,receiptToken:res.receiptToken};
            await savePaymentAttempt(paymentContext,payment);
            if (!isCurrent()) return;
            receiptRef.current = payment; setReceipt(payment);
            if (res.recoveryOnly) { await confirmPayment(payment); return; }

            if (res.success && res.is3D) {
                // Open a popup for 3D Secure Verification
                const popup = window.open('', 'Sipay3DPayment', 'width=600,height=700,status=yes,resizable=yes,scrollbars=yes');
                if (!popup) {
                    setError('3D Secure doğrulama penceresi engellendi. Yeni ödeme başlatmadan işlem durumunu kontrol edin.');
                    finish();
                    return;
                }

                // Listen for verification result from the popup window
                const handleMessage = (event: MessageEvent) => {
                    if (isCurrent() && event.source === popup && event.data?.invoice_id === payment.invoiceId
                        && ['success','fail','pending'].includes(event.data.status)) {
                        popupCleanup.current?.();
                        popupCleanup.current = null;
                        void confirmPayment(payment);
                    }
                };

                window.addEventListener('message', handleMessage);
                const timer = window.setInterval(() => {
                    if (isCurrent() && popup.closed) {
                        popupCleanup.current?.();
                        popupCleanup.current = null;
                        setError('Doğrulama penceresi kapandı. Ödeme sonucu doğrulanamadı; tekrar ödeme yapmadan işlem durumunu kontrol edin.');
                        finish();
                    }
                }, 500);
                popupCleanup.current = () => {
                    window.removeEventListener('message', handleMessage);
                    window.clearInterval(timer);
                };
                popup.document.write(res.html);
                popup.document.close();
            } else {
                setError(res.message || 'Ödeme gerçekleştirilemedi.');
                finish();
            }
        } catch (err: any) {
            if (!isCurrent()) return;
            popupCleanup.current?.();
            popupCleanup.current = null;
            console.error('POS Payment Error:', err);
            setError(err.message || 'Ödeme sırasında bir hata oluştu.');
            finish();
        }
    };

    const checkExistingPayment = async () => {
        let payment = receiptRef.current;
        if (!isOpen || pending.current || !payment || payment.context !== paymentContext || currentContext.current !== paymentContext) return;
        pending.current = true; setIsProcessing(true); setError('');
        const version = ++attempt.current;
        const isCurrent = () => attempt.current === version && currentContext.current === paymentContext;
        try {
            const recovered = await api.resumePayment(payment.requestKey);
            if (!isCurrent()) return;
            if (recovered.retryAllowed === true) {
                payment = {context:paymentContext,requestKey:payment.requestKey,amount:payment.amount};
                await savePaymentAttempt(paymentContext,payment);
                if (!isCurrent()) return;
                receiptRef.current = payment; setReceipt(payment);
                setError('İşlem bankaya gönderilmedi. Aynı ödeme kaydıyla kart bilgilerini tekrar gönderebilirsiniz.');
                return;
            }
            payment = {...payment,invoiceId:recovered.invoiceId,receiptToken:recovered.receiptToken};
            await savePaymentAttempt(paymentContext,payment);
            if (!isCurrent()) return;
            receiptRef.current = payment; setReceipt(payment);
            const result = await api.getPaymentStatus(payment.invoiceId,payment.receiptToken);
            if (!isCurrent()) return;
            if (result.invoice_id !== payment.invoiceId || result.action_type !== action.type || Math.round(result.amount*100) !== Math.round(payment.amount*100)) throw new Error('Ödeme eşleşmedi');
            if (['SUCCESS','PAID'].includes(result.status)) {
                await onSuccess({cardName:cardData.cardName,finalAmount:payment.amount,promoApplied,invoiceId:payment.invoiceId});
                await clearPaymentAttempt(paymentContext,payment.requestKey);
            } else if (result.status === 'FAILED') {
                await clearPaymentAttempt(paymentContext,payment.requestKey);
                if (!isCurrent()) return;
                receiptRef.current = null; setReceipt(null); setError('Ödeme sağlayıcısı işlemi başarısız olarak doğruladı.');
            } else setError('Ödeme henüz kesinleşmedi. Yeni ödeme başlatmadan işlem durumunu kontrol edin.');
        } catch { if (isCurrent()) setError('Ödeme sonucu doğrulanamadı. Tekrar ödeme yapmadan işlem durumunu kontrol edin.'); }
        finally { if(isCurrent()) { pending.current=false;setIsProcessing(false); } }
    };

    return (
        <Modal open={isOpen} onClose={!isProcessing ? onClose : () => { }} title={step === 1 ? "Fatura ve Referans Bilgileri (Adım 1/2)" : "Kart Bilgileri ve Ödeme (Adım 2/2)"}>
            <div className="p-4 sm:p-6">
                
                {/* Checkout Summary */}
                <div className="mb-6 bg-indigo-50/50 p-4 rounded-xl flex justify-between items-center border border-indigo-100/50">
                    <div>
                        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Plan / Ürün</p>
                        <p className="text-base font-bold text-gray-900">{planTitle}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Ödenecek Tutar</p>
                        <div className="flex flex-col items-end">
                            {promoApplied && (
                                <span className="text-xs line-through text-gray-400">₺{amount.toLocaleString('tr-TR')}</span>
                            )}
                            <span className="text-lg font-extrabold text-indigo-600">₺{finalAmount.toLocaleString('tr-TR')} <span className="text-xs font-normal text-gray-500">KDV Dahil</span></span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
                        {error}
                    </div>
                )}
                {canCheck && <Button type="button" disabled={isProcessing} onClick={checkExistingPayment}>İşlem durumunu kontrol et</Button>}

                {step === 1 ? (
                    <form onSubmit={handleBillingSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Şirket / Kurum Unvanı</label>
                                <Input
                                    required
                                    name="company"
                                    placeholder="Örn. E4N Bilişim Ltd. Şti."
                                    value={billingData.company}
                                    onChange={handleBillingChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Vergi Dairesi</label>
                                <Input
                                    required
                                    name="tax_office"
                                    placeholder="Örn. Maslak Vergi Dairesi"
                                    value={billingData.tax_office}
                                    onChange={handleBillingChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Vergi Numarası / T.C. Kimlik No</label>
                            <Input
                                required
                                name="tax_number"
                                placeholder="Örn. 1234567890"
                                value={billingData.tax_number}
                                onChange={handleBillingChange}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Fatura Adresi</label>
                            <TextArea
                                required
                                name="billing_address"
                                placeholder="Lütfen yasal fatura adresinizi tam olarak giriniz."
                                value={billingData.billing_address}
                                onChange={handleBillingChange}
                                rows={3}
                            />
                        </div>

                        {isMembership && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Referans / İndirim Kodu</label>
                                <div className="flex gap-2">
                                    <Input
                                        name="promoCode"
                                        placeholder="Varsa özel kodunuzu giriniz"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleApplyPromo}
                                        disabled={!promoCode.trim() || canCheck}
                                    >
                                        Uygula
                                    </Button>
                                </div>
                                {promoApplied && (
                                    <p className="text-xs text-green-600 font-semibold mt-1">✓ Referans kodu başarıyla uygulandı! Fiyat ₺3.000 (KDV Dahil) olarak güncellendi.</p>
                                )}
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <Button
                                type="submit"
                                className="w-full h-12 text-base flex justify-center items-center gap-2"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Kaydediliyor...' : 'Kart Bilgilerine Geç'} <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Kart Üzerindeki İsim</label>
                            <Input
                                required
                                name="cardName"
                                placeholder="Ad Soyad"
                                value={cardData.cardName}
                                onChange={handleCardChange}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Kart Numarası</label>
                            <div className="relative">
                                <Input
                                    required
                                    name="cardNumber"
                                    placeholder="0000 0000 0000 0000"
                                    value={cardData.cardNumber}
                                    onChange={handleCardChange}
                                    className="pl-10"
                                />
                                <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Son Kullanma (AA/YY)</label>
                                <Input
                                    required
                                    name="expiryDate"
                                    placeholder="01/25"
                                    value={cardData.expiryDate}
                                    onChange={handleCardChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">CVV</label>
                                <Input
                                    required
                                    name="cvv"
                                    type="password"
                                    placeholder="***"
                                    value={cardData.cvv}
                                    onChange={handleCardChange}
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 mb-4">
                                <ShieldCheck className="w-5 h-5 text-green-500" />
                                <span>256-bit SSL ile güvenli ödeme</span>
                            </div>
                            
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="flex-1 h-12"
                                    disabled={isProcessing}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-[2] h-12 text-base font-bold"
                                    disabled={isProcessing || restoredFor !== paymentContext || (canCheck && !!receipt?.invoiceId) || cardData.cardNumber.length < 19 || cardData.expiryDate.length < 5 || cardData.cvv.length < 3 || !cardData.cardName}
                                >
                                    {isProcessing ? 'Ödeme İşleniyor...' : `₺${finalAmount.toLocaleString('tr-TR')} Öde`}
                                </Button>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isProcessing}
                                className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                İptal Et
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}
