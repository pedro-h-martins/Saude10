import InputWithValidation from '@/components/InputWithValidation';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { formatBirthDate as formatBirthDateFn, sanitizeNumberInput } from '@/utils/formatters';
import { validateBirthDate, validateHeight, validateWeight } from '@/utils/validation';
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
  const [birthError, setBirthError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formatBirthDate = (text: string) => setBirthDate(formatBirthDateFn(text));

  const handleSignUp = async () => {
    const nameValue = name.trim();
    const emailValue = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const birthCheck = validateBirthDate(birthDate);
    if (!birthCheck.valid) {
      Alert.alert('Validação', birthCheck.error || 'Data inválida');
      return;
    }

    const w = validateWeight(weight);
    const h = validateHeight(height);
    if (!w.valid) {
      Alert.alert('Validação', w.error || 'Peso inválido');
      return;
    }
    if (!h.valid) {
      Alert.alert('Validação', h.error || 'Altura inválida');
      return;
    }

    const weightVal = w.value as number;
    const heightVal = h.value as number;

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
            <InputWithValidation
              containerStyle={{ flex: 1, marginRight: 8 }}
              style={styles.input}
              placeholder="Data Nascimento (DD/MM/AAAA)"
              keyboardType="numeric"
              maxLength={10}
              value={birthDate}
              onChangeText={formatBirthDate}
              onBlur={() => {
                const r = validateBirthDate(birthDate);
                setBirthError(r.valid ? null : r.error || 'Data inválida');
              }}
              error={birthError}
            />
          </View>

          <View style={styles.row}>
            <InputWithValidation
              containerStyle={{ flex: 1, marginRight: 8 }}
              style={styles.input}
              placeholder="Peso (kg)"
              keyboardType="numeric"
              value={weight}
              onChangeText={(text) => setWeight(sanitizeNumberInput(text, 6))}
              onBlur={() => {
                const r = validateWeight(weight);
                setWeightError(r.valid ? null : r.error || 'Peso inválido');
              }}
              error={weightError}
            />
            <InputWithValidation
              containerStyle={{ flex: 1 }}
              style={styles.input}
              placeholder="Altura (cm)"
              keyboardType="numeric"
              value={height}
              onChangeText={(text) => setHeight(sanitizeNumberInput(text, 6))}
              onBlur={() => {
                const r = validateHeight(height);
                setHeightError(r.valid ? null : r.error || 'Altura inválida');
              }}
              error={heightError}
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
