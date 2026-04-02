import { useAuth } from '@/context/AuthContext';
import { Welcome } from '@/screens/Welcome';
import { useRouter } from 'expo-router';
import React from 'react';

export default function WelcomeScreen() {
  const { signInDev } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (__DEV__) {
      await signInDev();
      return;
    }
    router.push('/login');
  };

  return <Welcome onLogin={handleLogin} />;
}
