import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Stack } from 'expo-router';
import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, format, setMonth, setYear, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Home, Building2, TrendingUp, ArrowLeftRight, Clock, CheckCircle } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';
import { useFlexIN } from '@/context/FlexINContext';

export default function ReportScreen() {
  const { currentUser, getUserBookings, getUserStats } = useFlexIN();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  let currentMonth = new Date();
  currentMonth = setMonth(currentMonth, selectedMonth);
  currentMonth = setYear(currentMonth, selectedYear);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const workDaysInMonth = daysInMonth.filter((day) => !isWeekend(day)).length;

  const userBookings = getUserBookings(currentUser?.id || '');
  const monthBookings = userBookings.filter((b) => {
    const bookingDate = parseISO(b.date);
    return bookingDate >= monthStart && bookingDate <= monthEnd && b.status === 'confirmed';
  });

  const pendingBookings = userBookings.filter((b) => {
    const bookingDate = parseISO(b.date);
    return bookingDate >= monthStart && bookingDate <= monthEnd && b.status === 'pending';
  });

  const userStats = getUserStats(currentUser?.id || '');

  const homeOfficeDays = monthBookings.length;
  const officeDays = workDaysInMonth - homeOfficeDays;
  const percentage = workDaysInMonth > 0 ? Math.round((homeOfficeDays / workDaysInMonth) * 100) : 0;

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statContent}>
        <Icon size={32} color={color} strokeWidth={1.5} />
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Relatórios',
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.filterContainer}>
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Mês</Text>
              <View style={styles.pickerBorder}>
                <Picker
                  selectedValue={selectedMonth}
                  onValueChange={(value: number) => setSelectedMonth(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Janeiro" value={0} />
                  <Picker.Item label="Fevereiro" value={1} />
                  <Picker.Item label="Março" value={2} />
                  <Picker.Item label="Abril" value={3} />
                  <Picker.Item label="Maio" value={4} />
                  <Picker.Item label="Junho" value={5} />
                  <Picker.Item label="Julho" value={6} />
                  <Picker.Item label="Agosto" value={7} />
                  <Picker.Item label="Setembro" value={8} />
                  <Picker.Item label="Outubro" value={9} />
                  <Picker.Item label="Novembro" value={10} />
                  <Picker.Item label="Dezembro" value={11} />
                </Picker>
              </View>
            </View>

            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Ano</Text>
              <View style={styles.pickerBorder}>
                <Picker
                  selectedValue={selectedYear}
                  onValueChange={(value: number) => setSelectedYear(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="2023" value={2023} />
                  <Picker.Item label="2024" value={2024} />
                  <Picker.Item label="2025" value={2025} />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.monthHeader}>
            <Calendar size={24} color={theme.colors.primary} />
            <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard icon={Home} label="Home Office" value={homeOfficeDays} color={theme.colors.primary} />
            <StatCard icon={Building2} label="Escritório" value={officeDays} color={theme.colors.info} />
            <StatCard icon={Clock} label="Pendentes" value={pendingBookings.length} color={theme.colors.warning} />
            <StatCard icon={CheckCircle} label="Confirmadas" value={userStats.confirmedBookings} color={theme.colors.success} />
          </View>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <TrendingUp size={20} color={theme.colors.success} />
              <Text style={styles.summaryTitle}>Resumo do mês</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{percentage}% dos dias em home office</Text>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total de dias úteis</Text>
                <Text style={styles.summaryValue}>{workDaysInMonth}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Dias marcados</Text>
                <Text style={styles.summaryValue}>{homeOfficeDays}</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.swapsCard}>
            <View style={styles.swapsHeader}>
              <ArrowLeftRight size={20} color={theme.colors.primary} />
              <Text style={styles.swapsTitle}>Histórico de Trocas</Text>
            </View>

            <View style={styles.swapsStats}>
              <View style={styles.swapsStat}>
                <Text style={styles.swapsStatValue}>{userStats.swapsRequested}</Text>
                <Text style={styles.swapsStatLabel}>Solicitadas</Text>
              </View>
              <View style={styles.swapsStatDivider} />
              <View style={styles.swapsStat}>
                <Text style={[styles.swapsStatValue, { color: theme.colors.success }]}>{userStats.swapsApproved}</Text>
                <Text style={styles.swapsStatLabel}>Aprovadas</Text>
              </View>
              <View style={styles.swapsStatDivider} />
              <View style={styles.swapsStat}>
                <Text style={[styles.swapsStatValue, { color: theme.colors.error }]}>{userStats.swapsRejected}</Text>
                <Text style={styles.swapsStatLabel}>Rejeitadas</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Dica</Text>
            <Text style={styles.tipText}>
              Manter um equilíbrio entre home office e escritório ajuda na produtividade e colaboração com a equipe.
            </Text>
          </Card>
        </ScrollView>
      </View>
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
  filterContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  pickerBorder: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  monthTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  statsGrid: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    marginBottom: 0,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    marginBottom: theme.spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.borderLight,
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  tipCard: {
    backgroundColor: `${theme.colors.warning}10`,
    borderColor: theme.colors.warning,
  },
  tipTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  swapsCard: {
    marginBottom: theme.spacing.lg,
  },
  swapsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  swapsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  swapsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  swapsStat: {
    flex: 1,
    alignItems: 'center',
  },
  swapsStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.borderLight,
  },
  swapsStatValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  swapsStatLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
