import { Tabs } from 'expo-router';
import { Calendar, ArrowLeftRight, BarChart3, User, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { theme } from '@/constants/theme';
import { useFlexIN } from '@/context/FlexINContext';

export default function TabLayout() {
  const { currentUser } = useFlexIN();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.borderLight,
        },
        headerStyle: {
          backgroundColor: theme.colors.white,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: theme.fontWeight.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Marcar',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="swaps"
        options={{
          title: 'Trocas',
          tabBarIcon: ({ color, size }) => <ArrowLeftRight color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      {currentUser?.isAdmin ? (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
          }}
        />
      ) : null}
    </Tabs>
  );
}
