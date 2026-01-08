import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { api } from '../api/api';
import { Upload as FileUpload } from '../shared/Upload';

const memberSchema = z.object({
    full_name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    tc_no: z.string().length(11, 'TC No 11 haneli olmalıdır'),
    phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
    company: z.string().min(2, 'Şirket adı zorunludur'),
    profession: z.string().min(2, 'Meslek kolu zorunludur'),
    tax_number: z.string().optional(),
    tax_office: z.string().optional(),
    billing_address: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

export function CreateMember() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<MemberFormData>({
        resolver: zodResolver(memberSchema),
    });

    const onSubmit = async (data: MemberFormData) => {
        setLoading(true);
        try {
            // Create FormData object to handle file upload along with text data if sending to a real API supporting multipart/form-data
            // Or just send JSON if backend expects JSON. Since this is mock, we'll simulate.

            const payload = {
                ...data,
                profile_photo: profilePhoto ? 'mock-url-to-photo' : undefined, // Simulate cloud upload
                status: 'ACTIVE', // Default to active?
                role: 'MEMBER',
                password: 'ChangeMe123!', // Temporary password
                registered_at: new Date().toISOString()
            };

            await api.createMember(payload);
            alert('Üye başarıyla oluşturuldu.');
            navigate('/admin/members');
        } catch (error) {
            console.error('Üye oluşturulurken hata:', error);
            alert('Üye oluşturulamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Button variant="ghost" className="mr-4" onClick={() => navigate('/admin/members')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Geri Dön
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-900">Yeni Üye Oluştur</h1>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Üye Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Ad Soyad *</label>
                                    <Input {...register('full_name')} error={errors.full_name?.message} placeholder="Ad Soyad" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">TC Kimlik No *</label>
                                    <Input {...register('tc_no')} error={errors.tc_no?.message} placeholder="11 haneli TC No" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">E-Posta Adresi *</label>
                                    <Input type="email" {...register('email')} error={errors.email?.message} placeholder="ornek@mail.com" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Telefon Numarası *</label>
                                    <Input {...register('phone')} error={errors.phone?.message} placeholder="(555) 000 00 00" />
                                </div>
                            </div>

                            {/* Professional & Tax Info */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Kurumsal ve Fatura Bilgileri</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Şirket Adı *</label>
                                        <Input {...register('company')} error={errors.company?.message} placeholder="Şirket Adı" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Meslek Kolu *</label>
                                        <Input {...register('profession')} error={errors.profession?.message} placeholder="Örn: Mimar, Avukat" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Vergi Dairesi</label>
                                        <Input {...register('tax_office')} error={errors.tax_office?.message} placeholder="Vergi Dairesi" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Vergi Numarası</label>
                                        <Input {...register('tax_number')} error={errors.tax_number?.message} placeholder="Vergi No" />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Fatura Adresi</label>
                                        <textarea
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-h-[80px]"
                                            {...register('billing_address')}
                                            placeholder="Fatura için tam adres..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Profile Photo */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Profil Fotoğrafı</h3>
                                <FileUpload
                                    label="Fotoğraf Yükle"
                                    accept="image/*"
                                    onFileSelect={(file) => setProfilePhoto(file)}
                                />
                                {profilePhoto && <p className="text-sm text-green-600 mt-2">Seçilen dosya: {profilePhoto.name}</p>}
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button type="button" variant="ghost" className="mr-4" onClick={() => navigate('/admin/members')}>İptal</Button>
                                <Button type="submit" disabled={loading} className="w-40">
                                    {loading ? 'Kaydediliyor...' : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Üyeyi Oluştur
                                        </>
                                    )}
                                </Button>
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
