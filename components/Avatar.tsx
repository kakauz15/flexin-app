import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, size = 'md' }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.avatar, styles[`avatar_${size}`]]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={[styles.image, styles[`image_${size}`]]} />
      ) : (
        <Text style={[styles.initials, styles[`initials_${size}`]]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar_sm: {
    width: 32,
    height: 32,
  },
  avatar_md: {
    width: 48,
    height: 48,
  },
  avatar_lg: {
    width: 64,
    height: 64,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  image_sm: {
    width: 32,
    height: 32,
  },
  image_md: {
    width: 48,
    height: 48,
  },
  image_lg: {
    width: 64,
    height: 64,
  },
  initials: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
  },
  initials_sm: {
    fontSize: 14,
  },
  initials_md: {
    fontSize: 18,
  },
  initials_lg: {
    fontSize: 24,
  },
});
