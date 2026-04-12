import { useRealm } from '@/context/RealmProvider';
import { Realm } from '@realm/react';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export type TimerMode = 'focus' | 'break';

export const usePomodoro = () => {
  const realm = useRealm();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const appState = useRef(AppState.currentState);
  const lastTimestamp = useRef<number | null>(null);

  const saveLog = useCallback((type: TimerMode, duration: number) => {
    realm.write(() => {
      realm.create('PomodoroLog', {
        _id: new Realm.BSON.ObjectId(),
        type,
        duration,
        completedAt: new Date(),
      });
    });
  }, [realm]);

  const switchMode = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (mode === 'focus') {
      saveLog('focus', FOCUS_TIME);
      setMode('break');
      setTimeLeft(BREAK_TIME);
    } else {
      setMode('focus');
      setTimeLeft(FOCUS_TIME);
    }
    setIsRunning(false);
  }, [mode, saveLog]);

  useEffect(() => {
    let interval: number;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      switchMode();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, switchMode]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isRunning && lastTimestamp.current) {
          const elapsed = Math.floor((Date.now() - lastTimestamp.current) / 1000);
          setTimeLeft((prev) => Math.max(0, prev - elapsed));
        }
      }
      
      if (nextAppState.match(/inactive|background/)) {
        lastTimestamp.current = Date.now();
      } else {
        lastTimestamp.current = null;
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isRunning]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeLeft / (mode === 'focus' ? FOCUS_TIME : BREAK_TIME);

  return {
    timeLeft,
    mode,
    isRunning,
    toggleTimer,
    resetTimer,
    formatTime,
    progress,
  };
};


