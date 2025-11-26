import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta tela não existe.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Voltar ao início</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  link: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  linkText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
  },
});
