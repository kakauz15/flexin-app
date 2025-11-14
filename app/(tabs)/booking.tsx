import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { startOfWeek, addDays, format, isSameDay, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Users, Lock, AlertCircle, X } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { useFlexIN } from '@/context/FlexINContext';
import { useToast } from '@/components/Toast';

export default function BookingScreen() {
  const { currentUser, users, getDayCapacity, createBooking, cancelBooking, settings, createSwapRequest } = useFlexIN();
  const { showToast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(startOfToday(), { weekStartsOn: 1 }));
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string | null>(null);
  const [swapJustification, setSwapJustification] = useState('');

  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleDayPress = (date: Date) => {
    if (!currentUser) {
      console.log('Usuário não autenticado');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const isBlocked = settings.blockedDates.includes(dateStr);

    if (isBlocked) {
      showToast({
        message: 'Este dia foi reservado pelo administrador.',
        type: 'warning',
      });
      return;
    }

    const dayCapacity = getDayCapacity(date);
    const userBooking = dayCapacity.bookings.find((b) => b.userId === currentUser.id);
    
    console.log('handleDayPress:', {
      date: dateStr,
      userId: currentUser.id,
      userBooking: userBooking ? userBooking.id : 'nenhuma',
      totalBookings: dayCapacity.bookings.length
    });

    if (userBooking) {
      console.log('Tentando cancelar booking:', userBooking.id);
      const success = cancelBooking(userBooking.id);
      console.log('Resultado do cancelamento:', success);
      if (success) {
        showToast({
          message: 'Marcação cancelada com sucesso!',
          type: 'success',
        });
      } else {
        showToast({
          message: 'Não foi possível cancelar a marcação.',
          type: 'error',
        });
      }
    } else {
      console.log('Criando nova booking para:', dateStr);
      const result = createBooking(date);
      console.log('Resultado da criação:', result);
      if (result.success) {
        showToast({
          message: result.message || 'Dia marcado com sucesso!',
          type: result.message ? 'info' : 'success',
        });
      } else {
        if (dayCapacity.available === 0 && dayCapacity.bookings.length > 0) {
          setSelectedDate(date);
          setShowSwapModal(true);
        } else {
          showToast({
            message: result.message || 'Não foi possível marcar este dia.',
            type: 'error',
          });
        }
      }
    }
  };

  const handleSwapRequest = () => {
    if (!currentUser || !selectedDate || !selectedTargetUserId) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const success = createSwapRequest(selectedTargetUserId, dateStr, dateStr, swapJustification);
    
    if (success) {
      showToast({
        message: 'Solicitação de troca enviada com sucesso!',
        type: 'success',
      });
      setShowSwapModal(false);
      setSelectedDate(null);
      setSelectedTargetUserId(null);
      setSwapJustification('');
    } else {
      showToast({
        message: 'Não foi possível enviar a solicitação de troca.',
        type: 'error',
      });
    }
  };

  const handleCloseSwapModal = () => {
    setShowSwapModal(false);
    setSelectedDate(null);
    setSelectedTargetUserId(null);
    setSwapJustification('');
  };

  const renderDayCard = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isBlocked = settings.blockedDates.includes(dateStr);
    const dayCapacity = getDayCapacity(date);
    const isToday = isSameDay(date, startOfToday());
    const userHasBooking = dayCapacity.bookings.some((b) => b.userId === currentUser?.id);
    const bookedUsers = dayCapacity.bookings.map((b) => users.find((u) => u.id === b.userId)).filter(Boolean);

    const capacityPercentage = (dayCapacity.bookings.length / dayCapacity.capacity) * 100;
    const isFull = dayCapacity.available === 0;

    return (
      <TouchableOpacity key={date.toISOString()} onPress={() => handleDayPress(date)} activeOpacity={0.7}>
        <Card
          style={[
            styles.dayCard,
            isToday && styles.todayCard,
            userHasBooking && styles.bookedCard,
            isBlocked && styles.blockedCard,
          ]}
        >
          <View style={styles.dayHeader}>
            <View>
              <Text style={styles.dayName}>{format(date, 'EEE', { locale: ptBR })}</Text>
              <Text style={[styles.dayNumber, isToday && styles.todayText]}>{format(date, 'd')}</Text>
            </View>
            <View style={styles.capacityBadge}>
              <Users size={14} color={isFull ? theme.colors.error : theme.colors.textSecondary} />
              <Text style={[styles.capacityText, isFull && styles.fullText]}>
                {dayCapacity.bookings.length}/{dayCapacity.capacity}
              </Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${capacityPercentage}%`,
                  backgroundColor: isFull ? theme.colors.error : theme.colors.primary,
                },
              ]}
            />
          </View>

          {bookedUsers.length > 0 && (
            <View style={styles.avatarList}>
              {bookedUsers.slice(0, 3).map((user) => (
                <View key={user!.id} style={styles.avatarWrapper}>
                  <Avatar name={user!.name} imageUrl={user!.avatar} size="sm" />
                </View>
              ))}
              {bookedUsers.length > 3 && (
                <View style={styles.moreAvatar}>
                  <Text style={styles.moreText}>+{bookedUsers.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          {isBlocked && (
            <View style={styles.blockedBadge}>
              <Lock size={14} color={theme.colors.error} />
              <Text style={styles.blockedText}>Bloqueado</Text>
            </View>
          )}
          {!isBlocked && userHasBooking && <Text style={styles.yourBookingText}>✓ Você marcou</Text>}
          {!isBlocked && !userHasBooking && dayCapacity.available > 0 && (
            <Text style={styles.availableText}>{dayCapacity.available} vaga(s) disponível</Text>
          )}
          {!isBlocked && !userHasBooking && isFull && <Text style={styles.fullTextLabel}>Dia cheio</Text>}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSwapModal = () => {
    if (!selectedDate) return null;

    const dayCapacity = getDayCapacity(selectedDate);
    const bookedUsers = dayCapacity.bookings
      .map((b) => users.find((u) => u.id === b.userId))
      .filter((u) => u && u.id !== currentUser?.id);

    return (
      <Modal visible={showSwapModal} animationType="slide" transparent onRequestClose={handleCloseSwapModal}>
        <View style={styles.swapModalOverlay}>
          <View style={styles.swapModalContent}>
            <View style={styles.swapModalHeader}>
              <Text style={styles.swapModalTitle}>Solicitar Troca</Text>
              <TouchableOpacity onPress={handleCloseSwapModal} style={styles.closeButton}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.swapModalSubtitle}>
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </Text>

            <Text style={styles.swapModalLabel}>Escolha com quem deseja trocar:</Text>

            <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
              {bookedUsers.map((user) => {
                if (!user) return null;
                const isSelected = selectedTargetUserId === user.id;
                return (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => setSelectedTargetUserId(user.id)}
                    style={[styles.userItem, isSelected && styles.userItemSelected]}
                  >
                    <Avatar name={user.name} imageUrl={user.avatar} size="md" />
                    <View style={styles.userItemInfo}>
                      <Text style={styles.userItemName}>{user.name}</Text>
                      <Text style={styles.userItemDept}>{user.department}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.swapModalLabel}>Justificativa (opcional):</Text>
            <TextInput
              style={styles.justificationInput}
              placeholder="Ex: Tenho compromisso médico neste dia..."
              value={swapJustification}
              onChangeText={setSwapJustification}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Solicitar troca"
              onPress={handleSwapRequest}
              fullWidth
              disabled={!selectedTargetUserId}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Marcar dias',
          headerLargeTitle: false,
        }}
      />
      <View style={styles.container}>
        <View style={styles.weekNavigator}>
          <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
            <ChevronLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{format(currentWeekStart, "'Semana de' d 'de' MMMM", { locale: ptBR })}</Text>
          <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
            <ChevronRight size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {settings.adminAnnouncement?.active && (
            <Card style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <AlertCircle size={20} color={theme.colors.info} />
                <Text style={styles.announcementTitle}>Aviso</Text>
              </View>
              <Text style={styles.announcementText}>{settings.adminAnnouncement.message}</Text>
            </Card>
          )}

          <View style={styles.daysContainer}>{weekDays.map(renderDayCard)}</View>

          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Como funciona?</Text>
            <Text style={styles.infoText}>• Limite de {settings.maxBookingsPerDay} pessoas por dia</Text>
            {settings.maxBookingsPerWeekPerUser && (
              <Text style={styles.infoText}>
                • Limite de {settings.maxBookingsPerWeekPerUser} marcações por semana
              </Text>
            )}
            {settings.requireApprovalForBookings && (
              <Text style={styles.infoText}>• Todas as marcações precisam de aprovação</Text>
            )}
            <Text style={styles.infoText}>• Toque em um dia para marcar ou cancelar</Text>
            <Text style={styles.infoText}>• Se o dia estiver cheio, solicite uma troca</Text>
          </Card>
        </ScrollView>
      </View>
      {renderSwapModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  navButton: {
    padding: theme.spacing.sm,
  },
  weekLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  daysContainer: {
    gap: theme.spacing.md,
  },
  dayCard: {
    marginBottom: 0,
  },
  todayCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  bookedCard: {
    backgroundColor: `${theme.colors.primary}08`,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  dayName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  dayNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  todayText: {
    color: theme.colors.primary,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  capacityText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  fullText: {
    color: theme.colors.error,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 2,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  avatarList: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    gap: -8,
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
  },
  moreAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  moreText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  yourBookingText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  availableText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  fullTextLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.error,
  },
  infoCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: `${theme.colors.info}10`,
    borderColor: theme.colors.info,
  },
  infoTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  blockedCard: {
    backgroundColor: `${theme.colors.error}08`,
    borderColor: theme.colors.error,
    borderWidth: 1,
    opacity: 0.7,
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  blockedText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.error,
  },
  announcementCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: `${theme.colors.info}10`,
    borderColor: theme.colors.info,
    borderWidth: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  announcementTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.info,
  },
  announcementText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  swapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  swapModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    maxHeight: '85%',
  },
  swapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  swapModalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapModalSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textTransform: 'capitalize',
  },
  swapModalLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  userList: {
    maxHeight: 250,
    marginBottom: theme.spacing.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  userItemSelected: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  userItemInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  userItemName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  userItemDept: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  justificationInput: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    minHeight: 80,
    marginBottom: theme.spacing.lg,
    textAlignVertical: 'top',
  },
});
