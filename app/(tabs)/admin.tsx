import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Settings,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  BarChart3,
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { theme } from '@/constants/theme';
import { useFlexIN } from '@/context/FlexINContext';
import { useToast } from '@/components/Toast';

export default function AdminPanelScreen() {
  const {
    currentUser,
    users,
    settings,
    updateSettings,
    getPendingBookings,
    approveBooking,
    rejectBooking,
    blockDate,
    unblockDate,
    setAnnouncement,
    clearAnnouncement,
    getUserStats,
    bookings,
  } = useFlexIN();
  
  const { showToast } = useToast();

  const [maxCapacity, setMaxCapacity] = useState(String(settings.maxBookingsPerDay));
  const [maxWeeklyPerUser, setMaxWeeklyPerUser] = useState(String(settings.maxBookingsPerWeekPerUser || 2));
  const [requireApproval, setRequireApproval] = useState(settings.requireApprovalForBookings);
  const [announcementText, setAnnouncementText] = useState('');
  const [selectedUserStats, setSelectedUserStats] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedDateToBlock, setSelectedDateToBlock] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pendingBookings = getPendingBookings();

  if (!currentUser?.isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Acesso negado. Apenas administradores podem acessar esta página.</Text>
      </View>
    );
  }

  const handleUpdateCapacity = () => {
    const newValue = parseInt(maxCapacity, 10);
    if (isNaN(newValue) || newValue < 1 || newValue > 10) {
      showToast({
        message: 'Digite um número válido entre 1 e 10',
        type: 'error',
      });
      return;
    }

    const success = updateSettings({ maxBookingsPerDay: newValue });
    if (success) {
      showToast({
        message: 'Limite diário atualizado!',
        type: 'success',
      });
    } else {
      showToast({
        message: 'Não foi possível atualizar configurações',
        type: 'error',
      });
    }
  };

  const handleUpdateWeeklyLimit = () => {
    const newValue = parseInt(maxWeeklyPerUser, 10);
    if (isNaN(newValue) || newValue < 1 || newValue > 5) {
      showToast({
        message: 'Digite um número válido entre 1 e 5',
        type: 'error',
      });
      return;
    }

    const success = updateSettings({ maxBookingsPerWeekPerUser: newValue });
    if (success) {
      showToast({
        message: 'Limite semanal atualizado!',
        type: 'success',
      });
    }
  };

  const handleToggleApproval = (value: boolean) => {
    setRequireApproval(value);
    const success = updateSettings({ requireApprovalForBookings: value });
    if (success) {
      showToast({
        message: value ? 'Aprovação obrigatória ativada' : 'Aprovação obrigatória desativada',
        type: 'success',
      });
    }
  };

  const handleApproveBooking = (bookingId: string) => {
    const success = approveBooking(bookingId);
    if (success) {
      showToast({
        message: 'Marcação aprovada!',
        type: 'success',
      });
    }
  };

  const handleRejectBooking = (bookingId: string) => {
    const success = rejectBooking(bookingId);
    if (success) {
      showToast({
        message: 'Marcação rejeitada',
        type: 'success',
      });
    }
  };

  const handleBlockDate = async () => {
    const dateStr = format(selectedDateToBlock, 'yyyy-MM-dd');
    
    if (settings.blockedDates.includes(dateStr)) {
      showToast({
        message: 'Esta data já está bloqueada',
        type: 'warning',
      });
      return;
    }

    const success = await blockDate(dateStr);
    if (success) {
      showToast({
        message: `Data ${format(selectedDateToBlock, "d 'de' MMMM 'de' yyyy", { locale: ptBR })} bloqueada!`,
        type: 'success',
      });
      setShowDatePicker(false);
    } else {
      showToast({
        message: 'Não foi possível bloquear a data',
        type: 'error',
      });
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDateToBlock(date);
      if (Platform.OS === 'ios') {
        
      }
    }
  };

  const handleUnblockDate = async (date: string) => {
    const success = await unblockDate(date);
    if (success) {
      showToast({
        message: `Data ${date} desbloqueada!`,
        type: 'success',
      });
    }
  };

  const handleSetAnnouncement = async () => {
    if (!announcementText.trim()) {
      showToast({
        message: 'Digite uma mensagem para o aviso',
        type: 'error',
      });
      return;
    }

    const success = await setAnnouncement(announcementText);
    if (success) {
      showToast({
        message: 'Aviso publicado!',
        type: 'success',
      });
      setAnnouncementText('');
    }
  };

  const handleClearAnnouncement = async () => {
    const success = await clearAnnouncement();
    if (success) {
      showToast({
        message: 'Aviso removido',
        type: 'success',
      });
    }
  };

  const handleShowUserStats = (userId: string) => {
    setSelectedUserStats(userId);
    setShowStatsModal(true);
  };

  const renderUserStats = () => {
    if (!selectedUserStats) return null;

    const user = users.find((u) => u.id === selectedUserStats);
    const stats = getUserStats(selectedUserStats);

    if (!user) return null;

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    
    const currentWeekBookings = bookings.filter((b) => {
      if (b.userId !== selectedUserStats) return false;
      if (b.status !== 'confirmed') return false;
      
      const bookingDate = new Date(b.date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      return bookingDate >= weekStart && bookingDate < weekEnd;
    });

    const weekDays = Array.from({ length: 5 }).map((_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });

    return (
      <Modal visible={showStatsModal} animationType="slide" transparent onRequestClose={() => setShowStatsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Avatar name={user.name} imageUrl={user.avatar} size="lg" />
              <View style={styles.modalUserInfo}>
                <Text style={styles.modalUserName}>{user.name}</Text>
                <Text style={styles.modalUserEmail}>{user.email}</Text>
                <Text style={styles.modalUserDept}>{user.department}</Text>
              </View>
            </View>

            <ScrollView style={styles.statsScroll}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.confirmedBookings}</Text>
                  <Text style={styles.statLabel}>Confirmadas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.pendingBookings}</Text>
                  <Text style={styles.statLabel}>Pendentes</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.cancelledBookings}</Text>
                  <Text style={styles.statLabel}>Canceladas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.swapsRequested}</Text>
                  <Text style={styles.statLabel}>Trocas solicitadas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.swapsApproved}</Text>
                  <Text style={styles.statLabel}>Trocas aprovadas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.swapsRejected}</Text>
                  <Text style={styles.statLabel}>Trocas rejeitadas</Text>
                </View>
              </View>

              <View style={styles.weekSection}>
                <Text style={styles.weekTitle}>Semana Atual</Text>
                <Text style={styles.weekSubtitle}>
                  {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekDays[4], "d 'de' MMMM", { locale: ptBR })}
                </Text>
                {weekDays.map((date, index) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const hasBooking = currentWeekBookings.some((b) => b.date === dateStr);
                  return (
                    <View key={`week-day-${selectedUserStats}-${dateStr}-${index}`} style={styles.weekDayItem}>
                      <Text style={styles.weekDayName}>
                        {format(date, "EEEE (dd/MM)", { locale: ptBR })}
                      </Text>
                      <View style={[styles.weekDayBadge, hasBooking ? styles.weekDayHome : styles.weekDayOffice]}>
                        <Text style={[styles.weekDayBadgeText, hasBooking ? styles.weekDayHomeText : styles.weekDayOfficeText]}>
                          {hasBooking ? 'Home' : 'Escritório'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <Button title="Fechar" onPress={() => setShowStatsModal(false)} fullWidth style={styles.closeStatsButton} />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Painel Admin',
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Settings size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Configurações de Regras</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Limite diário</Text>
                <Text style={styles.settingDescription}>Pessoas por dia</Text>
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={maxCapacity}
                  onChangeText={setMaxCapacity}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Button title="Salvar" onPress={handleUpdateCapacity} size="sm" />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Limite semanal por usuário</Text>
                <Text style={styles.settingDescription}>Marcações por semana</Text>
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={maxWeeklyPerUser}
                  onChangeText={setMaxWeeklyPerUser}
                  keyboardType="number-pad"
                  maxLength={1}
                />
                <Button title="Salvar" onPress={handleUpdateWeeklyLimit} size="sm" />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Exigir aprovação</Text>
                <Text style={styles.settingDescription}>Todas marcações precisam aprovação</Text>
              </View>
              <Switch
                value={requireApproval}
                onValueChange={handleToggleApproval}
                trackColor={{ false: theme.colors.borderLight, true: theme.colors.primary }}
                thumbColor={theme.colors.white}
              />
            </View>
          </Card>

          {pendingBookings.length > 0 && (
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <CheckCircle size={20} color={theme.colors.warning} />
                <Text style={styles.sectionTitle}>Marcações Pendentes ({pendingBookings.length})</Text>
              </View>

              {pendingBookings.map((booking) => {
                const user = users.find((u) => u.id === booking.userId);
                if (!user) return null;

                return (
                  <View key={booking.id} style={styles.pendingItem}>
                    <View style={styles.pendingUser}>
                      <Avatar name={user.name} imageUrl={user.avatar} size="sm" />
                      <View style={styles.pendingInfo}>
                        <Text style={styles.pendingName}>{user.name}</Text>
                        <Text style={styles.pendingDate}>{format(new Date(booking.date), "d 'de' MMMM", { locale: ptBR })}</Text>
                      </View>
                    </View>
                    <View style={styles.pendingActions}>
                      <TouchableOpacity onPress={() => handleApproveBooking(booking.id)} style={styles.approveButton}>
                        <CheckCircle size={20} color={theme.colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRejectBooking(booking.id)} style={styles.rejectButton}>
                        <XCircle size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Bloquear Dias</Text>
            </View>

            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color={theme.colors.primary} />
                <Text style={styles.datePickerButtonText}>
                  {format(selectedDateToBlock, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Text>
              </TouchableOpacity>
              <Button title="Bloquear" onPress={handleBlockDate} size="sm" />
            </View>

            {showDatePicker && (
              Platform.OS === 'ios' ? (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.datePickerModalOverlay}>
                    <View style={styles.datePickerModalContent}>
                      <View style={styles.datePickerModalHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.datePickerModalCancel}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={styles.datePickerModalTitle}>Escolher Data</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                          <Text style={styles.datePickerModalDone}>Pronto</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={selectedDateToBlock}
                        mode="date"
                        display="spinner"
                        onChange={onDateChange}
                        locale="pt-BR"
                        textColor={theme.colors.text}
                      />
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={selectedDateToBlock}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  locale="pt-BR"
                />
              )
            )}

            {settings.blockedDates.length > 0 && (
              <>
                <Text style={styles.blockedLabel}>Dias bloqueados:</Text>
                {settings.blockedDates.map((date, index) => (
                  <View key={`blocked-date-${date}-${index}`} style={styles.blockedDateItem}>
                    <View style={styles.blockedDateInfo}>
                      <Lock size={16} color={theme.colors.error} />
                      <Text style={styles.blockedDateText}>{format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleUnblockDate(date)} style={styles.unlockButton}>
                      <Unlock size={18} color={theme.colors.success} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </Card>

          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MessageSquare size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Aviso para Equipe</Text>
            </View>

            {settings.adminAnnouncement?.active && (
              <View style={styles.currentAnnouncement}>
                <Text style={styles.currentAnnouncementLabel}>Aviso atual:</Text>
                <Text style={styles.currentAnnouncementText}>{settings.adminAnnouncement.message}</Text>
                <Button title="Remover aviso" onPress={handleClearAnnouncement} variant="outline" size="sm" />
              </View>
            )}

            <TextInput
              style={styles.announcementInput}
              placeholder="Digite uma mensagem para toda equipe..."
              value={announcementText}
              onChangeText={setAnnouncementText}
              multiline
              numberOfLines={3}
            />
            <Button title="Publicar aviso" onPress={handleSetAnnouncement} fullWidth style={styles.publishButton} />
          </Card>

          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Estatísticas de Usuários</Text>
            </View>

            {users.map((user) => {
              const stats = getUserStats(user.id);
              return (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => handleShowUserStats(user.id)}
                  style={styles.userStatsItem}
                >
                  <View style={styles.userStatsLeft}>
                    <Avatar name={user.name} imageUrl={user.avatar} size="sm" />
                    <View style={styles.userStatsInfo}>
                      <View style={styles.userStatsNameRow}>
                        <Text style={styles.userStatsName}>{user.name}</Text>
                        {user.isAdmin && <Badge label="Admin" variant="info" size="sm" />}
                      </View>
                      <Text style={styles.userStatsDept}>{user.department}</Text>
                    </View>
                  </View>
                  <View style={styles.userStatsRight}>
                    <Text style={styles.userStatsCount}>{stats.confirmedBookings}</Text>
                    <Text style={styles.userStatsLabel}>confirmadas</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo Geral</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de usuários:</Text>
              <Text style={styles.summaryValue}>{users.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de marcações:</Text>
              <Text style={styles.summaryValue}>{bookings.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Marcações pendentes:</Text>
              <Text style={styles.summaryValue}>{pendingBookings.length}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
      {renderUserStats()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.error,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    width: 60,
    height: 40,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.md,
  },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  pendingUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  pendingDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  approveButton: {
    width: 40,
    height: 40,
    backgroundColor: `${theme.colors.success}15`,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    backgroundColor: `${theme.colors.error}15`,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  datePickerButton: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  datePickerButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.xl,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  datePickerModalCancel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.error,
  },
  datePickerModalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  datePickerModalDone: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  blockedLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  blockedDateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  blockedDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  blockedDateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  unlockButton: {
    width: 36,
    height: 36,
    backgroundColor: `${theme.colors.success}15`,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentAnnouncement: {
    backgroundColor: `${theme.colors.info}10`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  currentAnnouncementLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.info,
    marginBottom: theme.spacing.xs,
  },
  currentAnnouncementText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  announcementInput: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    minHeight: 80,
    marginBottom: theme.spacing.md,
    textAlignVertical: 'top',
  },
  publishButton: {
    marginTop: theme.spacing.sm,
  },
  userStatsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  userStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  userStatsInfo: {
    flex: 1,
  },
  userStatsNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  userStatsName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  userStatsDept: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  userStatsRight: {
    alignItems: 'center',
  },
  userStatsCount: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  userStatsLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: `${theme.colors.primary}10`,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  summaryTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  summaryValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  modalUserEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  modalUserDept: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  statsScroll: {
    maxHeight: 400,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: theme.spacing.md,
  },
  weekSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  weekTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  weekSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'capitalize',
  },
  weekDayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  weekDayName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  weekDayBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  weekDayHome: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  weekDayOffice: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  weekDayBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  weekDayHomeText: {
    color: theme.colors.primary,
  },
  weekDayOfficeText: {
    color: theme.colors.textSecondary,
  },
  closeStatsButton: {
    marginTop: theme.spacing.md,
  },
});
