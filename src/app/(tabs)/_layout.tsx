import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '@/constants';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Заметки',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
