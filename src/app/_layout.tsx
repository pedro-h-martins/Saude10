import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RealmProvider, seedInitialGoals, useRealm } from "@/context/RealmProvider";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import 'react-native-get-random-values';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const realm = useRealm();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    seedInitialGoals(realm);
    setIsReady(true);
  }, [realm]);

  useEffect(() => {
    if (!isReady || authLoading) return;

    const authPages = ['welcome', 'login', 'signup'];
    const inAuthGroup = authPages.includes(segments[0] ?? '');

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isReady, authLoading, router]);

  return <>{children}</>;
}

function RootLayoutContent() {
  return (
    <AuthGuard>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
      </Stack>
    </AuthGuard>
  );
}

export default function RootLayout() {
  return (
    <RealmProvider 
      fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      }
    >
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </RealmProvider>
  );
}
