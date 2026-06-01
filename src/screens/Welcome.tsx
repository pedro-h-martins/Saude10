import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface WelcomeProps {
  onLogin: () => void;
  onCreateAccount?: () => void;
}

export function Welcome({ onLogin, onCreateAccount }: WelcomeProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }] }>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.content, { paddingBottom: 50 + insets.bottom }] }>
        <View style={styles.branding}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="heart-plus" size={32} color={colors.primary} />
            <Text style={[styles.brandTitle, { color: colors.primary }]}>Saúde10</Text>
          </View>
          <Text style={[styles.brandSubtitle, { color: colors.cardTitle }]}>ELITE WELLNESS</Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={[styles.welcomeTitle, { color: colors.cardTitle }]}>Bem-vindo ao</Text>
          <Text style={[styles.welcomeTitle, styles.brandName, { color: colors.primary }]}>Saúde10</Text>
        </View>

        <View style={[styles.buttonContainer, { marginBottom: 20 + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
            onPress={onLogin}
          >
            <Text style={[styles.primaryButtonText, { color: colors.white }]}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.inputBackground }]}
            onPress={onCreateAccount}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Criar conta</Text>
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
