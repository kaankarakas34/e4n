import { create } from 'zustand';
import { api } from '../api/api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    created_at: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;

    // Actions
    fetchNotifications: (userId: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async (userId: string) => {
        set({ isLoading: true });
        try {
            const data: Notification[] = await api.getNotifications(userId);
            set({
                notifications: data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
                unreadCount: data.filter(n => !n.read).length,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            set({ isLoading: false });
        }
    },

    markAsRead: async (id: string) => {
        try {
            await api.markNotificationRead(id);
            const { notifications } = get();
            const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
            set({
                notifications: updated,
                unreadCount: updated.filter(n => !n.read).length
            });
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    },

    addNotification: (notification: any) => {
        const { notifications } = get();
        set({
            notifications: [notification, ...notifications],
            unreadCount: get().unreadCount + (notification.read ? 0 : 1)
        });
    }
}));
