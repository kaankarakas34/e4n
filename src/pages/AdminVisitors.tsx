import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Shield, Phone, Mail, Building, Briefcase, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface PublicVisitor {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    profession: string;
    created_at: string;
    status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
}

export function AdminVisitors() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [visitors, setVisitors] = useState<PublicVisitor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await api.getPublicVisitors();
            setVisitors(data);
        } catch (error) {
            console.error('Veriler getirilirken hata:', error);
            setVisitors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await api.updatePublicVisitorStatus(id, newStatus);
            setVisitors(visitors.map(v => v.id === id ? { ...v, status: newStatus as any } : v));
        } catch (error) {
            console.error('Statü güncellenirken hata:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Bekliyor</Badge>;
            case 'CONTACTED':
                return <Badge className="bg-blue-100 text-blue-800"><Phone className="w-3 h-3 mr-1" /> İletişime Geçildi</Badge>;
            case 'CONVERTED':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Üye Oldu</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Reddedildi</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Erişim Kısıtlı</h2>
                    <p className="text-gray-500">Bu sayfayı görüntüleme yetkiniz yok.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Ziyaretçi Başvuruları</h1>
                    <Button onClick={() => navigate('/admin')} className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Paneli
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Başvuru Listesi ({visitors.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                <p className="mt-2 text-gray-500">Yükleniyor...</p>
                            </div>
                        ) : visitors.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Henüz başvuru yok</h3>
                                <p className="text-gray-500">Web sitesinden gelen ziyaretçi başvuruları burada listelenecek.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad / İletişim</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meslek / Şirket</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başvuru Tarihi</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {visitors.map((visitor) => (
                                            <tr key={visitor.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold flex-shrink-0">
                                                            {visitor.name.charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{visitor.name}</div>
                                                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                                <Mail className="h-3 w-3 mr-1" /> {visitor.email}
                                                            </div>
                                                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                                <Phone className="h-3 w-3 mr-1" /> {visitor.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 font-medium flex items-center">
                                                        <Briefcase className="h-3 w-3 mr-1.5 text-gray-400" /> {visitor.profession}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center mt-1">
                                                        <Building className="h-3 w-3 mr-1.5 text-gray-400" /> {visitor.company}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                        {new Date(visitor.created_at).toLocaleDateString('tr-TR')}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1 pl-6">
                                                        {new Date(visitor.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(visitor.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <select
                                                        value={visitor.status}
                                                        onChange={(e) => handleStatusChange(visitor.id, e.target.value)}
                                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                                                    >
                                                        <option value="PENDING">Bekliyor</option>
                                                        <option value="CONTACTED">İletişime Geçildi</option>
                                                        <option value="CONVERTED">Üye Oldu</option>
                                                        <option value="REJECTED">Reddedildi</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
