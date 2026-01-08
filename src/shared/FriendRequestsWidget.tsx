import { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { UserPlus, Check, X, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export function FriendRequestsWidget() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRequests = async () => {
            if (!user?.id) return;
            try {
                const reqs = await api.getFriendRequests(user.id);
                setRequests(reqs);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadRequests();
    }, [user]);

    const handleAccept = async (senderId: string) => {
        if (!user?.id) return;
        try {
            await api.acceptFriendship(user.id, senderId);
            setRequests(prev => prev.filter(r => r.sender_id !== senderId));
            // Optional: Show toast
        } catch (error) {
            console.error('Accept error', error);
        }
    };

    const handleReject = async (senderId: string) => {
        if (!user?.id) return;
        try {
            await api.rejectFriendship(user.id, senderId);
            setRequests(prev => prev.filter(r => r.sender_id !== senderId));
        } catch (error) {
            console.error('Reject error', error);
        }
    };

    if (!user) return null;
    if (!loading && requests.length === 0) return null; // Don't show if empty

    return (
        <Card className="border-indigo-100 bg-indigo-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold flex items-center text-indigo-900">
                    <UserPlus className="h-5 w-5 mr-2 text-indigo-600" />
                    Arkadaşlık İstekleri
                    <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(`/profile/${req.sender_id}`)}>
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                        {req.sender?.profile_image ? (
                                            <img src={req.sender.profile_image} alt={req.sender.full_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 hover:text-indigo-600 hover:underline">
                                            {req.sender?.full_name || 'Bilinmeyen Kullanıcı'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{req.sender?.profession}</p>
                                    </div>
                                </div>
                            </div>

                            {req.note && (
                                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded italic">
                                    "{req.note}"
                                </div>
                            )}

                            <div className="flex gap-2 mt-3">
                                <Button size="sm" onClick={() => handleAccept(req.sender_id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
                                    <Check className="h-3 w-3 mr-1" /> Kabul Et
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleReject(req.sender_id)} className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 h-8 text-xs">
                                    <X className="h-3 w-3 mr-1" /> Reddet
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
