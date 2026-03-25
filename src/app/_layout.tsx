import 'react-native-get-random-values';
import { RealmProvider, seedInitialGoals, useQuery, useRealm } from "@/context/RealmProvider";
import { UserProfile } from "@/models/UserProfile";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const users = useQuery(UserProfile);
  const router = useRouter();
  const segments = useSegments();
  const realm = useRealm();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    seedInitialGoals(realm);
    setIsReady(true);
  }, []);

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

export default function RootLayout() {
  return (
    <RealmProvider>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </RealmProvider>
  );
}
