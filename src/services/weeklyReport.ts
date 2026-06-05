import { Realm } from '@realm/react';
import * as MailComposer from 'expo-mail-composer';
import { Share } from 'react-native';

import { ActivityLog } from '@/models/ActivityLog';
import { HydrationLog } from '@/models/HydrationLog';
import { MealLog } from '@/models/MealLog';
import { PomodoroLog } from '@/models/PomodoroLog';
import { SleepLog } from '@/models/SleepLog';
import { WellnessLog } from '@/models/WellnessLog';
import { Workout } from '@/models/Workout';

export type WeeklySummary = {
  periodStart: string;
  periodEnd: string;
  totalSteps: number;
  avgDailySteps: number;
  stepsByDay: { date: string; steps: number }[];
  mealsLogged: number;
  totalCalories: number;
  meditationsCompleted: number;
  focusMinutes: number;
  avgSleepHours: number;
  avgSleepQuality: number;
  waterGlasses: number;
  workoutsCompleted: number;
  avgWellness: number;
};

function getStartOfWeek(): Date {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getWeeklySummary(realm: Realm, userId: string): WeeklySummary {
  const periodStart = getStartOfWeek();
  const periodEnd = new Date();
  const periodEndDay = new Date(periodEnd);
  periodEndDay.setHours(23, 59, 59, 999);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const activityLogs = realm.objects<ActivityLog>('ActivityLog')
    .filtered('date >= $0', formatDate(periodStart));

  let totalSteps = 0;
  const stepsByDay: { date: string; steps: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(periodEnd);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    const found = activityLogs.find((a) => a.date === key);
    const steps = found ? found.steps : 0;
    totalSteps += steps;
    stepsByDay.push({ date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), steps });
  }

  const mealLogs = realm.objects<MealLog>('MealLog')
    .filtered('userId == $0 AND timestamp >= $1 AND timestamp <= $2', userId, periodStart, periodEndDay);
  const mealsLogged = mealLogs.length;
  let totalCalories = 0;
  for (const m of mealLogs) {
    totalCalories += m.calories || 0;
  }

  const pomodoroLogs = realm.objects<PomodoroLog>('PomodoroLog')
    .filtered('type == $0 AND completedAt >= $1 AND completedAt <= $2', 'focus', periodStart, periodEndDay);
  const meditationsCompleted = pomodoroLogs.length;
  let focusMinutes = 0;
  for (const p of pomodoroLogs) {
    focusMinutes += (p.duration || 0) / 60;
  }
  focusMinutes = Math.round(focusMinutes);

  const sleepLogs = realm.objects<SleepLog>('SleepLog')
    .filtered('userId == $0 AND endTime >= $1 AND endTime <= $2', userId, periodStart, periodEndDay);
  let totalSleepHours = 0;
  let totalSleepQuality = 0;
  const sleepCount = sleepLogs.length;
  for (const s of sleepLogs) {
    const hours = (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60);
    totalSleepHours += hours;
    totalSleepQuality += s.quality || 0;
  }
  const avgSleepHours = sleepCount > 0 ? parseFloat((totalSleepHours / sleepCount).toFixed(1)) : 0;
  const avgSleepQuality = sleepCount > 0 ? parseFloat((totalSleepQuality / sleepCount).toFixed(1)) : 0;

  const hydrationLogs = realm.objects<HydrationLog>('HydrationLog')
    .filtered('userId == $0 AND timestamp >= $1 AND timestamp <= $2', userId, periodStart, periodEndDay);
  const waterGlasses = hydrationLogs.length;

  const workouts = realm.objects<Workout>('Workout')
    .filtered('isCompleted == true AND completedAt >= $0 AND completedAt <= $1', periodStart, periodEndDay);
  const workoutsCompleted = workouts.length;

  const wellnessLogs = realm.objects<WellnessLog>('WellnessLog')
    .filtered('userId == $0 AND timestamp >= $1 AND timestamp <= $2', userId, periodStart, periodEndDay);
  let totalWellness = 0;
  const wellnessCount = wellnessLogs.length;
  for (const w of wellnessLogs) {
    totalWellness += w.rating || 0;
  }
  const avgWellness = wellnessCount > 0 ? parseFloat((totalWellness / wellnessCount).toFixed(1)) : 0;

  return {
    periodStart: periodStart.toLocaleDateString('pt-BR'),
    periodEnd: periodEnd.toLocaleDateString('pt-BR'),
    totalSteps,
    avgDailySteps: Math.round(totalSteps / 7),
    stepsByDay,
    mealsLogged,
    totalCalories,
    meditationsCompleted,
    focusMinutes,
    avgSleepHours,
    avgSleepQuality,
    waterGlasses,
    workoutsCompleted,
    avgWellness,
  };
}

export function composeReportEmail(summary: WeeklySummary, userName: string): {
  subject: string;
  bodyHtml: string;
  bodyText: string;
} {
  const subject = `Seu Resumo Semanal - Saude10`;

  // Gera a lista de passos por dia com quebras de linha (<br />) para o HTML
  const stepsLinesHtml = summary.stepsByDay
    .map((d) => `• <strong>${d.date}:</strong> ${d.steps.toLocaleString('pt-BR')} passos`)
    .join('<br />');

  // HTML reformulado com quebras de linha dinâmicas e margens limpas
  const bodyHtml = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1C1C1C;line-height:1.6;">
      <h1 style="color:#0052D4;font-size:22px;margin-bottom:4px">Saude10 — Resumo Semanal</h1>
      <p style="color:#7D7D7D;font-size:14px;margin-top:0;margin-bottom:20px">
        ${summary.periodStart} — ${summary.periodEnd}
      </p>

      <p style="font-size:15px;margin-bottom:24px;">
        👟 <strong>Total de passos:</strong> ${summary.totalSteps.toLocaleString('pt-BR')}<br />
        👟 <strong>Média diária:</strong> ${summary.avgDailySteps.toLocaleString('pt-BR')}<br />
        🍽️ <strong>Refeições registradas:</strong> ${summary.mealsLogged}<br />
        🔥 <strong>Calorias consumidas:</strong> ${summary.totalCalories.toLocaleString('pt-BR')} kcal<br />
        🧘 <strong>Sessões de foco/meditação:</strong> ${summary.meditationsCompleted}<br />
        ⏱️ <strong>Minutos de foco:</strong> ${summary.focusMinutes} min<br />
        😴 <strong>Média de sono:</strong> ${summary.avgSleepHours}h (qualidade ${summary.avgSleepQuality}/5)<br />
        💧 <strong>Copos de água:</strong> ${summary.waterGlasses}<br />
        🏋️ <strong>Treinos concluídos:</strong> ${summary.workoutsCompleted}<br />
        😊 <strong>Bem-estar médio:</strong> ${summary.avgWellness}/5
      </p>

      <h2 style="color:#0052D4;font-size:16px;margin-bottom:8px">Passos por dia</h2>
      <p style="background:#F8F9FB;padding:12px;border:1px solid #EAEAEA;border-radius:4px;font-size:14px;line-height:1.5;">
        ${stepsLinesHtml}
      </p>

      <p style="color:#7D7D7D;font-size:12px;margin-top:24px">
        Relatório gerado automaticamente pelo app Saude10.
      </p>
    </div>
  `;

  const bodyText = `Saude10 — Resumo Semanal
${summary.periodStart} — ${summary.periodEnd}

👟 Total de passos: ${summary.totalSteps.toLocaleString('pt-BR')}
👟 Média diária: ${summary.avgDailySteps.toLocaleString('pt-BR')}
🍽️ Refeições registradas: ${summary.mealsLogged}
🔥 Calorias consumidas: ${summary.totalCalories.toLocaleString('pt-BR')} kcal
🧘 Sessões de foco/meditação: ${summary.meditationsCompleted}
⏱️ Minutos de foco: ${summary.focusMinutes} min
😴 Média de sono: ${summary.avgSleepHours}h (qualidade ${summary.avgSleepQuality}/5)
💧 Copos de água: ${summary.waterGlasses}
🏋️ Treinos concluídos: ${summary.workoutsCompleted}
😊 Bem-estar médio: ${summary.avgWellness}/5

Passos por dia:
${summary.stepsByDay.map((d) => `• ${d.date}: ${d.steps.toLocaleString('pt-BR')} passos`).join('\n')}

Relatório gerado automaticamente pelo app Saude10.`;

  return { subject, bodyHtml, bodyText };
}

export async function sendWeeklyReport(
  summary: WeeklySummary,
  userName: string,
  userEmail: string,
): Promise<{ sent: boolean; method: 'mail' | 'share' }> {
  const { subject, bodyHtml, bodyText } = composeReportEmail(summary, userName);

  const isAvailable = await MailComposer.isAvailableAsync();

  if (isAvailable) {
    const result = await MailComposer.composeAsync({
      recipients: [userEmail],
      subject,
      body: bodyHtml,
      isHtml: true,
    });

    return { sent: result.status === MailComposer.MailComposerStatus.SENT, method: 'mail' };
  }

  await Share.share({ title: subject, message: bodyText });
  return { sent: true, method: 'share' };
}