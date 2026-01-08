import { create } from 'zustand';
import { api } from '../api/api';

interface NotificationState {
    notifications: any[];
    unreadCount: number;
    isLoading: boolean;

    // Actions
    fetchNotifications: (userId: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    addNotification: (notification: any) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async (userId: string) => {
        set({ isLoading: true });
        try {
            const data = await api.getNotifications(userId);
            set({
                notifications: data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
                unreadCount: data.filter((n: any) => !n.is_read).length,
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
            const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
            set({
                notifications: updated,
                unreadCount: updated.filter(n => !n.is_read).length
            });
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    },

    addNotification: (notification: any) => {
        const { notifications } = get();
        set({
            notifications: [notification, ...notifications],
            unreadCount: get().unreadCount + 1
        });
    }
}));
