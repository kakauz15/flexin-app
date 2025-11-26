import { User, Booking, SwapRequest, AppSettings } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return response.json();
};

export const apiService = {
    getUsers: async (): Promise<User[]> => {
        return fetchApi('/users');
    },

    getUserById: async (userId: string): Promise<User | undefined> => {
        try {
            return await fetchApi(`/users/${userId}`);
        } catch (e) {
            return undefined;
        }
    },

    getBookings: async (): Promise<Booking[]> => {
        return fetchApi('/bookings');
    },

    createBooking: async (data: Partial<Booking>): Promise<void> => {
        return fetchApi('/bookings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    cancelBooking: async (id: string): Promise<void> => {
        return fetchApi(`/bookings/${id}`, {
            method: 'DELETE',
        });
    },

    approveBooking: async (id: string): Promise<void> => {
        return fetchApi(`/bookings/${id}/approve`, {
            method: 'PATCH',
        });
    },

    rejectBooking: async (id: string): Promise<void> => {
        return fetchApi(`/bookings/${id}/reject`, {
            method: 'PATCH',
        });
    },

    getSwapRequests: async (): Promise<SwapRequest[]> => {
        return fetchApi('/swap-requests');
    },

    createSwapRequest: async (data: Partial<SwapRequest>): Promise<void> => {
        return fetchApi('/swap-requests', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    cancelSwapRequest: async (id: string): Promise<void> => {
        return fetchApi(`/swap-requests/${id}`, {
            method: 'DELETE',
        });
    },

    respondToSwapRequest: async (id: string, approve: boolean): Promise<void> => {
        return fetchApi(`/swap-requests/${id}/respond`, {
            method: 'PATCH',
            body: JSON.stringify({ approve }),
        });
    },

    getSettings: async (): Promise<AppSettings> => {
        return fetchApi('/settings');
    },

    updateSettings: async (settings: Partial<AppSettings>): Promise<void> => {
        return fetchApi('/settings', {
            method: 'PATCH',
            body: JSON.stringify(settings),
        });
    },

    login: async (email: string, password: string): Promise<User> => {
        const data = await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        await AsyncStorage.setItem('token', data.token);
        return data.user;
    },

    signup: async (email: string, password: string, name: string): Promise<User> => {
        const data = await fetchApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        // Auto login after signup? Or just return user?
        // Based on mock, it returns user.
        return { id: data.userId, email, name, isAdmin: false, department: 'Geral' } as User;
    },

    blockDate: async (date: string): Promise<void> => {
        return fetchApi('/settings/blocked-dates', {
            method: 'POST',
            body: JSON.stringify({ date }),
        });
    },

    unblockDate: async (date: string): Promise<void> => {
        return fetchApi(`/settings/blocked-dates/${date}`, {
            method: 'DELETE',
        });
    },

    setAnnouncement: async (message: string): Promise<void> => {
        return fetchApi('/settings/announcements', {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
    },

    clearAnnouncement: async (): Promise<void> => {
        return fetchApi('/settings/announcements', {
            method: 'DELETE',
        });
    },
};
