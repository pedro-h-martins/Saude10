import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { collection, doc, getFirestore } from '@react-native-firebase/firestore';

export function getFirebaseApp() {
  return getApp();
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getCurrentUser() {
  return getFirebaseAuth().currentUser;
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}

export function getUserEntityCollection(userId: string, entityType: string) {
  return collection(getFirestoreDb(), 'users', userId, entityType);
}

export function getUserEntityDocRef(userId: string, entityType: string, entityId: string) {
  return doc(getFirestoreDb(), 'users', userId, entityType, entityId);
}
