import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, User, Mail, Phone, Building, Briefcase, ArrowRight, Search, X, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { api } from '../api/api';

const visitorSchema = z.object({
    firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
    company: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır'),
    profession: z.string().min(2, 'Meslek bilgisi gereklidir'),
    kvkk: z.boolean().refine(val => val === true, {
        message: 'KVKK aydınlatma metnini onaylamanız gerekmektedir'
    })
});

type VisitorFormData = z.infer<typeof visitorSchema>;

interface VisitorFormProps {
    onSuccess?: () => void;
    className?: string;
    source?: string;
}

export function VisitorForm({ onSuccess, className = "", source = "landing" }: VisitorFormProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

    // Referral Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedReferral, setSelectedReferral] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        // Check URL for refId
        const params = new URLSearchParams(window.location.search);
        const refId = params.get('refId');
        if (refId) {
            api.getPublicMember(refId).then(member => {
                if (member) setSelectedReferral(member);
            });
        }
    }, []);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            setIsSearching(true);
            api.searchPublicMembers(searchQuery).then(results => {
                setSearchResults(results);
                setIsSearching(false);
            });
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const { register, handleSubmit, formState: { errors } } = useForm<VisitorFormData>({
        resolver: zodResolver(visitorSchema)
    });

    const onSubmit = async (data: VisitorFormData) => {
        setIsSubmitting(true);
        setBlockedMessage(null);
        try {
            await api.submitPublicVisitorApplication({
                name: `${data.firstName} ${data.lastName}`,
                email: data.email,
                phone: data.phone,
                company: data.company,
                profession: data.profession,
                kvkk_accepted: true,
                source: source,
                inviter_id: selectedReferral ? selectedReferral.id : undefined
            });
            setIsSubmitted(true);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            try {
                const parsed = JSON.parse(error.message);
                if (parsed.error === 'blocked_rejection') {
                    setBlockedMessage(parsed.message);
                    return;
                }
            } catch (e) {}
            alert('Bir hata oluştu. Lütfen tekrar deneyiniz.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (blockedMessage) {
        return (
            <div className={`p-8 bg-rose-50 rounded-2xl border border-rose-100 text-center ${className}`}>
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-lg font-black text-rose-950 mb-3">Başvurunuz Daha Önce Değerlendirilmiştir</h3>
                <div className="text-left text-xs sm:text-sm text-rose-800 leading-relaxed whitespace-pre-wrap bg-white/50 p-4 rounded-xl border border-rose-100/50">
                    {blockedMessage.replace("Başvurunuz Daha Önce Değerlendirilmiştir\n\n", "")}
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className={`text-center p-8 bg-green-50 rounded-2xl border border-green-100 ${className}`}>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Başvurunuz Alındı!</h3>
                <p className="text-gray-600">
                    Ziyaretçi talebiniz başarıyla bize ulaştı. En kısa sürede sizinle iletişime geçeceğiz.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            {...register('firstName')}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.firstName ? 'border-red-300' : 'border-gray-200'}`}
                            placeholder="Adınız"
                        />
                    </div>
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            {...register('lastName')}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.lastName ? 'border-red-300' : 'border-gray-200'}`}
                            placeholder="Soyadınız"
                        />
                    </div>
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        {...register('email')}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="ornek@sirket.com"
                    />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        {...register('phone')}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.phone ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="0555 123 45 67"
                    />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şirket Adı</label>
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        {...register('company')}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.company ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="Şirketiniz"
                    />
                </div>
                {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meslek / Sektör</label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        {...register('profession')}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none ${errors.profession ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="Mesleğiniz"
                    />
                </div>
                {errors.profession && <p className="mt-1 text-xs text-red-500">{errors.profession.message}</p>}
            </div>

            {/* Referral Search Field */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Referans Üye (Opsiyonel)</label>
                
                {selectedReferral ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{selectedReferral.name}</span>
                            {selectedReferral.company && <span className="text-xs text-gray-500">{selectedReferral.company}</span>}
                        </div>
                        <button 
                            type="button" 
                            onClick={() => { setSelectedReferral(null); setSearchQuery(''); }}
                            className="text-gray-400 hover:text-red-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                placeholder="Referans üye ara (İsim veya Şirket)"
                            />
                        </div>
                        {isSearching && <p className="text-xs text-gray-500 mt-1">Aranıyor...</p>}
                        
                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {searchResults.map((member) => (
                                    <div 
                                        key={member.id}
                                        onClick={() => {
                                            setSelectedReferral(member);
                                            setSearchResults([]);
                                            setSearchQuery('');
                                        }}
                                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                    >
                                        <div className="text-sm font-bold text-gray-900">{member.name}</div>
                                        {member.company && <div className="text-xs text-gray-500">{member.company}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            {...register('kvkk')}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-red-500 checked:bg-red-500"
                        />
                        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                            <Check size={14} strokeWidth={3} />
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                        <a href="#" className="font-semibold text-red-600 hover:text-red-700 underline">KVKK Aydınlatma Metni</a>'ni okudum, kişisel verilerimin işlenmesine izin veriyorum.
                    </span>
                </label>
                {errors.kvkk && <p className="mt-1 text-xs text-red-500">{errors.kvkk.message}</p>}
            </div>

            <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-lg shadow-lg shadow-red-200 mt-4"
                isLoading={isSubmitting}
            >
                Başvuruyu Gönder <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </form>
    );
}
