import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { theme } from '@/constants/theme';
import createContextHook from '@nkzw/create-context-hook';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
  ToastContainer: React.ComponentType;
}

export const [ToastProvider, useToast] = createContextHook<ToastContextValue>(() => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setConfig(null);
    });
  }, [fadeAnim]);

  const showToast = useCallback(
    ({ message, type, duration = 3000 }: ToastConfig) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setConfig({ message, type, duration });
      setVisible(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [fadeAnim, hideToast]
  );

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#22C55E', color: '#FFFFFF' };
      case 'error':
        return { backgroundColor: '#EF4444', color: '#FFFFFF' };
      case 'warning':
        return { backgroundColor: '#FACC15', color: '#000000' };
      case 'info':
        return { backgroundColor: '#D1D5DB', color: '#000000' };
      default:
        return { backgroundColor: '#D1D5DB', color: '#000000' };
    }
  };

  const ToastContainer = useCallback(() => {
      if (!visible || !config) return null;

      const toastStyle = getToastStyle(config.type);

      return (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: toastStyle.backgroundColor }]}>
            <Text style={[styles.toastText, { color: toastStyle.color }]}>{config.message}</Text>
          </View>
        </Animated.View>
      );
  }, [visible, config, fadeAnim]);

  return React.useMemo(() => ({
    showToast,
    ToastContainer,
  }), [showToast, ToastContainer]);
});

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 100,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 600,
    width: '100%',
  },
  toastText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium as any,
    textAlign: 'center',
  },
});
