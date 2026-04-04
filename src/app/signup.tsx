import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    const nameValue = name.trim();
    const emailValue = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nameValue) {
      Alert.alert('Validação', 'Por favor informe o nome.');
      return;
    }
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
    if (password !== confirmPassword) {
      Alert.alert('Validação', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await signUp(nameValue, emailValue, password);
      router.replace('/(tabs)');
    } catch (e) {
      console.error('signUp error', e);
      Alert.alert('Erro', 'Falha ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Criar conta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => router.push('/login')}>
          <Text style={styles.linkText}>Já tem uma conta? Entrar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  inner: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginBottom: 24 },
  input: { backgroundColor: '#F5F7FA', padding: 14, borderRadius: 12, marginBottom: 12 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 12, alignItems: 'center' },
  linkText: { color: Colors.primary, fontWeight: '600' },
});
