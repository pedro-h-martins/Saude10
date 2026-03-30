import { RealmProvider, seedInitialGoals, useQuery, useRealm } from "@/context/RealmProvider";
import { UserProfile } from "@/models/UserProfile";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import 'react-native-get-random-values';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const users = useQuery(UserProfile);
  const router = useRouter();
  const segments = useSegments();
  const realm = useRealm();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    seedInitialGoals(realm);
    setIsReady(true);
  }, [realm]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "welcome";

    if (users.length === 0 && !inAuthGroup) {
      router.replace("/welcome");
    } else if (users.length > 0 && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [users.length, segments, isReady, router]);

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
      <RootLayoutContent />
    </RealmProvider>
  );
}
