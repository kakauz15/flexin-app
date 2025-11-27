import { User, Booking, SwapRequest, AppSettings, AdminAnnouncement } from '@/types';
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

// Mappers
const mapUser = (data: any): User => ({
    id: String(data.id),
    name: data.name,
    email: data.email,
    avatar: data.avatarUrl || data.avatar, // Map avatarUrl to avatar
    isAdmin: data.isAdmin !== undefined ? !!data.isAdmin : !!data.is_admin, // Map is_admin to isAdmin, handling both cases
    department: data.departmentName || data.department || 'Geral', // Map departmentName to department
});

const mapBooking = (data: any): Booking => ({
    id: String(data.id),
    userId: String(data.user_id), // Map user_id to userId
    date: data.date,
    status: data.status,
    createdAt: data.created_at, // Map created_at to createdAt
    needsApproval: data.needs_approval, // Map needs_approval to needsApproval
});

const mapSwapRequest = (data: any): SwapRequest => ({
    id: String(data.id),
    requesterId: String(data.requester_id), // Map requester_id
    targetUserId: String(data.target_user_id), // Map target_user_id
    requesterDate: data.requester_date, // Map requester_date
    targetDate: data.target_date, // Map target_date
    status: data.status,
    message: data.message,
    createdAt: data.created_at, // Map created_at
    updatedAt: data.updated_at, // Map updated_at
});

const mapAnnouncement = (data: any): AdminAnnouncement => ({
    id: String(data.id),
    message: data.message,
    createdAt: data.created_at, // Map created_at
    active: !!data.active,
});

export const apiService = {
    getUsers: async (): Promise<User[]> => {
        const data = await fetchApi('/users');
        return data.map(mapUser);
    },

    getUserById: async (userId: string): Promise<User | undefined> => {
        try {
            const data = await fetchApi(`/users/${userId}`);
            return mapUser(data);
        } catch (e) {
            return undefined;
        }
    },

    getBookings: async (): Promise<Booking[]> => {
        const data = await fetchApi('/bookings');
        return data.map(mapBooking);
    },

    createBooking: async (data: Partial<Booking>): Promise<{ id: number; message: string }> => {
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
        const data = await fetchApi('/swap-requests');
        return data.map(mapSwapRequest);
    },

    createSwapRequest: async (data: Partial<SwapRequest>): Promise<{ id: number; message: string }> => {
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
        const data = await fetchApi('/settings');
        return {
            maxBookingsPerDay: data.maxBookingsPerDay ?? data.max_bookings_per_day ?? 3,
            maxBookingsPerWeekPerUser: data.maxBookingsPerWeekPerUser ?? data.max_bookings_per_week_per_user ?? 2,
            allowedDays: data.allowedDays ?? data.allowed_days ?? [1, 2, 3, 4, 5],
            requireApprovalForBookings: data.requireApprovalForBookings !== undefined ? !!data.requireApprovalForBookings : !!data.require_approval_for_bookings,
            blockedDates: data.blockedDates ?? data.blocked_dates ?? [],
            adminAnnouncement: (data.adminAnnouncement || data.admin_announcement) ? mapAnnouncement(data.adminAnnouncement || data.admin_announcement) : undefined,
        };
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
        return mapUser(data.user);
    },

    signup: async (email: string, password: string, name: string): Promise<User> => {
        const data = await fetchApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        // Auto login after signup? Or just return user?
        // Based on mock, it returns user.
        return { id: String(data.userId), email, name, isAdmin: false, department: 'Geral' } as User;
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

    setAnnouncement: async (message: string): Promise<{ id: number; message: string }> => {
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
