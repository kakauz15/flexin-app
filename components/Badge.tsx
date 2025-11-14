import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', size = 'md', style, textStyle }) => {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`badge_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${size}`], textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  badge_success: {
    backgroundColor: `${theme.colors.success}20`,
  },
  badge_warning: {
    backgroundColor: `${theme.colors.warning}20`,
  },
  badge_error: {
    backgroundColor: `${theme.colors.error}20`,
  },
  badge_info: {
    backgroundColor: `${theme.colors.info}20`,
  },
  badge_default: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  badge_sm: {
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
  },
  badge_md: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  text: {
    fontWeight: theme.fontWeight.medium,
  },
  text_sm: {
    fontSize: theme.fontSize.xs,
  },
  text_md: {
    fontSize: theme.fontSize.sm,
  },
});
