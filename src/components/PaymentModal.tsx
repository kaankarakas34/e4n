import React, { useEffect, useRef } from 'react';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../shared/Button';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string | null;
    onSuccess: () => void;
    onFail: (error: string) => void;
}

export function PaymentModal({ isOpen, onClose, token, onSuccess, onFail }: PaymentModalProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Listen for messages from the iframe (if PayTR supports postMessage or if we control the redirect page)
        // PayTR usually redirects to success/fail URL. 
        // In a SPA, we might want to handle this via a backend webhook -> frontend socket, OR
        // if embedding, PayTR might stay in iframe.

        // For this mock implementation:
        // We will simulate a successful payment after 3 seconds if using a 'mock_token'.
        // If using a real token, the user interacts with the iframe.

        if (token && token.startsWith('mock_token_')) {
            const timer = setTimeout(() => {
                // Simulate success for development
                // In reality, user enters card info in iframe, then PayTR redirects parent or iframe content.
                console.log('Simulating successful payment for mock token...');
                onSuccess();
            }, 5000); // 5 seconds to pretend typing

            return () => clearTimeout(timer);
        }
    }, [token, onSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg md:max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-gray-900">Güvenli Ödeme (PayTR)</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white relative min-h-[500px]">
                    {token ? (
                        token.startsWith('mock_token_') ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                                <h3 className="text-lg font-medium text-gray-900">Ödeme Ekranı Yükleniyor...</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    (Simülasyon Modu: 5 saniye sonra otomatik onaylanacak)
                                </p>
                                <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100 max-w-sm">
                                    <div className="flex items-start">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                                        <p className="text-xs text-yellow-700 text-left">
                                            Gerçek PayTR entegrasyonu için Backend tarafında "Get Token" API'sinin çağrılması ve dönen token'ın buraya basılması gerekir.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <iframe
                                ref={iframeRef}
                                src={`https://www.paytr.com/odeme/guvenli/${token}`}
                                className="w-full h-full border-0"
                                title="PayTR Ödeme Formu"
                                allowTransparency
                            />
                        )
                    ) : (
                        <div className="flex items-center justify-center h-full text-red-500">
                            Token bulunamadı. Lütfen tekrar deneyin.
                        </div>
                    )}
                </div>

                {/* Footer (Optional, mostly for manual close if stuck) */}
                {!token?.startsWith('mock_token_') && (
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                        <Button variant="outline" size="sm" onClick={onClose}>İptal Et</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
