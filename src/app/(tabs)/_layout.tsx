import { useTheme } from '@/context/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest,
          borderTopColor: colors.outlineVariant,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'INÍCIO',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="metrics"
        options={{
          title: 'MÉTRICAS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals-reminders"
        options={{
          title: 'METAS E LEMBRETES',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notifications-active" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress-photos"
        options={{
          title: 'FOTOS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="image-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'RECEITAS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'PERFIL',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
