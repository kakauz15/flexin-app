import React from 'react';
import { Stack } from 'expo-router';
import { useFlexIN } from '@/context/FlexINContext';
import UserSwapRequestsScreen from '@/screens/UserSwapRequestsScreen';
import AdminApprovalRequestsScreen from '@/screens/AdminApprovalRequestsScreen';

export default function SwapRequestsScreen() {
  const { currentUser } = useFlexIN();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Solicitações',
        }}
      />
      {currentUser?.isAdmin ? <AdminApprovalRequestsScreen /> : <UserSwapRequestsScreen />}
    </>
  );
}
