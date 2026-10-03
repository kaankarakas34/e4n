import { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../shared/Button';
import { Plus, MessageSquare, Clock, CheckCircle, XCircle, Send, User, Shield } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { Modal } from '../shared/Modal';

interface Ticket {
    id: string;
    user_id: string;
    subject: string;
    status: 'OPEN' | 'ANSWERED' | 'CLOSED';
    created_at: string;
    updated_at: string;
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

    const [listError, setListError] = useState<string | null>(null);
    const [loadedFor, setLoadedFor] = useState<string | null>(null);
    const [requestedTicket, setRequestedTicket] = useState<string | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const context = `${user?.id}:${user?.role}`;
    const currentContext = useRef(context);
    currentContext.current = context;
    const active = useRef(true);
    const listSequence = useRef(0);
    const detailSequence = useRef(0);
    const detailTarget = useRef<string | null>(null);
    const isCurrentContext = () => active.current && currentContext.current === context && !!user?.id;
    const mutationLock = useRef<object | null>(null);
    const modalSequence = useRef(0);
    const [pendingFor, setPendingFor] = useState<string | null>(null);
    const [mutationNotice, setMutationNotice] = useState<{ context: string; text: string; error: boolean; ticketId?: string; modalVersion?: number } | null>(null);
    const pending = pendingFor === context;
    const renderedModalSequence = modalSequence.current;
    const renderedDetailSequence = detailSequence.current;

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        active.current = true;
        setSelectedTicket(null); setMessages([]); setNewMessage('');
        modalSequence.current++; setPendingFor(null); setMutationNotice(null);
        setShowNewTicketModal(false); setNewTicketSubject(''); setNewTicketMessage('');
        detailTarget.current = null; setRequestedTicket(null); setDetailLoading(false); setDetailError(null);
        if (user?.id) void loadTickets();
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
            if (!Array.isArray(data) || !data.every(ticket => isTicket(ticket) && (user?.role === 'ADMIN' || ticket.user_id === user?.id))) throw new Error('Invalid tickets response');
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

    const openNewTicket = () => {
        if (!isCurrentContext()) return;
        modalSequence.current++; setMutationNotice(null); setShowNewTicketModal(true);
    };
    const closeNewTicket = () => {
        modalSequence.current++; setMutationNotice(null); setShowNewTicketModal(false);
    };

    const runMutation = async (kind: 'create' | 'reply') => {
        if (!isCurrentContext() || mutationLock.current) return;
        if (kind === 'create' && (!showNewTicketModal || renderedModalSequence !== modalSequence.current
            || !newTicketSubject.trim() || !newTicketMessage.trim())) return;
        if (kind === 'reply' && (loading || listError || loadedFor !== context || detailLoading || detailError
            || !selectedTicket || selectedTicket.status === 'CLOSED' || detailTarget.current !== selectedTicket.id
            || renderedDetailSequence !== detailSequence.current || !newMessage.trim())) return;
        const ticketId = selectedTicket?.id;
        const detailVersion = detailSequence.current;
        const modalVersion = modalSequence.current;
        const token = {};
        mutationLock.current = token; setPendingFor(context); setMutationNotice(null);
        const isCurrent = () => isCurrentContext() && (kind === 'create' ? modalVersion === modalSequence.current
            : detailVersion === detailSequence.current && detailTarget.current === ticketId);
        try {
            const result = kind === 'create'
                ? await api.createTicket({ subject: newTicketSubject.trim(), message: newTicketMessage.trim() })
                : await api.replyTicket(ticketId!, newMessage.trim());
            if (!isCurrent()) return;
            if (kind === 'create' ? !isTicket(result) || result.user_id !== user?.id
                || result.subject !== newTicketSubject.trim() || result.status !== 'OPEN' : result?.success !== true) throw new Error('Unconfirmed mutation');
            if (kind === 'create') {
                setShowNewTicketModal(false); setNewTicketSubject(''); setNewTicketMessage('');
            } else setNewMessage('');
            setMutationNotice({ context, ticketId: kind === 'reply' ? ticketId : undefined, error: false,
                text: kind === 'create' ? 'Destek talebi oluşturuldu. Liste yenileme hatasında yalnızca tekrar yükleyin.'
                    : 'Yanıt kaydedildi. Yenileme hatasında yalnızca tekrar yükleyin.' });
            await Promise.all([loadTickets(), ...(kind === 'reply' ? [loadTicketDetails(ticketId!)] : [])]);
        } catch {
            if (isCurrent()) setMutationNotice({ context, ticketId: kind === 'reply' ? ticketId : undefined,
                modalVersion: kind === 'create' ? modalVersion : undefined, error: true,
                text: 'İşlem sonucu doğrulanamadı. Yeniden göndermeden önce talepleri tekrar yükleyip kontrol edin.' });
        } finally {
            if (mutationLock.current === token) {
                mutationLock.current = null;
                if (isCurrentContext()) setPendingFor(null);
            }
        }
    };
    const handleCreateTicket = () => runMutation('create');
    const handleSendMessage = () => runMutation('reply');
    const visibleNotice = mutationNotice?.context === context
        && (!mutationNotice.ticketId || mutationNotice.ticketId === requestedTicket)
        && (mutationNotice.modalVersion === undefined || (showNewTicketModal && mutationNotice.modalVersion === modalSequence.current));

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Açık</span>;
            case 'ANSWERED': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Cevaplandı</span>;
            case 'CLOSED': return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Kapalı</span>;
            default: return <span>Bilinmeyen durum</span>;
        }
    };

    if (!user?.id) return <p>Destek talepleri için giriş yapın.</p>;
    if (loadedFor !== context) return <p role="status">Destek talepleri yükleniyor...</p>;

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Destek Taleplerim</h1>
                    <p className="text-gray-500 text-sm">Sorun ve şikayetlerinizi buradan bildirebilirsiniz.</p>
                </div>
                <Button onClick={openNewTicket} className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Yeni Destek Talebi
                </Button>
            </div>

            {visibleNotice && mutationNotice && (
                <div role={mutationNotice.error ? 'alert' : 'status'} className="mb-3">
                    <p>{mutationNotice.text}</p>
                    {mutationNotice.error && <Button disabled={pending} onClick={() => loadTickets()}>Talepleri tekrar yükle</Button>}
                </div>
            )}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Ticket List */}
                <div className={`${requestedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-700">Talepler</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {listError ? (
                            <div role="alert" className="p-4"><p>{listError}</p><Button onClick={() => loadTickets()}>Tekrar dene</Button></div>
                        ) : loading ? (
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
                                    <Button variant="ghost" size="sm" onClick={closeDetails} className="md:hidden mr-2">
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
                                {messages.length === 0 && <p>Bu talepte henüz mesaj bulunmuyor.</p>}
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
                                            disabled={pending}
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
                                        <Button onClick={handleSendMessage} disabled={pending || !newMessage.trim()} className="bg-red-600 hover:bg-red-700 text-white h-20 px-6">
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
                onClose={closeNewTicket}
            >
                <div className="space-y-4">
                    {visibleNotice && mutationNotice?.error && mutationNotice.modalVersion !== undefined && <div role="alert"><p>{mutationNotice.text}</p><Button disabled={pending} onClick={() => loadTickets()}>Talepleri tekrar yükle</Button></div>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Örn: Ödeme Sorunu"
                            disabled={pending}
                            value={newTicketSubject}
                            onChange={(e) => setNewTicketSubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none"
                            placeholder="Sorununuzu detaylı bir şekilde açıklayınız..."
                            disabled={pending}
                            value={newTicketMessage}
                            onChange={(e) => setNewTicketMessage(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="ghost" onClick={closeNewTicket}>İptal</Button>
                        <Button disabled={pending || !newTicketSubject.trim() || !newTicketMessage.trim()} onClick={handleCreateTicket} className="bg-red-600 text-white">Gönder</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
