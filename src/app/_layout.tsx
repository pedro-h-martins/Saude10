import 'react-native-get-random-values';
import FeedbackSurveyPrompt from '@/components/FeedbackSurveyPrompt';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { EncryptedDatabaseProvider } from "@/context/RealmProvider";
import { useSync } from '@/hooks/useSync';
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";


function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const authPages = ['welcome', 'login', 'signup'];
    const inAuthGroup = authPages.includes(segments[0] ?? '');

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, authLoading, router]);

  return <>{children}</>;
}


function RootLayoutContent() {
  useSync();
  return (
    <AuthGuard>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
      <FeedbackSurveyPrompt />
    </AuthGuard>
  );
}

export default function RootLayout() {
  return (
    <EncryptedDatabaseProvider
      fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      }
    >
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </EncryptedDatabaseProvider>
  );
}
