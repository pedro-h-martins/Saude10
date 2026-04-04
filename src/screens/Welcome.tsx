import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface WelcomeProps {
  onLogin: () => void;
  onCreateAccount?: () => void;
}

export function Welcome({ onLogin, onCreateAccount }: WelcomeProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.branding}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="heart-plus" size={32} color={Colors.primary} />
            <Text style={styles.brandTitle}>Saúde10</Text>
          </View>
          <Text style={styles.brandSubtitle}>ELITE WELLNESS</Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.welcomeTitle}>Bem-vindo ao</Text>
          <Text style={[styles.welcomeTitle, styles.brandName]}>Saúde10</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onLogin}
          >
            <Text style={styles.primaryButtonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onCreateAccount}
          >
            <Text style={styles.secondaryButtonText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    color: Colors.primary,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003366',
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
    color: '#002244',
  },
  brandName: {
    color: Colors.primary,
    fontSize: 48,
  },
  description: {
    fontSize: 16,
    color: '#667788',
    marginTop: 20,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#F5F7FA',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#003366',
    fontSize: 18,
    fontWeight: '600',
  },
});
