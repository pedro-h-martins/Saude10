import { Platform } from 'react-native';

let initialized = false;

async function loadGoogleServicesJson(): Promise<any | null> {
  try {
    // @ts-ignore
    const cfg = await import('../../google-services.json');
    return cfg?.default ?? cfg;
  } catch {
    return null;
  }
}

export async function initFirebase(): Promise<void> {
  if (initialized) return;

  if (Platform.OS === 'web') {
    try {
      const firebase = await import('firebase/app');
      const { getApps, initializeApp } = firebase;

      if (getApps().length === 0) {
        const gs = await loadGoogleServicesJson();
        let cfg: any = null;
        if (gs) {
          try {
            const client = gs.client && gs.client[0];
            const apiKey = client?.api_key && client.api_key[0]?.current_key;
            const projectId = gs.project_info?.project_id;
            const appId = client?.client_info?.mobilesdk_app_id;
            const authDomain = `${projectId}.firebaseapp.com`;
            cfg = {
              apiKey,
              authDomain,
              projectId,
              storageBucket: gs.project_info?.storage_bucket,
              messagingSenderId: client?.services?.analytics_service?.status ? undefined : undefined,
              appId,
            };
          } catch {
            cfg = null;
          }
        }

        if (!cfg.apiKey) {
          console.warn('Firebase web config not found. Place google-services.json in project root or set EXPO_PUBLIC_FIREBASE_* env vars.');
        } else {
          initializeApp(cfg);
        }
      }
      initialized = true;
    } catch (e) {
      console.warn('Failed to initialize Firebase (web):', e);
    }
  } else {
    try {
      const rnfb = await import('@react-native-firebase/app');
      try {
        rnfb.getApp();
      } catch {
        try { (rnfb as any).initializeApp(); } catch { /* ignore */ }
      }
      initialized = true;
    } catch (e) {
      console.warn('React Native Firebase native module not available:', e);
    }
  }
}

export function isNativeFirebaseAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  try {
     
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@react-native-firebase/app');
    return true;
  } catch {
    return false;
  }
}

export function isInitialized(): boolean {
  return initialized;
}

export async function webHasGoogleServicesJson(): Promise<boolean> {
  const gs = await loadGoogleServicesJson();
  return !!gs;
}
