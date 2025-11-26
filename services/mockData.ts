// import { User, Booking, SwapRequest, AppSettings } from '@/types';
// import { addDays, startOfWeek, format } from 'date-fns';

// export const MOCK_USERS: User[] = [
//   {
//     id: '1',
//     name: 'Ana Silva',
//     email: 'ana.silva@company.com',
//     avatar: 'https://i.pravatar.cc/150?img=1',
//     isAdmin: true,
//     department: 'Engenharia',
//   },
//   {
//     id: '2',
//     name: 'Carlos Santos',
//     email: 'carlos.santos@company.com',
//     avatar: 'https://i.pravatar.cc/150?img=12',
//     isAdmin: false,
//     department: 'Produto',
//   },
//   {
//     id: '3',
//     name: 'Marina Costa',
//     email: 'marina.costa@company.com',
//     avatar: 'https://i.pravatar.cc/150?img=5',
//     isAdmin: false,
//     department: 'Design',
//   },
//   {
//     id: '4',
//     name: 'Pedro Alves',
//     email: 'pedro.alves@company.com',
//     avatar: 'https://i.pravatar.cc/150?img=13',
//     isAdmin: false,
//     department: 'Engenharia',
//   },
//   {
//     id: '5',
//     name: 'Julia Ferreira',
//     email: 'julia.ferreira@company.com',
//     avatar: 'https://i.pravatar.cc/150?img=9',
//     isAdmin: false,
//     department: 'Marketing',
//   },
// ];

// const today = new Date();
// const weekStart = startOfWeek(today, { weekStartsOn: 1 });

// export const MOCK_BOOKINGS: Booking[] = [
//   {
//     id: 'b1',
//     userId: '1',
//     date: format(addDays(weekStart, 0), 'yyyy-MM-dd'),
//     status: 'confirmed',
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: 'b2',
//     userId: '2',
//     date: format(addDays(weekStart, 0), 'yyyy-MM-dd'),
//     status: 'confirmed',
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: 'b3',
//     userId: '3',
//     date: format(addDays(weekStart, 2), 'yyyy-MM-dd'),
//     status: 'confirmed',
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: 'b4',
//     userId: '4',
//     date: format(addDays(weekStart, 2), 'yyyy-MM-dd'),
//     status: 'confirmed',
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: 'b5',
//     userId: '5',
//     date: format(addDays(weekStart, 2), 'yyyy-MM-dd'),
//     status: 'confirmed',
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: 'b6',
//     userId: '1',
//     date: format(addDays(weekStart, 4), 'yyyy-MM-dd'),
//     status: 'confirmed',
//     createdAt: new Date().toISOString(),
//   },
// ];

// export const MOCK_SWAP_REQUESTS: SwapRequest[] = [
//   {
//     id: 's1',
//     requesterId: '2',
//     targetUserId: '1',
//     requesterDate: format(addDays(weekStart, 0), 'yyyy-MM-dd'),
//     targetDate: format(addDays(weekStart, 4), 'yyyy-MM-dd'),
//     status: 'pending',
//     message: 'Preciso trocar por compromisso médico',
//     createdAt: new Date(Date.now() - 86400000).toISOString(),
//     updatedAt: new Date(Date.now() - 86400000).toISOString(),
//   },
//   {
//     id: 's2',
//     requesterId: '3',
//     targetUserId: '4',
//     requesterDate: format(addDays(weekStart, 2), 'yyyy-MM-dd'),
//     targetDate: format(addDays(weekStart, 1), 'yyyy-MM-dd'),
//     status: 'pending',
//     message: 'Reunião presencial agendada',
//     createdAt: new Date(Date.now() - 172800000).toISOString(),
//     updatedAt: new Date(Date.now() - 172800000).toISOString(),
//   },
// ];

// export const MOCK_SETTINGS: AppSettings = {
//   maxBookingsPerDay: 3,
//   maxBookingsPerWeekPerUser: 2,
//   allowedDays: [1, 2, 3, 4, 5],
//   requireApprovalForBookings: false,
//   blockedDates: [],
//   adminAnnouncement: undefined,
// };

// export const mockDataService = {
//   getUsers: async (): Promise<User[]> => {
//     await new Promise((resolve) => setTimeout(resolve, 300));
//     return MOCK_USERS;
//   },

//   getUserById: async (userId: string): Promise<User | undefined> => {
//     await new Promise((resolve) => setTimeout(resolve, 100));
//     return MOCK_USERS.find((u) => u.id === userId);
//   },

//   getBookings: async (): Promise<Booking[]> => {
//     await new Promise((resolve) => setTimeout(resolve, 300));
//     return MOCK_BOOKINGS;
//   },

//   getSwapRequests: async (): Promise<SwapRequest[]> => {
//     await new Promise((resolve) => setTimeout(resolve, 300));
//     return MOCK_SWAP_REQUESTS;
//   },

//   getSettings: async (): Promise<AppSettings> => {
//     await new Promise((resolve) => setTimeout(resolve, 100));
//     return MOCK_SETTINGS;
//   },

//   login: async (email: string, password: string): Promise<User> => {
//     await new Promise((resolve) => setTimeout(resolve, 500));
//     const user = MOCK_USERS.find((u) => u.email === email);
//     if (!user) {
//       throw new Error('Usuário não encontrado');
//     }
//     return user;
//   },

//   signup: async (email: string, password: string, name: string): Promise<User> => {
//     await new Promise((resolve) => setTimeout(resolve, 500));
//     const newUser: User = {
//       id: String(MOCK_USERS.length + 1),
//       email,
//       name,
//       isAdmin: false,
//       department: 'Geral',
//     };
//     MOCK_USERS.push(newUser);
//     return newUser;
//   },

//   blockDate: async (date: string): Promise<void> => {
//     await new Promise((resolve) => setTimeout(resolve, 100));
//     if (!MOCK_SETTINGS.blockedDates.includes(date)) {
//       MOCK_SETTINGS.blockedDates.push(date);
//     }
//   },

//   unblockDate: async (date: string): Promise<void> => {
//     await new Promise((resolve) => setTimeout(resolve, 100));
//     MOCK_SETTINGS.blockedDates = MOCK_SETTINGS.blockedDates.filter((d) => d !== date);
//   },

//   setAnnouncement: async (message: string): Promise<void> => {
//     await new Promise((resolve) => setTimeout(resolve, 100));
//     MOCK_SETTINGS.adminAnnouncement = {
//       id: `a${Date.now()}`,
//       message,
//       createdAt: new Date().toISOString(),
//       active: true,
//     };
//   },

//   clearAnnouncement: async (): Promise<void> => {
//     await new Promise((resolve) => setTimeout(resolve, 100));
//     MOCK_SETTINGS.adminAnnouncement = undefined;
//   },
// };
