import React from 'react';
import { Stack } from 'expo-router';
import { useFlexIN } from '@/context/FlexINContext';
import UserDayRequestsScreen from '@/screens/UserDayRequestsScreen';
import AdminApprovalRequestsScreen from '@/screens/AdminApprovalRequestsScreen';

export default function DayRequestsScreen() {
  const { currentUser } = useFlexIN();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Solicitações',
        }}
      />
      {currentUser?.isAdmin ? <AdminApprovalRequestsScreen /> : <UserDayRequestsScreen />}
    </>
  );
}
