import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { User, Booking, SwapRequest, AppSettings, DayCapacity, UserStats } from '@/types';
import { apiService } from '@/services/api';
import { format } from 'date-fns';

export const [FlexINContext, useFlexIN] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    maxBookingsPerDay: 3,
    maxBookingsPerWeekPerUser: 2,
    allowedDays: [1, 2, 3, 4, 5],
    requireApprovalForBookings: false,
    blockedDates: [],
    adminAnnouncement: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [usersData, bookingsData, swapRequestsData, settingsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getBookings(),
        apiService.getSwapRequests(),
        apiService.getSettings(),
      ]);

      setUsers(usersData);
      setBookings(bookingsData);
      setSwapRequests(swapRequestsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const user = await apiService.login(email, password);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const user = await apiService.signup(email, password, name);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const updateUser = useCallback(
    (updates: Partial<User>): boolean => {
      if (!currentUser) return false;

      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === currentUser.id ? updatedUser : u))
      );

      return true;
    },
    [currentUser]
  );

  const getUserWeekBookingsCount = useCallback(
    (userId: string, weekStart: Date): number => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      return bookings.filter((b) => {
        if (String(b.userId) !== String(userId)) return false;
        if (b.status !== 'confirmed') return false;

        const bookingDate = new Date(b.date.split('T')[0]); // Normalize date
        return bookingDate >= weekStart && bookingDate < weekEnd;
      }).length;
    },
    [bookings]
  );

  /**
   * CREATE BOOKING - (corrigido)
   */
  const createBooking = useCallback(
    async (date: Date): Promise<{ success: boolean; message?: string }> => {
      if (!currentUser) return { success: false, message: 'Usuário não autenticado' };

      const dateStr = format(date, 'yyyy-MM-dd');

      if (settings.blockedDates.includes(dateStr)) {
        return { success: false, message: 'Este dia está bloqueado pelo administrador' };
      }

      const dayBookings = bookings.filter((b) => {
        const bookingDateStr = b.date.split('T')[0];
        return bookingDateStr === dateStr && (b.status === 'confirmed' || b.status === 'pending');
      });

      console.log(`createBooking validation for ${dateStr}:`, {
        dayBookings: dayBookings.length,
        maxBookingsPerDay: settings.maxBookingsPerDay,
        willBlock: dayBookings.length >= settings.maxBookingsPerDay,
      });

      if (dayBookings.length >= settings.maxBookingsPerDay) {
        return { success: false, message: 'Dia cheio. Solicite uma troca com um colega.' };
      }

      const userHasBooking = dayBookings.some((b) => String(b.userId) === String(currentUser.id));
      if (userHasBooking) {
        return { success: false, message: 'Você já tem uma marcação neste dia' };
      }

      if (settings.maxBookingsPerWeekPerUser) {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);

        const userWeekBookings = getUserWeekBookingsCount(currentUser.id, weekStart);
        if (userWeekBookings >= settings.maxBookingsPerWeekPerUser) {
          return {
            success: false,
            message: `Você já atingiu o limite de ${settings.maxBookingsPerWeekPerUser} marcações por semana`,
          };
        }
      }

      try {
        const response = await apiService.createBooking({
          userId: currentUser.id,
          date: dateStr,
          status: settings.requireApprovalForBookings ? 'pending' : 'confirmed',
        });

        const newBooking: Booking = {
          id: String(response.id),
          userId: currentUser.id,
          date: dateStr,
          status: settings.requireApprovalForBookings ? 'pending' : 'confirmed',
          createdAt: new Date().toISOString(),
        };

        setBookings((prev) => [...prev, newBooking]);
        return { success: true };
      } catch (error) {
        console.error('Erro ao criar booking:', error);
        return { success: false, message: 'Erro ao criar marcação' };
      }
    },
    [currentUser, bookings, settings, getUserWeekBookingsCount]
  );

  /**
   * CANCEL BOOKING (função correta)
   */
  const cancelBooking = useCallback(
    (bookingId: string): boolean => {
      if (!currentUser) return false;

      let success = false;

      setBookings((prevBookings) => {
        const booking = prevBookings.find((b) => b.id === bookingId);
        if (!booking) return prevBookings;

        if (String(booking.userId) !== String(currentUser.id) && !currentUser.isAdmin) {
          return prevBookings;
        }

        apiService.cancelBooking(bookingId).catch(err => console.error(err));
        success = true;
        return prevBookings.filter((b) => b.id !== bookingId);
      });

      return success;
    },
    [currentUser]
  );

  /**
   * CREATE SWAP REQUEST
   */
  const createSwapRequest = useCallback(
    async (targetUserId: string, requesterDate: string, targetDate: string, message?: string): Promise<boolean> => {
      if (!currentUser) return false;

      try {
        const response = await apiService.createSwapRequest({
          requesterId: currentUser.id,
          targetUserId,
          requesterDate,
          targetDate,
          status: 'pending',
          message,
        });

        const newSwapRequest: SwapRequest = {
          id: String(response.id),
          requesterId: currentUser.id,
          targetUserId,
          requesterDate,
          targetDate,
          status: 'pending',
          message,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setSwapRequests((prev) => [...prev, newSwapRequest]);
        return true;
      } catch (error) {
        console.error('Erro ao criar solicitação de troca:', error);
        return false;
      }
    },
    [currentUser]
  );

  const cancelSwapRequest = useCallback(
    (requestId: string): boolean => {
      if (!currentUser) return false;

      let success = false;

      setSwapRequests((prevRequests) => {
        const request = prevRequests.find((r) => r.id === requestId);
        if (!request) return prevRequests;

        if (String(request.requesterId) !== String(currentUser.id)) {
          return prevRequests;
        }

        success = true;
        return prevRequests.filter((r) => r.id !== requestId);
      });

      apiService.cancelSwapRequest(requestId).catch(err => console.error(err));
      return success;
    },
    [currentUser]
  );

  const respondToSwapRequest = useCallback(
    (requestId: string, approve: boolean): boolean => {
      if (!currentUser) return false;

      let success = false;

      setSwapRequests((prevRequests) => {
        const request = prevRequests.find((r) => r.id === requestId);
        if (!request) return prevRequests;

        if (String(request.targetUserId) !== String(currentUser.id)) {
          return prevRequests;
        }

        success = true;

        if (approve) {
          setBookings((prevBookings) => {
            const requesterBooking = prevBookings.find(
              (b) => String(b.userId) === String(request.requesterId) && b.date === request.requesterDate
            );
            const targetBooking = prevBookings.find(
              (b) => String(b.userId) === String(request.targetUserId) && b.date === request.targetDate
            );

            if (!requesterBooking || !targetBooking) return prevBookings;

            return prevBookings.map((b) => {
              if (b.id === requesterBooking.id)
                return { ...b, date: request.targetDate };
              if (b.id === targetBooking.id)
                return { ...b, date: request.requesterDate };
              return b;
            });
          });
        }

        return prevRequests.map((r) =>
          r.id === requestId
            ? {
              ...r,
              status: approve ? 'approved' : 'rejected',
              updatedAt: new Date().toISOString(),
            }
            : r
        );
      });

      apiService.respondToSwapRequest(requestId, approve).catch(err => console.error(err));
      return success;
    },
    [currentUser]
  );


  const getDayCapacity = useCallback(
    (date: Date): DayCapacity => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayBookings = bookings.filter((b) => {
        // Normalize both dates to YYYY-MM-DD format
        const bookingDateStr = b.date.split('T')[0]; // Handle both '2025-11-17' and '2025-11-17T00:00:00.000Z'
        const match = bookingDateStr === dateStr && (b.status === 'confirmed' || b.status === 'pending');
        return match;
      });

      console.log(`getDayCapacity for ${dateStr}:`, {
        totalBookings: bookings.length,
        dayBookings: dayBookings.length,
        capacity: settings.maxBookingsPerDay,
        available: settings.maxBookingsPerDay - dayBookings.length,
      });

      return {
        date: dateStr,
        bookings: dayBookings,
        capacity: settings.maxBookingsPerDay,
        available: settings.maxBookingsPerDay - dayBookings.length,
      };
    },
    [bookings, settings.maxBookingsPerDay]
  );


  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      if (!currentUser?.isAdmin) return false;

      apiService.updateSettings(newSettings).catch(err => console.error(err));
      setSettings({ ...settings, ...newSettings });
      return true;
    },
    [currentUser, settings]
  );

  const getUserBookings = useCallback(
    (userId: string): Booking[] => {
      return bookings.filter((b) => String(b.userId) === String(userId));
    },
    [bookings]
  );

  const getPendingSwapRequests = useCallback((): SwapRequest[] => {
    if (!currentUser) return [];
    return swapRequests.filter(
      (r) =>
        r.status === 'pending' &&
        (String(r.requesterId) === String(currentUser.id) ||
          String(r.targetUserId) === String(currentUser.id))
    );
  }, [swapRequests, currentUser]);

  const blockDate = useCallback(
    async (date: string): Promise<boolean> => {
      if (!currentUser?.isAdmin) return false;

      try {
        await apiService.blockDate(date);
        setSettings({
          ...settings,
          blockedDates: [...settings.blockedDates, date],
        });
        return true;
      } catch (error) {
        console.error('Erro ao bloquear data:', error);
        return false;
      }
    },
    [currentUser, settings]
  );

  const unblockDate = useCallback(
    async (date: string): Promise<boolean> => {
      if (!currentUser?.isAdmin) return false;

      try {
        await apiService.unblockDate(date);
        setSettings({
          ...settings,
          blockedDates: settings.blockedDates.filter((d) => d !== date),
        });
        return true;
      } catch (error) {
        console.error('Erro ao desbloquear data:', error);
        return false;
      }
    },
    [currentUser, settings]
  );

  const setAnnouncement = useCallback(
    async (message: string): Promise<boolean> => {
      if (!currentUser?.isAdmin) return false;

      try {
        const response = await apiService.setAnnouncement(message);
        const newAnnouncement = {
          id: String(response.id),
          message,
          createdAt: new Date().toISOString(),
          active: true,
        };
        setSettings({ ...settings, adminAnnouncement: newAnnouncement });
        return true;
      } catch (error) {
        console.error('Erro ao definir aviso:', error);
        return false;
      }
    },
    [currentUser, settings]
  );

  const clearAnnouncement = useCallback(
    async (): Promise<boolean> => {
      if (!currentUser?.isAdmin) return false;

      try {
        await apiService.clearAnnouncement();
        setSettings({ ...settings, adminAnnouncement: undefined });
        return true;
      } catch (error) {
        console.error('Erro ao limpar aviso:', error);
        return false;
      }
    },
    [currentUser, settings]
  );

  const approveBooking = useCallback(
    (bookingId: string): boolean => {
      if (!currentUser?.isAdmin) return false;

      let success = false;

      setBookings((prevBookings) => {
        const booking = prevBookings.find((b) => b.id === bookingId);
        if (!booking) return prevBookings;

        success = true;
        return prevBookings.map((b) =>
          b.id === bookingId
            ? { ...b, status: 'confirmed', needsApproval: false }
            : b
        );
      });

      apiService.approveBooking(bookingId).catch(err => console.error(err));
      return success;
    },
    [currentUser]
  );

  const rejectBooking = useCallback(
    (bookingId: string): boolean => {
      if (!currentUser?.isAdmin) return false;

      let success = false;

      setBookings((prevBookings) => {
        const booking = prevBookings.find((b) => b.id === bookingId);
        if (!booking) return prevBookings;

        success = true;
        return prevBookings.filter((b) => b.id !== bookingId);
      });

      apiService.rejectBooking(bookingId).catch(err => console.error(err));
      return success;
    },
    [currentUser]
  );

  const getUserStats = useCallback(
    (userId: string): UserStats => {
      const userBookings = bookings.filter((b) => String(b.userId) === String(userId));
      const userSwapsRequested = swapRequests.filter((s) => String(s.requesterId) === String(userId));
      const userSwapsReceived = swapRequests.filter((s) => String(s.targetUserId) === String(userId));

      return {
        userId,
        totalBookings: userBookings.length,
        confirmedBookings: userBookings.filter((b) => b.status === 'confirmed').length,
        pendingBookings: userBookings.filter((b) => b.status === 'pending').length,
        cancelledBookings: userBookings.filter((b) => b.status === 'cancelled').length,
        swapsRequested: userSwapsRequested.length,
        swapsReceived: userSwapsReceived.length,
        swapsApproved: userSwapsRequested.filter((s) => s.status === 'approved').length,
        swapsRejected: userSwapsRequested.filter((s) => s.status === 'rejected').length,
      };
    },
    [bookings, swapRequests]
  );

  const getPendingBookings = useCallback((): Booking[] => {
    return bookings.filter((b) => b.status === 'pending');
  }, [bookings]);

  return useMemo(
    () => ({
      currentUser,
      users,
      bookings,
      swapRequests,
      settings,
      isLoading,
      login,
      signup,
      logout,
      updateUser,
      createBooking,
      cancelBooking,
      createSwapRequest,
      cancelSwapRequest,
      respondToSwapRequest,
      getDayCapacity,
      updateSettings,
      getUserBookings,
      getPendingSwapRequests,
      blockDate,
      unblockDate,
      setAnnouncement,
      clearAnnouncement,
      approveBooking,
      rejectBooking,
      getUserStats,
      getPendingBookings,
      getUserWeekBookingsCount,
    }),
    [
      currentUser,
      users,
      bookings,
      swapRequests,
      settings,
      isLoading,
      login,
      signup,
      logout,
      updateUser,
      createBooking,
      cancelBooking,
      createSwapRequest,
      cancelSwapRequest,
      respondToSwapRequest,
      getDayCapacity,
      updateSettings,
      getUserBookings,
      getPendingSwapRequests,
      blockDate,
      unblockDate,
      setAnnouncement,
      clearAnnouncement,
      approveBooking,
      rejectBooking,
      getUserStats,
      getPendingBookings,
      getUserWeekBookingsCount,
    ]
  );
});
