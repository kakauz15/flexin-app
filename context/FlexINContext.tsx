import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { User, Booking, SwapRequest, AppSettings, DayCapacity, UserStats } from '@/types';
import { mockDataService, MOCK_SETTINGS } from '@/services/mockData';
import { format } from 'date-fns';

export const [FlexINContext, useFlexIN] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [settings, setSettings] = useState<AppSettings>(MOCK_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [usersData, bookingsData, swapRequestsData, settingsData] = await Promise.all([
        mockDataService.getUsers(),
        mockDataService.getBookings(),
        mockDataService.getSwapRequests(),
        mockDataService.getSettings(),
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
      const user = await mockDataService.login(email, password);
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
      const user = await mockDataService.signup(email, password, name);
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
    console.log('Logout called');
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
        
        const bookingDate = new Date(b.date);
        return bookingDate >= weekStart && bookingDate < weekEnd;
      }).length;
    },
    [bookings]
  );

  const createBooking = useCallback(
    (date: Date): { success: boolean; message?: string } => {
      if (!currentUser) return { success: false, message: 'Usuário não autenticado' };

      const dateStr = format(date, 'yyyy-MM-dd');
      
      if (settings.blockedDates.includes(dateStr)) {
        return { success: false, message: 'Este dia está bloqueado pelo administrador' };
      }

      const dayBookings = bookings.filter(
        (b) => b.date === dateStr && (b.status === 'confirmed' || b.status === 'pending')
      );

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

      const newBooking: Booking = {
        id: `b${Date.now()}`,
        userId: currentUser.id,
        date: dateStr,
        status: settings.requireApprovalForBookings ? 'pending' : 'confirmed',
        createdAt: new Date().toISOString(),
        needsApproval: settings.requireApprovalForBookings,
      };

      setBookings([...bookings, newBooking]);
      
      if (settings.requireApprovalForBookings) {
        return { success: true, message: 'Marcação enviada para aprovação do administrador' };
      }
      
      return { success: true };
    },
    [currentUser, bookings, settings, getUserWeekBookingsCount]
  );

  const cancelBooking = useCallback(
    (bookingId: string): boolean => {
      if (!currentUser) return false;
      
      let success = false;
      setBookings((prevBookings) => {
        const booking = prevBookings.find((b) => b.id === bookingId);
        if (!booking) {
          console.log('Booking não encontrada:', bookingId);
          return prevBookings;
        }
        
        if (String(booking.userId) !== String(currentUser.id) && !currentUser.isAdmin) {
          console.log('Usuário não autorizado a cancelar esta booking');
          return prevBookings;
        }

        console.log('Cancelando booking:', bookingId);
        success = true;
        return prevBookings.filter((b) => b.id !== bookingId);
      });
      return success;
    },
    [currentUser]
  );

  const createSwapRequest = useCallback(
    (targetUserId: string, requesterDate: string, targetDate: string, message?: string): boolean => {
      if (!currentUser) return false;

      const newSwapRequest: SwapRequest = {
        id: `s${Date.now()}`,
        requesterId: currentUser.id,
        targetUserId,
        requesterDate,
        targetDate,
        status: 'pending',
        message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSwapRequests([...swapRequests, newSwapRequest]);
      return true;
    },
    [currentUser, swapRequests]
  );

  const cancelSwapRequest = useCallback(
    (requestId: string): boolean => {
      if (!currentUser) {
        console.log('Usuário não autenticado');
        return false;
      }
      
      let success = false;
      
      setSwapRequests((prevRequests) => {
        const request = prevRequests.find((r) => r.id === requestId);
        if (!request) {
          console.log('Solicitação não encontrada:', requestId);
          return prevRequests;
        }
        
        if (String(request.requesterId) !== String(currentUser.id)) {
          console.log('Usuário não autorizado a cancelar esta solicitação');
          return prevRequests;
        }
        
        console.log('Cancelando solicitação:', requestId);
        success = true;
        return prevRequests.filter((r) => r.id !== requestId);
      });
      
      console.log('Solicitação cancelada com sucesso:', success);
      return success;
    },
    [currentUser]
  );

  const respondToSwapRequest = useCallback(
    (requestId: string, approve: boolean): boolean => {
      if (!currentUser) {
        console.log('Usuário não autenticado');
        return false;
      }
      
      let success = false;
      
      setSwapRequests((prevRequests) => {
        const request = prevRequests.find((r) => r.id === requestId);
        if (!request) {
          console.log('Solicitação não encontrada:', requestId);
          return prevRequests;
        }
        
        if (String(request.targetUserId) !== String(currentUser.id)) {
          console.log('Usuário não autorizado a responder esta solicitação');
          return prevRequests;
        }
        
        console.log('Respondendo à solicitação:', requestId, 'Aprovar:', approve);
        success = true;

        if (approve) {
          setBookings((prevBookings) => {
            const requesterBooking = prevBookings.find(
              (b) => String(b.userId) === String(request.requesterId) && b.date === request.requesterDate
            );
            const targetBooking = prevBookings.find(
              (b) => String(b.userId) === String(request.targetUserId) && b.date === request.targetDate
            );

            if (requesterBooking && targetBooking) {
              console.log('Trocando bookings:', requesterBooking.id, targetBooking.id);
              return prevBookings.map((b) => {
                if (b.id === requesterBooking.id) {
                  return { ...b, date: request.targetDate };
                }
                if (b.id === targetBooking.id) {
                  return { ...b, date: request.requesterDate };
                }
                return b;
              });
            } else {
              console.log('Bookings não encontradas para troca');
              return prevBookings;
            }
          });
        }

        return prevRequests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: approve ? ('approved' as const) : ('rejected' as const),
                updatedAt: new Date().toISOString(),
              }
            : r
        );
      });
      
      console.log('Solicitação respondida com sucesso:', success);
      return success;
    },
    [currentUser]
  );

  const getDayCapacity = useCallback(
    (date: Date): DayCapacity => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayBookings = bookings.filter((b) => b.date === dateStr && (b.status === 'confirmed' || b.status === 'pending'));

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
      (r) => r.status === 'pending' && (String(r.requesterId) === String(currentUser.id) || String(r.targetUserId) === String(currentUser.id))
    );
  }, [swapRequests, currentUser]);

  const blockDate = useCallback(
    async (date: string): Promise<boolean> => {
      if (!currentUser?.isAdmin) return false;
      
      try {
        await mockDataService.blockDate(date);
        setSettings({ ...settings, blockedDates: [...settings.blockedDates, date] });
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
        await mockDataService.unblockDate(date);
        setSettings({ ...settings, blockedDates: settings.blockedDates.filter((d) => d !== date) });
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
        await mockDataService.setAnnouncement(message);
        const newAnnouncement = {
          id: `a${Date.now()}`,
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
        await mockDataService.clearAnnouncement();
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
      if (!currentUser?.isAdmin) {
        console.log('Usuário não é admin');
        return false;
      }
      
      console.log('Aprovando booking:', bookingId);
      let success = false;
      
      setBookings((prevBookings) => {
        const booking = prevBookings.find((b) => b.id === bookingId);
        if (!booking) {
          console.log('Booking não encontrada:', bookingId);
          return prevBookings;
        }
        
        console.log('Booking encontrada, atualizando status');
        success = true;
        return prevBookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'confirmed' as const, needsApproval: false } : b
        );
      });
      
      console.log('Resultado da aprovação:', success);
      return success;
    },
    [currentUser]
  );

  const rejectBooking = useCallback(
    (bookingId: string): boolean => {
      if (!currentUser?.isAdmin) {
        console.log('Usuário não é admin');
        return false;
      }
      
      console.log('Rejeitando booking:', bookingId);
      let success = false;
      
      setBookings((prevBookings) => {
        const booking = prevBookings.find((b) => b.id === bookingId);
        if (!booking) {
          console.log('Booking não encontrada:', bookingId);
          return prevBookings;
        }
        
        console.log('Booking encontrada, removendo');
        success = true;
        return prevBookings.filter((b) => b.id !== bookingId);
      });
      
      console.log('Resultado da rejeição:', success);
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
