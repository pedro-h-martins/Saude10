import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Card } from './Card';

type Point = { x: number; y: number; value: number; label: string };

type Props = {
  title?: string;
  data: { date: string; value: number }[];
};

const { width } = Dimensions.get('window');
const CHART_WIDTH = Math.min(600, width - 64);
const CHART_HEIGHT = 120;

export default function EvolutionCharts({ title = 'Gráficos de Evolução', data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Text style={Typography.h3}>{title}</Text>
        <Text style={Typography.body}>Nenhum dado disponível para este período.</Text>
      </Card>
    );
  }

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max === min ? max || 1 : max - min;

  const points: Point[] = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * CHART_WIDTH;
    const normalized = (d.value - min) / range;
    const y = CHART_HEIGHT - normalized * CHART_HEIGHT;
    return { x, y, value: d.value, label: d.date };
  });

  const dPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

  return (
    <Card style={styles.card}>
      <Text style={Typography.h3}>{title}</Text>
      <View style={{ marginTop: 8 }}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <Line
              key={i}
              x1={0}
              y1={CHART_HEIGHT - t * CHART_HEIGHT}
              x2={CHART_WIDTH}
              y2={CHART_HEIGHT - t * CHART_HEIGHT}
              stroke={Colors.border}
              strokeWidth={0.5}
            />
          ))}

          <Path d={dPath} fill="none" stroke={Colors.primary} strokeWidth={2} />

          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={Colors.primary} />
          ))}
        </Svg>
      </View>
      <View style={styles.summary}>
        <Text style={Typography.body}>Último: {data[data.length - 1].value}</Text>
        <Text style={Typography.body}>Média: {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
