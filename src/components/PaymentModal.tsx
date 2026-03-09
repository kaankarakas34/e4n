import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { CreditCard, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planTitle: string;
    amount: number;
    onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, planTitle, amount, onSuccess }: PaymentModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Basic formatting
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

        setFormData({
            ...formData,
            [name]: name === 'cardName' ? value : formattedValue
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate API call for payment
        setTimeout(() => {
            setIsProcessing(false);
            onSuccess();
        }, 2000);
    };

    return (
        <Modal open={isOpen} onClose={!isProcessing ? onClose : () => { }} title="Güvenli Ödeme">
            <div className="p-4 sm:p-6">
                <div className="mb-6 bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-100">
                    <div>
                        <p className="text-sm text-gray-500">Seçilen Plan</p>
                        <p className="text-lg font-semibold text-gray-900">{planTitle}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Ödenecek Tutar</p>
                        <p className="text-xl font-bold text-indigo-600">₺{amount.toLocaleString()}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kart Üzerindeki İsim</label>
                        <Input
                            required
                            name="cardName"
                            placeholder="Ad Soyad"
                            value={formData.cardName}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kart Numarası</label>
                        <div className="relative">
                            <Input
                                required
                                name="cardNumber"
                                placeholder="0000 0000 0000 0000"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                className="pl-10"
                            />
                            <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Son Kullanma (AA/YY)</label>
                            <Input
                                required
                                name="expiryDate"
                                placeholder="01/25"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                            <Input
                                required
                                name="cvv"
                                type="password"
                                placeholder="***"
                                value={formData.cvv}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <span>256-bit SSL ile güvenli ödeme</span>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 text-lg"
                            disabled={isProcessing || formData.cardNumber.length < 19 || formData.expiryDate.length < 5 || formData.cvv.length < 3 || !formData.cardName}
                        >
                            {isProcessing ? 'Ödeme İşleniyor...' : `₺${amount.toLocaleString()} Öde`}
                        </Button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            İptal Et
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
