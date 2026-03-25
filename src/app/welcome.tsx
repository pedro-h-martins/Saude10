import { useRealm } from '@/context/RealmProvider';
import { Welcome } from '@/screens/Welcome';
import React from 'react';

export default function WelcomeScreen() {
  const realm = useRealm();

  const handleLogin = () => {
    realm.write(() => {
      realm.create('UserProfile', {
        _id: 'demo-user-id',
        name: 'Demo User',
        email: 'user@email.com',
        birthDate: new Date(1995, 0, 1),
        weight: 80.0,
        height: 180.0,
        updatedAt: new Date(),
      });
    });
  };

  return <Welcome onLogin={handleLogin} />;
}
