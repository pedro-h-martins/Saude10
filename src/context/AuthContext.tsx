import { useRealm } from '@/context/RealmProvider';
import { UserProfile } from '@/models/UserProfile';
import * as authService from '@/services/auth';
import { Realm } from '@realm/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInDev: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const realm = useRealm();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const tokens = await authService.getStoredTokens();
        let profile: any = null;

        if (tokens.refreshToken) {
          try {
            const refreshed = await authService.refreshTokens();
            profile = refreshed.user ?? null;

            if (!profile && refreshed.accessToken) {
              try {
                profile = await authService.fetchProfile(refreshed.accessToken);
              } catch {
                profile = null;
              }
            }
          } catch {
            await authService.signOut();
            setCurrentUser(null);
            setLoading(false);
            return;
          }
        } else if (tokens.accessToken) {
          try {
            profile = await authService.fetchProfile(tokens.accessToken);
          } catch {
            profile = null;
          }
        }

        if (profile) {
          const id = profile._id ?? `user-${Date.now()}`;
          realm.write(() => {
            realm.create('UserProfile', {
              _id: id,
              name: profile.name ?? profile.email ?? 'User',
              email: profile.email ?? '',
              birthDate: profile.birthDate ? new Date(profile.birthDate) : new Date(),
              weight: profile.weight ?? 0,
              height: profile.height ?? 0,
              updatedAt: new Date(),
            }, Realm.UpdateMode.Modified);
          });

          const user = realm.objectForPrimaryKey<UserProfile>('UserProfile', id);
          setCurrentUser(user ?? null);
        }
      } catch (err) {
        console.warn('Auth initialization error', err);
        await authService.signOut();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [realm]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const id = res.user?._id ?? `user-${Date.now()}`;

      realm.write(() => {
        realm.create('UserProfile', {
          _id: id,
          name: res.user?.name ?? email,
          email: res.user?.email ?? email,
          birthDate: res.user?.birthDate ? new Date(res.user.birthDate) : new Date(),
          weight: res.user?.weight ?? 0,
          height: res.user?.height ?? 0,
          updatedAt: new Date(),
        }, Realm.UpdateMode.Modified);
      });

      const user = realm.objectForPrimaryKey<UserProfile>('UserProfile', id);
      setCurrentUser(user ?? null);
    } catch (e) {
      console.error('signIn error', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signInDev = async () => {
    setLoading(true);
    try {
      const res = await authService.signInDev();
      const id = res.user._id;
      realm.write(() => {
        realm.create('UserProfile', {
          _id: id,
          name: res.user.name,
          email: res.user.email,
          birthDate: res.user.birthDate,
          weight: res.user.weight,
          height: res.user.height,
          updatedAt: new Date(),
        });
      });
      const user = realm.objectForPrimaryKey<UserProfile>('UserProfile', id);
      setCurrentUser(user ?? null);
    } catch (e) {
      console.error('signInDev error', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setCurrentUser(null);
    } catch (e) {
      console.error('signOut error', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, loading, signIn, signInDev, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
