import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeftRight, Clock, Check, X } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';
import { useFlexIN } from '@/context/FlexINContext';
import { useToast } from '@/components/Toast';

export default function UserSwapRequestsScreen() {
  const { 
    currentUser, 
    users, 
    swapRequests, 
    respondToSwapRequest,
    cancelSwapRequest,
  } = useFlexIN();
  
  const { showToast } = useToast();

  console.log('=== USER SWAP REQUESTS SCREEN DEBUG ===');
  console.log('Current User:', currentUser?.id, currentUser?.name);
  console.log('All Swap Requests:', swapRequests.length, swapRequests);
  
  const mySwapRequests = swapRequests.filter(
    (r) => String(r.requesterId) === String(currentUser?.id) || String(r.targetUserId) === String(currentUser?.id)
  );
  
  console.log('My Swap Requests:', mySwapRequests.length, mySwapRequests);

  const pendingSwaps = mySwapRequests.filter(r => r.status === 'pending');
  const completedSwaps = mySwapRequests.filter(r => r.status !== 'pending');
  
  console.log('Pending Swaps:', pendingSwaps.length);
  console.log('Completed Swaps:', completedSwaps.length);
  console.log('=== END DEBUG ===');

  const handleSwapRespond = (requestId: string, approve: boolean) => {
    console.log('handleSwapRespond chamado:', { requestId, approve, currentUserId: currentUser?.id });
    const success = respondToSwapRequest(requestId, approve);
    console.log('Resultado da resposta:', success);
    if (success) {
      showToast({
        message: `Troca ${approve ? 'aceita' : 'recusada'} com sucesso!`,
        type: 'success',
      });
    } else {
      showToast({
        message: 'Não foi possível processar a solicitação.',
        type: 'error',
      });
    }
  };

  const handleCancelSwap = (requestId: string) => {
    console.log('handleCancelSwap chamado:', { requestId });
    const success = cancelSwapRequest(requestId);
    console.log('Resultado do cancelamento:', success);
    if (success) {
      showToast({
        message: 'Solicitação cancelada com sucesso!',
        type: 'success',
      });
    } else {
      showToast({
        message: 'Não foi possível cancelar a solicitação.',
        type: 'error',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} color="#FACC15" />;
      case 'approved':
        return <Check size={20} color="#22C55E" />;
      case 'rejected':
        return <X size={20} color="#EF4444" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge label="Pendente" variant="warning" />;
      case 'approved':
      case 'confirmed':
        return <Badge label="Aprovada" variant="success" />;
      case 'rejected':
        return <Badge label="Rejeitada" variant="error" />;
      default:
        return null;
    }
  };

  const renderSwapRequest = (request: any, isPending: boolean) => {
    const requester = users.find((u) => String(u.id) === String(request.requesterId));
    const target = users.find((u) => String(u.id) === String(request.targetUserId));
    const isRequester = String(request.requesterId) === String(currentUser?.id);
    
    if (!requester || !target) {
      console.log('Usuário não encontrado para solicitação:', request.id);
      return null;
    }

    return (
      <Card key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.avatarRow}>
            <Avatar name={requester.name} imageUrl={requester.avatar} size="md" />
            <ArrowLeftRight size={20} color={theme.colors.textSecondary} style={styles.arrowIcon} />
            <Avatar name={target.name} imageUrl={target.avatar} size="md" />
          </View>
          <View style={styles.statusContainer}>
            {getStatusIcon(request.status)}
            {getStatusBadge(request.status)}
          </View>
        </View>

        <View style={styles.requestDetails}>
          <Text style={styles.requestTitle}>
            {isRequester ? `Você → ${target.name}` : `${requester.name} → Você`}
          </Text>

          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{isRequester ? 'Seu dia' : 'Dia dele(a)'}</Text>
              <Text style={styles.dateValue}>
                {format(parseISO(request.requesterDate), "d 'de' MMM", { locale: ptBR })}
              </Text>
            </View>
            <ArrowLeftRight size={16} color={theme.colors.primary} />
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{isRequester ? 'Dia dele(a)' : 'Seu dia'}</Text>
              <Text style={styles.dateValue}>
                {format(parseISO(request.targetDate), "d 'de' MMM", { locale: ptBR })}
              </Text>
            </View>
          </View>

          {request.message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Mensagem:</Text>
              <Text style={styles.messageText}>{request.message}</Text>
            </View>
          )}
        </View>

        {isPending && (
          <>
            {!isRequester && (
              <View style={styles.actions}>
                <Button
                  title="Recusar"
                  onPress={() => handleSwapRespond(request.id, false)}
                  variant="outline"
                  size="sm"
                  style={styles.actionButton}
                />
                <Button
                  title="Aceitar"
                  onPress={() => handleSwapRespond(request.id, true)}
                  size="sm"
                  style={styles.actionButton}
                />
              </View>
            )}
            {isRequester && (
              <View style={styles.requesterActions}>
                <View style={styles.waitingContainer}>
                  <Clock size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.waitingText}>Aguardando resposta...</Text>
                </View>
                <Button
                  title="Cancelar solicitação"
                  onPress={() => handleCancelSwap(request.id)}
                  variant="ghost"
                  size="sm"
                  textStyle={{ color: theme.colors.error }}
                />
              </View>
            )}
          </>
        )}
      </Card>
    );
  };

  const hasAnyRequests = mySwapRequests.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!hasAnyRequests ? (
          <View style={styles.emptyState}>
            <ArrowLeftRight size={64} color={theme.colors.textLight} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Nenhuma solicitação</Text>
            <Text style={styles.emptyText}>
              Quando dias estiverem cheios, você poderá solicitar trocas com colegas
            </Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {pendingSwaps.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ArrowLeftRight size={20} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>Trocas Pendentes</Text>
                  <Badge label={String(pendingSwaps.length)} variant="warning" />
                </View>
                {pendingSwaps.map((request) => renderSwapRequest(request, true))}
              </View>
            )}

            {completedSwaps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Histórico</Text>
                {completedSwaps.map((request) => renderSwapRequest(request, false))}
              </View>
            )}
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowIcon: {
    marginHorizontal: theme.spacing.sm,
  },
  requestDetails: {
    marginBottom: theme.spacing.md,
  },
  requestTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  dateValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  messageContainer: {
    backgroundColor: `${theme.colors.info}10`,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info,
  },
  messageLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  requesterActions: {
    gap: theme.spacing.sm,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  waitingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
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
