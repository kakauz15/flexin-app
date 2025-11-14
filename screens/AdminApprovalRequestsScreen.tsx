import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { useFlexIN } from '@/context/FlexINContext';
import { useToast } from '@/components/Toast';

export default function AdminApprovalRequestsScreen() {
  const { 
    users, 
    approveBooking, 
    rejectBooking,
    getPendingBookings,
    settings,
  } = useFlexIN();
  
  const { showToast } = useToast();

  const pendingBookings = getPendingBookings();

  console.log('=== ADMIN APPROVAL REQUESTS SCREEN DEBUG ===');
  console.log('Pending Bookings:', pendingBookings.length, pendingBookings);
  console.log('Require Approval Setting:', settings.requireApprovalForBookings);
  console.log('=== END DEBUG ===');

  const handleBookingRespond = (bookingId: string, approve: boolean) => {
    console.log('handleBookingRespond chamado:', { bookingId, approve });
    const success = approve ? approveBooking(bookingId) : rejectBooking(bookingId);
    console.log('Resultado da resposta:', success);
    if (success) {
      showToast({
        message: `Marcação ${approve ? 'aprovada' : 'rejeitada'} com sucesso!`,
        type: 'success',
      });
    } else {
      showToast({
        message: 'Não foi possível processar a marcação.',
        type: 'error',
      });
    }
  };

  const renderBookingRequest = (booking: any) => {
    const user = users.find((u) => String(u.id) === String(booking.userId));
    if (!user) {
      console.log('Usuário não encontrado para booking:', booking.id);
      return null;
    }

    return (
      <Card key={booking.id} style={styles.requestCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingUserRow}>
            <Avatar name={user.name} imageUrl={user.avatar} size="md" />
            <View style={styles.bookingUserInfo}>
              <Text style={styles.bookingUserName}>{user.name}</Text>
              <View style={styles.bookingDateRow}>
                <Calendar size={14} color={theme.colors.textSecondary} />
                <Text style={styles.bookingDate}>
                  {format(parseISO(booking.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <Clock size={20} color="#FACC15" />
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Rejeitar"
            onPress={() => handleBookingRespond(booking.id, false)}
            variant="outline"
            size="sm"
            style={styles.actionButton}
          />
          <Button
            title="Aprovar"
            onPress={() => handleBookingRespond(booking.id, true)}
            size="sm"
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  if (!settings.requireApprovalForBookings) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <CheckCircle2 size={64} color={theme.colors.success} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Aprovação automática ativa</Text>
          <Text style={styles.emptyText}>
            As marcações estão sendo aprovadas automaticamente. Ative a opção &ldquo;Exigir aprovação para marcação&rdquo; nas configurações para gerenciar solicitações manualmente.
          </Text>
        </View>
      </View>
    );
  }

  const hasRequests = pendingBookings.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!hasRequests ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={theme.colors.textLight} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Nenhuma solicitação pendente</Text>
            <Text style={styles.emptyText}>
              Quando os usuários solicitarem marcações, elas aparecerão aqui para aprovação.
            </Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Solicitações de Marcação</Text>
                <Badge label={String(pendingBookings.length)} variant="warning" />
              </View>
              {pendingBookings.map(renderBookingRequest)}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
  requestsList: {
    gap: theme.spacing.md,
  },
  requestCard: {
    marginBottom: theme.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  bookingUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  bookingUserInfo: {
    flex: 1,
  },
  bookingUserName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  bookingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  bookingDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
