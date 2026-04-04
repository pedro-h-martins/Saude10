import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

export interface BMIData {
  value: number;
  category: string;
  isIdeal: boolean;
  color: string;
}

export function calculateBMI(weight: number, heightCm: number): BMIData {
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  const roundedBmi = Math.round(bmi * 10) / 10;

  let category = '';
  let isIdeal = false;
  let color = '#ccc';

  if (roundedBmi < 18.5) {
    category = 'Abaixo do peso';
    color = '#FFD700';
  } else if (roundedBmi >= 18.5 && roundedBmi <= 24.9) {
    category = 'Peso ideal';
    isIdeal = true;
    color = '#4CAF50';
  } else if (roundedBmi >= 25 && roundedBmi <= 29.9) {
    category = 'Sobrepeso';
    color = '#FF9800';
  } else {
    category = 'Obesidade';
    color = '#F44336';
  }

  return {
    value: roundedBmi,
    category,
    isIdeal,
    color,
  };
}

export async function requestActivityPermissions(): Promise<boolean> {
  const { status: pedometerStatus } = await Pedometer.requestPermissionsAsync();
  const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

  return pedometerStatus === 'granted' && locationStatus === 'granted';
}

export function calculateDistance(steps: number, heightCm: number): number {
  const heightM = heightCm / 100;
  const strideLengthM = heightM * 0.4145;
  const distanceM = steps * strideLengthM;
  return Math.round(distanceM);
}

export async function fetchStepsForPeriod(start: Date, end: Date): Promise<number> {
  const isAvailable = await Pedometer.isAvailableAsync();
  if (!isAvailable) return 0;

  if (Platform.OS === 'android') {
    return 0;
  }

  try {
    const result = await Pedometer.getStepCountAsync(start, end);
    return result.steps;
  } catch (e) {
    console.error('Error fetching steps:', e);
    return 0;
  }
}

