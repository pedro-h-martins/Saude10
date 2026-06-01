import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const emailValue = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      Alert.alert('Validação', 'Por favor informe o email.');
      return;
    }
    if (!emailRegex.test(emailValue)) {
      Alert.alert('Validação', 'Por favor informe um email válido.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Validação', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await signIn(emailValue, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error(e);
      const isNetworkError = e && (e.message === 'Network request failed' || e.constructor.name === 'TypeError');
      if (isNetworkError) {
        Alert.alert('Modo Offline', 'Não foi possível conectar ao servidor. Você entrou usando o modo offline.');
        router.replace('/(tabs)');
        return;
      }
      Alert.alert('Erro', 'Falha ao autenticar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }] }>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'android' ? 80 : 20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <Text style={[styles.title, { color: colors.primary }]}>Entrar</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Senha"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSignIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.white }]}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 24 },
  input: { padding: 14, borderRadius: 12, marginBottom: 12 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { fontWeight: '700' },
});
