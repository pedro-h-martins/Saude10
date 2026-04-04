import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/context/RealmProvider';
import { UserProfile } from '@/models/UserProfile';
import { Welcome } from '@/screens/Welcome';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';

export default function WelcomeScreen() {
  const { signInDev } = useAuth();
  const router = useRouter();

  const users = useQuery(UserProfile);

  const handleLogin = async () => {
    if (__DEV__) {
      const hasNonDemoUser = users.some((u) => !!u.email && !u.email.startsWith('demo'));

      if (hasNonDemoUser) {
        router.push('/login');
        return;
      }

      Alert.alert('Entrar', 'Escolha como deseja entrar', [
        { text: 'Email e senha', onPress: () => router.push('/login') },
        {
          text: 'Demonstração',
          onPress: async () => {
            try {
              await signInDev();
              router.replace('/(tabs)');
            } catch (e) {
              console.error(e);
              Alert.alert('Erro', 'Falha ao entrar como demonstração.');
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);

      return;
    }

    router.push('/login');
  };

  const handleCreateAccount = () => {
    router.push('/signup');
  };

  return <Welcome onLogin={handleLogin} onCreateAccount={handleCreateAccount} />;
}
