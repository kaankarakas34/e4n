import { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../shared/Button';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, Send, User, Shield } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { Modal } from '../shared/Modal';

interface Ticket {
    id: string;
    subject: string;
    status: 'OPEN' | 'ANSWERED' | 'CLOSED';
    created_at: string;
    updated_at: string;
    last_message?: string;
}

interface Message {
    id: string;
    message: string;
    sender_name: string;
    sender_role: string;
    created_at: string;
    sender_id: string;
}

export function SupportTickets() {
    const { user } = useAuthStore();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [newTicketSubject, setNewTicketSubject] = useState('');
    const [newTicketMessage, setNewTicketMessage] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        loadTickets();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedTicket]);

    const loadTickets = async () => {
        try {
            const data = await api.getTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to load tickets', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTicketDetails = async (ticketId: string) => {
        try {
            const data = await api.getTicketDetails(ticketId);
            setMessages(data.messages);
            // Update selected ticket info as well in case status changed
            setSelectedTicket(data.ticket);
        } catch (error) {
            console.error('Failed to load ticket details', error);
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;
        try {
            await api.createTicket({ subject: newTicketSubject, message: newTicketMessage });
            setShowNewTicketModal(false);
            setNewTicketSubject('');
            setNewTicketMessage('');
            loadTickets();
        } catch (error) {
            console.error('Failed to create ticket', error);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedTicket || !newMessage.trim()) return;
        try {
            await api.replyTicket(selectedTicket.id, newMessage);
            setNewMessage('');
            loadTicketDetails(selectedTicket.id);
            // Refresh list to update "last updated" sort or status
            loadTickets();
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Açık</span>;
            case 'ANSWERED': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Cevaplandı</span>;
            case 'CLOSED': return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Kapalı</span>;
            default: return null;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Destek Taleplerim</h1>
                    <p className="text-gray-500 text-sm">Sorun ve şikayetlerinizi buradan bildirebilirsiniz.</p>
                </div>
                <Button onClick={() => setShowNewTicketModal(true)} className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Yeni Destek Talebi
                </Button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Ticket List */}
                <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-700">Talepler</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                <MessageSquare className="h-10 w-10 text-gray-300 mb-2" />
                                Henüz bir destek talebiniz yok.
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => loadTicketDetails(ticket.id)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-red-50 border-l-4 border-l-red-600' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-gray-800 text-sm truncate pr-2">{ticket.subject}</span>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(ticket.updated_at)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500 truncate max-w-[70%]">{ticket.last_message || 'Mesaj yok'}</p>
                                        {getStatusBadge(ticket.status)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Ticket Detail & Chat */}
                <div className={`${!selectedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                    {selectedTicket ? (
                        <>
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="md:hidden mr-2">
                                        ←
                                    </Button>
                                    <div>
                                        <h2 className="font-bold text-gray-800">{selectedTicket.subject}</h2>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            <span className="mr-2">Talep No: #{selectedTicket.id.slice(0, 8)}</span>
                                            {getStatusBadge(selectedTicket.status)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                {messages.map(msg => {
                                    const isMe = msg.sender_id === user?.id;
                                    const isAdmin = msg.sender_role === 'ADMIN';
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isMe
                                                ? 'bg-red-600 text-white rounded-br-none'
                                                : isAdmin
                                                    ? 'bg-blue-600 text-white rounded-bl-none'
                                                    : 'bg-white text-gray-800 rounded-bl-none'
                                                }`}>

                                                <div className="flex items-center mb-1 space-x-2">
                                                    {!isMe && (
                                                        <span className="font-bold text-xs opacity-90 flex items-center">
                                                            {isAdmin ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                                                            {msg.sender_name}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] ${isMe ? 'text-red-100' : 'opacity-70'}`}>
                                                        {new Date(msg.created_at).toLocaleString('tr-TR')}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {selectedTicket.status !== 'CLOSED' && (
                                <div className="p-4 bg-white border-t border-gray-200">
                                    <div className="flex space-x-2">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Bir mesaj yazın..."
                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-20"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-red-600 hover:bg-red-700 text-white h-20 px-6">
                                            <Send className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {selectedTicket.status === 'CLOSED' && (
                                <div className="p-4 bg-gray-100 text-center text-gray-500 text-sm border-t border-gray-200">
                                    Bu destek talebi kapatılmıştır. Yeni bir talep oluşturabilirsiniz.
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                            <p>Görüntülemek için bir talep seçin</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                title="Yeni Destek Talebi Oluştur"
                open={showNewTicketModal}
                onClose={() => setShowNewTicketModal(false)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Örn: Ödeme Sorunu"
                            value={newTicketSubject}
                            onChange={(e) => setNewTicketSubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none"
                            placeholder="Sorununuzu detaylı bir şekilde açıklayınız..."
                            value={newTicketMessage}
                            onChange={(e) => setNewTicketMessage(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="ghost" onClick={() => setShowNewTicketModal(false)}>İptal</Button>
                        <Button onClick={handleCreateTicket} className="bg-red-600 text-white">Gönder</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
