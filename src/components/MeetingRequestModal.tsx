import React, { useState } from 'react';
import { api } from '../api/api';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useAuthStore } from '../stores/authStore';
import { Calendar, Clock, X } from 'lucide-react';

interface Props {
    targetUser: any;
    onClose: () => void;
}

export function MeetingRequestModal({ targetUser, onClose }: Props) {
    const { user } = useAuthStore();
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        const scheduledAt = new Date(`${date}T${time}`);

        try {
            await api.requestMeeting({
                senderId: user?.id,
                senderName: (user as any)?.full_name,
                receiverId: targetUser.id,
                topic,
                proposedTime: scheduledAt.toISOString(),
                duration: 60 // Default 60 mins
            });
            alert('Toplantı isteği gönderildi!');
            onClose();
        } catch (error) {
            console.error(error);
            alert('Hata oluştu.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6">
                    <div className="flex items-center mb-6">
                        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-4">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Toplantı Planla</h2>
                            <p className="text-sm text-gray-500">{targetUser.full_name} ile 1-e-1</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Toplantı Konusu</label>
                            <Input
                                required
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="Örn: İş birliği fırsatları"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                                <Input
                                    required
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                                <Input
                                    required
                                    type="time"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg flex items-start text-xs text-blue-700">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <p>
                                İsteğiniz onaylandığında her iki tarafa da <strong>Google Takvim</strong> bağlantısı içeren bir e-posta gönderilecektir.
                            </p>
                        </div>

                        <div className="pt-2">
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={sending}>
                                {sending ? 'Gönderiliyor...' : 'İsteği Gönder'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
