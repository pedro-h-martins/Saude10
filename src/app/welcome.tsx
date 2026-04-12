import { useQuery } from '@/context/RealmProvider';
import { UserProfile } from '@/models/UserProfile';
import { Welcome } from '@/screens/Welcome';
import { useRouter } from 'expo-router';
import React from 'react';

export default function WelcomeScreen() {
  const router = useRouter();

  const users = useQuery(UserProfile);

  const handleLogin = async () => {
    router.push('/login');
  };

  const handleCreateAccount = () => {
    router.push('/signup');
  };

  return <Welcome onLogin={handleLogin} onCreateAccount={handleCreateAccount} />;
}
