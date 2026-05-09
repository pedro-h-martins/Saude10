import { Card } from '@/components/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import React, { useEffect, useRef, useState } from 'react';
import {
    Image,
    ImageSourcePropType,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface StretchAnimationCardProps {
  title: string;
  description: string;
  durationSeconds: number;
  animationSource?: ImageSourcePropType;
  accentColor?: string;
}

export const StretchAnimationCard: React.FC<StretchAnimationCardProps> = ({
  title,
  description,
  durationSeconds,
  animationSource,
  accentColor = Colors.primary,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleToggle = () => {
    if (timeLeft === 0) {
      setTimeLeft(durationSeconds);
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(durationSeconds);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.accentBar, { backgroundColor: accentColor + '30' }]} />
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      <View style={styles.animationContainer}>
        {animationSource ? (
          <Image
            source={animationSource}
            style={styles.animationImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.animationPlaceholder, { borderColor: accentColor + '40' }]}> 
            <Text style={[styles.animationPlaceholderText, { color: accentColor }]}>GIF</Text>
          </View>
        )}
      </View>

      <View style={styles.timerRow}>
        <Text style={styles.timerText}>Duração</Text>
        <Text style={styles.timerValue}>{timeLeft}s</Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlButton, isRunning ? styles.pauseButton : styles.startButton]}
          onPress={handleToggle}
        >
          <Text style={[styles.controlButtonText, isRunning ? styles.pauseButtonText : styles.startButtonText]}>
            {isRunning ? 'Pausar' : timeLeft === durationSeconds ? 'Iniciar' : 'Continuar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
          <Text style={[styles.controlButtonText, styles.resetButtonText]}>Resetar</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 240,
    marginRight: 16,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accentBar: {
    width: 5,
    height: 40,
    borderRadius: 3,
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  animationContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  animationImage: {
    width: 180,
    height: 120,
    borderRadius: 16,
  },
  animationPlaceholder: {
    width: 170,
    height: 120,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.timerBackground,
  },
  animationPlaceholderText: {
    ...Typography.h3,
    fontSize: 24,
    fontWeight: '700',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  timerValue: {
    ...Typography.h3,
    fontSize: 20,
    color: Colors.text,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.timerBackground,
    marginRight: 8,
  },
  startButton: {
    backgroundColor: Colors.primary,
  },
  pauseButton: {
    backgroundColor: Colors.primaryLight,
  },
  controlButtonText: {
    ...Typography.body,
    fontWeight: '700',
  },
  startButtonText: {
    color: Colors.white,
  },
  pauseButtonText: {
    color: Colors.white,
  },
  resetButtonText: {
    color: Colors.textSecondary,
  },
});
