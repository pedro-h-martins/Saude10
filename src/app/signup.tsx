import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(false);

  const formatBirthDate = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
      if (cleaned.length > 4) {
        formatted += `/${cleaned.slice(4, 8)}`;
      }
    }
    setBirthDate(formatted);
  };

  const handleSignUp = async () => {
    const nameValue = name.trim();
    const emailValue = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const weightVal = parseFloat(weight.replace(',', '.'));
    const heightVal = parseFloat(height.replace(',', '.'));

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
    
    const dateParts = birthDate.split('/');
    if (dateParts.length !== 3 || birthDate.length !== 10) {
      Alert.alert('Validação', 'Por favor informe a data de nascimento completa (DD/MM/AAAA).');
      return;
    }

    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const year = parseInt(dateParts[2]);
    const parsedDate = new Date(year, month, day);

    if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month || parsedDate.getDate() !== day) {
      Alert.alert('Validação', 'Por favor informe uma data de nascimento válida.');
      return;
    }

    if (year < 1900 || year > new Date().getFullYear()) {
      Alert.alert('Validação', 'Por favor informe um ano de nascimento válido.');
      return;
    }

    if (!weight || isNaN(weightVal) || weightVal <= 0) {
      Alert.alert('Validação', 'Por favor informe um peso válido.');
      return;
    }
    if (!height || isNaN(heightVal) || heightVal <= 0) {
      Alert.alert('Validação', 'Por favor informe uma altura válida.');
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
      await signUp(nameValue, emailValue, password, parsedDate, weightVal, heightVal);
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Data Nascimento (DD/MM/AAAA)"
              keyboardType="numeric"
              maxLength={10}
              value={birthDate}
              onChangeText={formatBirthDate}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Peso (kg)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Altura (m)"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { flexGrow: 1 },
  inner: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginBottom: 24 },
  input: { backgroundColor: '#F5F7FA', padding: 14, borderRadius: 12, marginBottom: 12 },
  row: { flexDirection: 'row', marginBottom: 0 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 12, alignItems: 'center' },
  linkText: { color: Colors.primary, fontWeight: '600' },
});
