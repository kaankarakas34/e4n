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
    ticket_id: string;
    message: string;
    sender_name: string;
    sender_role: string;
    created_at: string;
    sender_id: string;
}

const isTicket = (value: any): value is Ticket => value && typeof value === 'object' && !Array.isArray(value)
    && ['id', 'user_id'].every(key => typeof value[key] === 'string' && !!value[key].trim())
    && typeof value.subject === 'string' && typeof value.status === 'string'
    && ['created_at', 'updated_at'].every(key => typeof value[key] === 'string' && Number.isFinite(Date.parse(value[key])))
    && ['user_name', 'user_email', 'last_message'].every(key => value[key] == null || typeof value[key] === 'string');

export function AdminSupportTickets() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [listError, setListError] = useState<string | null>(null);
    const [loadedFor, setLoadedFor] = useState<string | null>(null);
    const context = `${user?.id}:${user?.role}`;
    const currentContext = useRef(context);
    currentContext.current = context;
    const active = useRef(true);
    const listSequence = useRef(0);
    const detailSequence = useRef(0);
    const detailTarget = useRef<string | null>(null);
    const [requestedTicket, setRequestedTicket] = useState<string | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const mutationLock = useRef<object | null>(null);
    const mutationAttempt = useRef<{signature:string;key:string} | null>(null);
    const [pendingFor, setPendingFor] = useState<string | null>(null);
    const [mutationNotice, setMutationNotice] = useState<{ context: string; ticketId: string; text: string; error: boolean } | null>(null);
    const renderedDetailSequence = detailSequence.current;
    const pending = pendingFor === context;
    const isCurrentContext = () => active.current && currentContext.current === context && user?.role === 'ADMIN';

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        active.current = true;
        setSelectedTicket(null); setMessages([]); setNewMessage(''); setPendingFor(null); setMutationNotice(null);
        detailTarget.current = null; setRequestedTicket(null); setDetailError(null); setDetailLoading(false);
        if (user?.role === 'ADMIN') void loadTickets();
        return () => { active.current = false; listSequence.current++; detailSequence.current++; detailTarget.current = null; };
    }, [user?.id, user?.role]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedTicket]);

    const loadTickets = async () => {
        if (!isCurrentContext()) return;
        const sequence = ++listSequence.current;
        const isCurrent = () => isCurrentContext() && sequence === listSequence.current;
        setLoading(true); setListError(null);
        try {
            const data = await api.getTickets();
            if (!Array.isArray(data) || !data.every(isTicket)) throw new Error('Invalid tickets response');
            if (isCurrent()) { setTickets(data); setLoadedFor(context); }
        } catch {
            if (isCurrent()) { setListError('Destek talepleri yüklenemedi.'); setLoadedFor(context); }
        } finally {
            if (isCurrent()) setLoading(false);
        }
    };

    const loadTicketDetails = async (ticketId: string) => {
        if (!isCurrentContext() || loading || listError || loadedFor !== context || !tickets.some(ticket => ticket.id === ticketId)) return;
        const owner = tickets.find(ticket => ticket.id === ticketId)!.user_id;
        if (detailTarget.current !== ticketId) { setNewMessage(''); setMutationNotice(null); }
        detailTarget.current = ticketId;
        const sequence = ++detailSequence.current;
        const isCurrent = () => isCurrentContext() && sequence === detailSequence.current && detailTarget.current === ticketId;
        setRequestedTicket(ticketId); setDetailLoading(true); setDetailError(null); setSelectedTicket(null); setMessages([]);
        try {
            const data = await api.getTicketDetails(ticketId);
            if (!isTicket(data?.ticket) || data.ticket.id !== ticketId || data.ticket.user_id !== owner
                || !Array.isArray(data.messages) || data.messages.some((message: any) => !message || typeof message !== 'object' || Array.isArray(message)
                    || message.ticket_id !== ticketId || ['id', 'sender_id'].some(key => typeof message[key] !== 'string' || !message[key].trim())
                    || typeof message.message !== 'string' || typeof message.sender_role !== 'string'
                    || (message.sender_name != null && typeof message.sender_name !== 'string')
                    || typeof message.created_at !== 'string' || !Number.isFinite(Date.parse(message.created_at)))) throw new Error('Invalid ticket details');
            if (!isCurrent()) return;
            setMessages(data.messages);
            setSelectedTicket(data.ticket);
        } catch {
            if (isCurrent()) setDetailError('Talep detayları yüklenemedi.');
        } finally {
            if (isCurrent()) setDetailLoading(false);
        }
    };

    const closeDetails = () => {
        detailSequence.current++; detailTarget.current = null; setMutationNotice(null);
        setRequestedTicket(null); setSelectedTicket(null); setMessages([]); setNewMessage(''); setDetailError(null); setDetailLoading(false);
    };

    const runMutation = async (kind: 'reply' | 'status', status?: 'CLOSED' | 'OPEN') => {
        if (!isCurrentContext() || mutationLock.current || loading || listError || loadedFor !== context
            || detailLoading || detailError || !selectedTicket || detailTarget.current !== selectedTicket.id
            || renderedDetailSequence !== detailSequence.current || (kind === 'reply' && !newMessage.trim())
            || (kind === 'status' && status !== 'CLOSED' && status !== 'OPEN')) return;
        const ticketId = selectedTicket.id;
        const sequence = detailSequence.current;
        const token = {};
        const signature = JSON.stringify([context,kind,ticketId,kind==='reply'?newMessage.trim():status]);
        mutationLock.current = token;
        setPendingFor(context); setMutationNotice(null);
        const isCurrent = () => isCurrentContext() && sequence === detailSequence.current && detailTarget.current === ticketId;
        try {
            if (mutationAttempt.current?.signature !== signature) mutationAttempt.current = {signature,key:crypto.randomUUID()};
            const requestKey = mutationAttempt.current.key;
            const result = kind === 'reply' ? await api.replyTicket(ticketId, newMessage.trim(), requestKey)
                : await api.updateTicketStatus(ticketId, status!, requestKey);
            if (!isCurrent()) return;
            if (result?.success !== true) throw new Error('Unconfirmed mutation');
            if (mutationAttempt.current?.key === requestKey) mutationAttempt.current = null;
            if (kind === 'reply') setNewMessage('');
            setMutationNotice({ context, ticketId, error: false, text: kind === 'reply'
                ? 'Yanıt kaydedildi. Güncel bilgiler yükleniyor; yenileme hatasında yalnızca tekrar yükleyin.'
                : 'Durum değişikliği onaylandı. Güncel bilgiler yükleniyor; yenileme hatasında yalnızca tekrar yükleyin.' });
            // Read failures have their own retry controls and never repeat the confirmed write.
            await Promise.all([loadTicketDetails(ticketId), loadTickets()]);
        } catch {
            if (isCurrent()) setMutationNotice({ context, ticketId, error: true,
                text: 'İşlem sonucu doğrulanamadı. Yeniden göndermeden önce talebi tekrar yükleyip kontrol edin.' });
        } finally {
            if (mutationLock.current === token) {
                mutationLock.current = null;
                if (isCurrentContext()) setPendingFor(null);
            }
        }
    };

    const handleSendMessage = () => runMutation('reply');
    const handleStatusChange = (status: 'CLOSED' | 'OPEN') => runMutation('status', status);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">Açık</span>;
            case 'ANSWERED': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Cevaplandı</span>;
            case 'CLOSED': return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Kapalı</span>;
            default: return <span>Bilinmeyen durum</span>;
        }
    };

    if (user?.role !== 'ADMIN') return <div>Erişim reddedildi.</div>;
    if (loadedFor !== context) return <p role="status">Destek talepleri yükleniyor...</p>;

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Destek Paneli</h1>

            {mutationNotice?.context === context && mutationNotice.ticketId === requestedTicket && (
                <div role={mutationNotice.error ? 'alert' : 'status'} className="mb-3">
                    <p>{mutationNotice.text}</p>
                    {mutationNotice.error && <Button disabled={pending || loading || !!listError} onClick={() => loadTicketDetails(mutationNotice.ticketId)}>Talebi tekrar yükle</Button>}
                </div>
            )}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Board / List */}
                <div className={`${requestedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700">Gelen Talepler</h2>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{listError ? 'Bilinmiyor' : loading ? 'Yükleniyor...' : tickets.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {listError ? (
                            <div role="alert" className="p-4"><p>{listError}</p><Button onClick={() => loadTickets()}>Tekrar dene</Button></div>
                        ) : loading ? (
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
                <div className={`${!requestedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                    {requestedTicket && (detailLoading || detailError) ? (
                        <div className="p-4">
                            <Button onClick={closeDetails}>Listeye dön</Button>
                            {detailLoading ? <p role="status">Talep detayları yükleniyor...</p> : <div role="alert"><p>{detailError}</p><Button onClick={() => loadTicketDetails(requestedTicket)}>Tekrar dene</Button></div>}
                        </div>
                    ) : selectedTicket && !loading && !listError ? (
                        <>
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center">
                                    <Button variant="ghost" size="sm" onClick={closeDetails} className="md:hidden mr-2">←</Button>
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
                                        <Button size="sm" variant="outline" disabled={pending} onClick={() => handleStatusChange('CLOSED')} className="text-red-600 border-red-200 hover:bg-red-50">
                                            <XCircle className="h-4 w-4 mr-1" /> Talebi Kapat
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" disabled={pending} onClick={() => handleStatusChange('OPEN')} className="text-green-600 border-green-200 hover:bg-green-50">
                                            <CheckCircle className="h-4 w-4 mr-1" /> Tekrar Aç
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                {messages.length === 0 && <p>Bu talepte henüz mesaj bulunmuyor.</p>}
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
                                        disabled={pending}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Yanıtınız..."
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20"
                                    />
                                    <Button onClick={handleSendMessage} disabled={pending || !newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white h-20 px-6">
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
