import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { User, Settings, X } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { theme } from '@/constants/theme';
import { useFlexIN } from '@/context/FlexINContext';
import { useToast } from '@/components/Toast';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentUser, logout, getUserBookings, updateUser } = useFlexIN();
  const { showToast } = useToast();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const handleEditProfile = () => {
    if (!currentUser) return;
    setEditName(currentUser.name);
    setEditEmail(currentUser.email);
    setEditPassword('');
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      showToast({
        message: 'Nome e email são obrigatórios',
        type: 'error',
      });
      return;
    }

    const success = updateUser({
      name: editName,
      email: editEmail,
    });

    if (success) {
      showToast({
        message: 'Perfil atualizado com sucesso',
        type: 'success',
      });
      setShowEditModal(false);
    } else {
      showToast({
        message: 'Erro ao atualizar perfil',
        type: 'error',
      });
    }
  };

  const handleLogout = () => {
    console.log('Logout button pressed');
    logout();
    showToast({
      message: 'Você saiu da sua conta',
      type: 'info',
    });
    router.replace('/' as any);
  };

  if (!currentUser) {
    return null;
  }

  const userBookings = getUserBookings(currentUser.id);
  const confirmedBookings = userBookings.filter((b) => b.status === 'confirmed').length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Perfil',
        }}
      />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Avatar name={currentUser.name} imageUrl={currentUser.avatar} size="lg" />
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>{currentUser.name}</Text>
                  {currentUser.isAdmin && <Badge label="Admin" variant="info" size="sm" />}
                </View>
                <Text style={styles.profileEmail}>{currentUser.email}</Text>
                <Text style={styles.profileDepartment}>{currentUser.department}</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Minhas Estatísticas</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Marcações confirmadas:</Text>
              <Text style={styles.statsValue}>{confirmedBookings}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Marcações pendentes:</Text>
              <Text style={styles.statsValue}>{userBookings.filter((b) => b.status === 'pending').length}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total de marcações:</Text>
              <Text style={styles.statsValue}>{userBookings.length}</Text>
            </View>
          </Card>

          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <View style={styles.menuIconContainer}>
                <User size={20} color={theme.colors.text} />
              </View>
              <Text style={styles.menuText}>Editar perfil</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Settings size={20} color={theme.colors.text} />
              </View>
              <Text style={styles.menuText}>Configurações</Text>
            </TouchableOpacity>
          </Card>

          <Button
            title="Sair da conta"
            onPress={handleLogout}
            variant="outline"
            fullWidth
            style={styles.logoutButton}
            textStyle={{ color: theme.colors.error }}
          />

          <Text style={styles.version}>FlexIN v1.0.0</Text>
        </ScrollView>

        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Perfil</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Seu nome"
                    placeholderTextColor={theme.colors.textLight}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="seu@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={theme.colors.textLight}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Senha (deixe em branco para não alterar)</Text>
                  <TextInput
                    style={styles.input}
                    value={editPassword}
                    onChangeText={setEditPassword}
                    placeholder="••••••••"
                    secureTextEntry
                    placeholderTextColor={theme.colors.textLight}
                  />
                </View>

                <View style={styles.modalActions}>
                  <Button
                    title="Cancelar"
                    onPress={() => setShowEditModal(false)}
                    variant="outline"
                    style={styles.modalButton}
                  />
                  <Button
                    title="Salvar alterações"
                    onPress={handleSaveProfile}
                    style={styles.modalButton}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
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
  profileCard: {
    marginBottom: theme.spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  profileName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  profileEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  profileDepartment: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: `${theme.colors.primary}05`,
  },
  statsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statsLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  statsValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  menuCard: {
    marginBottom: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginVertical: theme.spacing.sm,
  },
  logoutButton: {
    borderColor: theme.colors.error,
    marginBottom: theme.spacing.lg,
  },
  version: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 500,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  formContainer: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    gap: theme.spacing.xs,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
