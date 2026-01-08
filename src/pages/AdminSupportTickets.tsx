import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../shared/Button';
import { MessageSquare, Send, Shield, User, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface Ticket {
    id: string;
    subject: string;
    status: 'OPEN' | 'ANSWERED' | 'CLOSED';
    created_at: string;
    updated_at: string;
    user_name: string;
    user_email: string;
    user_id: string;
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

export function AdminSupportTickets() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (user?.role !== 'ADMIN') return;
        loadTickets();
    }, [user]);

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
            setSelectedTicket(data.ticket);
        } catch (error) {
            console.error('Failed to load ticket details', error);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedTicket || !newMessage.trim()) return;
        try {
            await api.replyTicket(selectedTicket.id, newMessage);
            setNewMessage('');
            loadTicketDetails(selectedTicket.id);
            loadTickets(); // Refresh list status
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const handleStatusChange = async (newStatus: 'CLOSED' | 'OPEN') => {
        if (!selectedTicket) return;
        try {
            await api.updateTicketStatus(selectedTicket.id, newStatus);
            // Reload ticket details to reflect status change in current view
            const updated = { ...selectedTicket, status: newStatus };
            setSelectedTicket(updated);
            loadTickets(); // Refresh list
        } catch (e) {
            console.error(e);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">Açık</span>;
            case 'ANSWERED': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Cevaplandı</span>;
            case 'CLOSED': return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Kapalı</span>;
            default: return null;
        }
    };

    if (user?.role !== 'ADMIN') return <div>Erişim reddedildi.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Destek Paneli</h1>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Board / List */}
                <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700">Gelen Talepler</h2>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{tickets.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Talep bulunamadı.</div>
                        ) : (
                            tickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => loadTicketDetails(ticket.id)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-red-50 border-l-4 border-l-red-600' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800 text-sm truncate pr-2">{ticket.subject}</span>
                                            <span className="text-xs text-gray-500">{ticket.user_name}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(ticket.updated_at)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-gray-500 truncate max-w-[60%] italic">{ticket.last_message || '...'}</p>
                                        {getStatusBadge(ticket.status)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Details view */}
                <div className={`${!selectedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                    {selectedTicket ? (
                        <>
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="md:hidden mr-2">←</Button>
                                    <div>
                                        <h2 className="font-bold text-gray-800">{selectedTicket.subject}</h2>
                                        <div
                                            className="flex items-center text-xs text-blue-600 mt-1 cursor-pointer hover:underline"
                                            onClick={() => navigate(`/admin/members/${selectedTicket.user_id}`)}
                                            title="Üye profiline git"
                                        >
                                            <User className="h-3 w-3 mr-1" /> {selectedTicket.user_name} ({selectedTicket.user_email})
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {selectedTicket.status !== 'CLOSED' ? (
                                        <Button size="sm" variant="outline" onClick={() => handleStatusChange('CLOSED')} className="text-red-600 border-red-200 hover:bg-red-50">
                                            <XCircle className="h-4 w-4 mr-1" /> Talebi Kapat
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => handleStatusChange('OPEN')} className="text-green-600 border-green-200 hover:bg-green-50">
                                            <CheckCircle className="h-4 w-4 mr-1" /> Tekrar Aç
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                {messages.map(msg => {
                                    const isMe = msg.sender_id === user?.id; // Me is Admin here
                                    const isStaff = msg.sender_role === 'ADMIN';

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isMe
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : isStaff // Other admins?
                                                    ? 'bg-blue-500 text-white rounded-bl-none'
                                                    : 'bg-white text-gray-800 rounded-bl-none'
                                                }`}>
                                                <div className="flex items-center mb-1 space-x-2">
                                                    {!isMe && (
                                                        <span className="font-bold text-xs opacity-90 flex items-center">
                                                            {isStaff ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                                                            {msg.sender_name}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] ${isMe || isStaff ? 'text-blue-100' : 'opacity-70'}`}>
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

                            <div className="p-4 bg-white border-t border-gray-200">
                                <div className="flex space-x-2">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Yanıtınız..."
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20"
                                    />
                                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white h-20 px-6">
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                            <p>Detayları görmek için listeden bir talep seçin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
