import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Button } from '../shared/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Send, User as UserIcon, MessageSquare } from 'lucide-react';

export function MessagesPage() {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        loadConversations();
    }, [user]);

    const loadConversations = async () => {
        if (!user?.id) return;
        try {
            const data = await api.getConversations(user.id);
            setConversations(data);
            if (data.length > 0 && !selectedFriend) {
                // Optionally select first
                // setSelectedFriend(data[0].friend);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadMessages = async (friendId: string) => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const msgs = await api.getMessages(user.id, friendId);
            setMessages(msgs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFriend = (friend: any) => {
        setSelectedFriend(friend);
        loadMessages(friend.id);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !selectedFriend) return;

        try {
            const sentMsg = await api.sendMessage(user.id, selectedFriend.id, newMessage);
            setMessages([...messages, sentMsg]);
            setNewMessage('');
            // Update conversation list sort order locally ideally
            loadConversations();
        } catch (error) {
            console.error(error);
        }
    };

    if (!user) return <div>Giriş yapmalısınız.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                {/* Conversation List */}
                <Card className="col-span-1 border-r border-gray-200 h-full flex flex-col">
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Mesajlar
                        </CardTitle>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">Henüz mesajınız yok.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {conversations.map((c) => (
                                    <li
                                        key={c.friend.id}
                                        onClick={() => handleSelectFriend(c.friend)}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedFriend?.id === c.friend.id ? 'bg-blue-50 border-l-4 border-l-indigo-500' : ''}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                {c.friend.profile_image ? (
                                                    <img src={c.friend.profile_image} alt="" className="h-10 w-10 rounded-full" />
                                                ) : (
                                                    <UserIcon className="h-6 w-6 text-gray-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{c.friend.full_name}</p>
                                                <p className="text-xs text-gray-500 truncate">{c.lastMessage?.content}</p>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {c.lastMessage ? new Date(c.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>

                {/* Chat Area */}
                <Card className="col-span-1 md:col-span-2 flex flex-col h-full border-l border-gray-200">
                    {selectedFriend ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm z-10">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <UserIcon className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{selectedFriend.full_name}</h3>
                                        <p className="text-xs text-gray-500">{selectedFriend.profession}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 bg-opacity-50">
                                {loading ? (
                                    <div className="text-center text-gray-400 mt-10">Yükleniyor...</div>
                                ) : (
                                    messages.map((m) => {
                                        const isMe = m.sender_id === user.id;
                                        return (
                                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] px-4 py-2 rounded-lg ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'}`}>
                                                    <p className="text-sm">{m.content}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t">
                                <form onSubmit={handleSendMessage} className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Mesajınızı yazın..."
                                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <Button type="submit" variant="primary" disabled={!newMessage.trim()} className="rounded-full px-4">
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare className="h-16 w-16 mb-4 text-gray-200" />
                            <p>Mesajlaşmak için bir kişi seçin.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
