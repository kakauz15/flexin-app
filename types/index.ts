export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
  department: string;
}

export interface Booking {
  id: string;
  userId: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  needsApproval?: boolean;
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  targetUserId: string;
  requesterDate: string;
  targetDate: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  maxBookingsPerDay: number;
  maxBookingsPerWeekPerUser?: number;
  allowedDays: number[];
  requireApprovalForBookings: boolean;
  blockedDates: string[];
  adminAnnouncement?: AdminAnnouncement;
}

export interface AdminAnnouncement {
  id: string;
  message: string;
  createdAt: string;
  active: boolean;
}

export interface DayCapacity {
  date: string;
  bookings: Booking[];
  capacity: number;
  available: number;
}

export interface MonthlyReport {
  month: string;
  totalDays: number;
  homeOfficeDays: number;
  officeDays: number;
  swapsMade: number;
  swapsReceived: number;
}

export interface UserStats {
  userId: string;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  swapsRequested: number;
  swapsReceived: number;
  swapsApproved: number;
  swapsRejected: number;
}

export type AuthMode = 'login' | 'signup';

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}
