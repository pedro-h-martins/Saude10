import 'react-native-get-random-values';
import FeedbackSurveyPrompt from '@/components/FeedbackSurveyPrompt';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { EncryptedDatabaseProvider } from "@/context/RealmProvider";
import { useSync } from '@/hooks/useSync';
import { Stack, useRouter, useSegments } from "expo-router";
import React, { Component, useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Algo deu errado</Text>
          <ScrollView style={styles.errorScroll} contentContainerStyle={styles.errorScrollContent}>
            <Text style={styles.errorMessage}>{this.state.error?.message ?? 'Erro desconhecido'}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.errorButton} onPress={this.handleReload}>
            <Text style={styles.errorButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}


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
    <ErrorBoundary>
      <EncryptedDatabaseProvider
        fallback={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        }
      >
        <AuthProvider>
          <SafeAreaProvider>
            <RootLayoutContent />
          </SafeAreaProvider>
        </AuthProvider>
      </EncryptedDatabaseProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#E74C3C', marginBottom: 12 },
  errorScroll: { maxHeight: 200, width: '100%' },
  errorScrollContent: { paddingHorizontal: 16 },
  errorMessage: { fontSize: 14, color: '#555', fontFamily: 'monospace' },
  errorButton: { marginTop: 20, backgroundColor: '#3498DB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  errorButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
