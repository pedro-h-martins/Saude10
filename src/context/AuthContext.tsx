import { AUTH_USER_ID_KEY } from '@/constants/config';
import { useRealm } from '@/context/RealmProvider';
import { UserProfile } from '@/models/UserProfile';
import * as authService from '@/services/auth';
import { cleanupSyncListeners, initializeSyncListeners, saveEntity, tryRemoteRead } from '@/sync/SyncService';
import { isOnline } from '@/utils/network';
import { Realm } from '@realm/react';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type AuthContextType = {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    birthDate: Date,
    weight: number,
    height: number
  ) => Promise<void>;
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
        let profile: any = null;

        if (Platform.OS !== 'web') {
          try {
            const [{ getAuth }, { getApp }] = await Promise.all([
              import('@react-native-firebase/auth'),
              import('@react-native-firebase/app'),
            ]);
            const auth = getAuth(getApp());
            const firebaseUser = auth.currentUser;
            if (firebaseUser) {
              const storedId = await SecureStore.getItemAsync(AUTH_USER_ID_KEY);
              const uid = storedId ?? firebaseUser.uid;
              
              let remoteProfile: any = null;
              if (await isOnline()) {
                try {
                  remoteProfile = await tryRemoteRead(`users/${uid}/UserProfile`, uid);
                } catch (e) {
                  console.warn('Could not fetch remote profile on startup', e);
                }
              }

              const realmProfile = realm.objectForPrimaryKey<UserProfile>(UserProfile, uid);
              profile = {
                _id: uid,
                name: remoteProfile?.name ?? realmProfile?.name ?? firebaseUser.displayName ?? firebaseUser.email ?? 'User',
                email: remoteProfile?.email ?? firebaseUser.email ?? realmProfile?.email ?? '',
                birthDate: remoteProfile?.birthDate ? new Date(remoteProfile.birthDate.seconds ? remoteProfile.birthDate.toDate() : remoteProfile.birthDate) : (realmProfile?.birthDate ?? new Date()),
                weight: remoteProfile?.weight ?? realmProfile?.weight ?? 0,
                height: remoteProfile?.height ?? realmProfile?.height ?? 0,
              };
            }
          } catch (fbErr) {
            console.warn('[AuthContext] Firebase currentUser check failed:', fbErr);
          }
        }

        if (!profile) {
          const tokens = await authService.getStoredTokens();

          if (tokens.refreshToken && tokens.refreshToken !== 'offline-token') {
            try {
              const refreshed = await authService.refreshTokens();
              if (refreshed.accessToken) {
                try {
                  profile = await authService.fetchProfile(refreshed.accessToken);
                } catch {
                  profile = null;
                }
              }
            } catch {
              const storedId = await SecureStore.getItemAsync(AUTH_USER_ID_KEY).catch(() => null);
              if (storedId) {
                const realmProfile = realm.objectForPrimaryKey<UserProfile>(UserProfile, storedId);
                if (realmProfile) {
                  setCurrentUser(realmProfile);
                  setLoading(false);
                  return;
                }
              }
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
        }

        if (profile) {
          const id = profile._id ?? `user-${Date.now()}`;
          const profileData = {
            _id: id,
            name: profile.name ?? profile.email ?? 'User',
            email: profile.email ?? '',
            birthDate: profile.birthDate ? new Date(profile.birthDate) : new Date(),
            weight: profile.weight ?? 0,
            height: profile.height ?? 0,
            updatedAt: new Date(),
          };

          realm.write(() => {
            realm.create(UserProfile, profileData, Realm.UpdateMode.Modified);
          });

          const user = realm.objectForPrimaryKey<UserProfile>(UserProfile, id);
          setCurrentUser(user ?? null);
        }
      } catch (err) {
        console.warn('Auth initialization error', err);
        const tokens = await authService.getStoredTokens();
        if (tokens.accessToken) {
          const allUsers = realm.objects<UserProfile>(UserProfile);
          if (allUsers.length > 0) {
            setCurrentUser(allUsers[0]);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [realm]);

  useEffect(() => {
    if (!currentUser?._id) {
      cleanupSyncListeners();
      return;
    }

    (async () => {
      await initializeSyncListeners(realm, currentUser._id);
    })();

    return () => {
      cleanupSyncListeners();
    };
  }, [realm, currentUser?._id]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);

      if (!res.user) {
        throw new Error('Authentication failed: profile not found. Please register.');
      }
      const id = res.user._id ?? `user-${Date.now()}`;
      
      let remoteProfile: any = null;
      if (await isOnline()) {
        try {
          remoteProfile = await tryRemoteRead(`users/${id}/UserProfile`, id);
        } catch (e) {
          console.warn('Could not fetch remote profile during signIn', e);
        }
      }

      const localProfile = realm.objectForPrimaryKey<UserProfile>(UserProfile, id);
      const profileData = {
        _id: id,
        name: remoteProfile?.name ?? localProfile?.name ?? res.user?.name ?? email,
        email: remoteProfile?.email ?? localProfile?.email ?? res.user?.email ?? email,
        birthDate: remoteProfile?.birthDate ? new Date(remoteProfile.birthDate.seconds ? remoteProfile.birthDate.toDate() : remoteProfile.birthDate) : (localProfile?.birthDate ?? (res.user?.birthDate ? new Date(res.user.birthDate) : new Date())),
        weight: remoteProfile?.weight ?? localProfile?.weight ?? res.user?.weight ?? 0,
        height: remoteProfile?.height ?? localProfile?.height ?? res.user?.height ?? 0,
        updatedAt: new Date(),
      };

      await saveEntity(realm, 'UserProfile', id, profileData, id);

      const user = realm.objectForPrimaryKey<UserProfile>(UserProfile, id);
      setCurrentUser(user ?? null);
    } catch (e) {
      console.error('signIn error', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    birthDate: Date,
    weight: number,
    height: number
  ) => {
    setLoading(true);
    try {
      const res = await authService.signUp(name, email, password, birthDate, weight, height);
      const id = res.user?._id ?? `user-${Date.now()}`;

      const profileData = {
        _id: id,
        name: res.user?.name ?? name,
        email: res.user?.email ?? email,
        birthDate: res.user?.birthDate ? new Date(res.user.birthDate) : birthDate,
        weight: res.user?.weight ?? weight,
        height: res.user?.height ?? height,
        updatedAt: new Date(),
      };

      await saveEntity(realm, 'UserProfile', id, profileData, id);
      const user = realm.objectForPrimaryKey<UserProfile>(UserProfile, id);
      setCurrentUser(user ?? null);
    } catch (e) {
      console.error('signUp error', e);
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
        realm.create(UserProfile, {
          _id: id,
          name: res.user.name,
          email: res.user.email,
          birthDate: res.user.birthDate,
          weight: res.user.weight,
          height: res.user.height,
          updatedAt: new Date(),
        });
      });
      const user = realm.objectForPrimaryKey<UserProfile>(UserProfile, id);
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
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, loading, signIn, signUp, signInDev, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
