import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface WelcomeProps {
  onLogin: () => void;
  onCreateAccount?: () => void;
}

export function Welcome({ onLogin, onCreateAccount }: WelcomeProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceContainerLowest }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.content, { paddingBottom: 50 + insets.bottom }] }>
        <View style={styles.branding}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="heart-plus" size={32} color={colors.primary} />
            <Text style={[styles.brandTitle, { color: colors.primary }]}>Saúde10</Text>
          </View>
          <Text style={[styles.brandSubtitle, { color: colors.onPrimaryFixed }]}>ELITE WELLNESS</Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={[styles.welcomeTitle, { color: colors.onPrimaryFixed }]}>Bem-vindo ao</Text>
          <Text style={[styles.welcomeTitle, styles.brandName, { color: colors.primary }]}>Saúde10</Text>
        </View>

        <View style={[styles.buttonContainer, { marginBottom: 20 + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={onLogin}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.inputBackground }]}
            onPress={onCreateAccount}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.onPrimaryFixed }]}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  branding: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '700',
  },
  brandName: {
    fontSize: 48,
  },
  description: {
    fontSize: 16,
    marginTop: 20,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
