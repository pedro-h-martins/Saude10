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
import { EXPORT_CATEGORIES, normalizeRealmCollection, type ExportCategoryKey } from '@/services/exportData';

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

  const stepsLinesHtml = summary.stepsByDay
    .map((d) => `• <strong>${d.date}:</strong> ${d.steps.toLocaleString('pt-BR')} passos`)
    .join('<br />');

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

const HIDDEN_FIELDS = new Set([
  '_id', 'userId', 'realm', 'objectSchema', 'isValid', 'updatedAt',
  'avatarUri', 'waterGoal', 'currentGoalId', 'goals',
  'instructions', 'isPredefined', 'isRecurring', 'recurrenceRule', 'lastCompletedAt', 'createdAt',
  'type', 'periodType', 'periodValue', 'unit', 'currentValue',
  'isCompleted', 'isRecurring', 'isEnabled', 'isPredefined',
  'nextOccurrence', 'endDate', 'metric',
]);

const FRIENDLY_LABELS: Record<string, Record<string, string>> = {
  profile: {
    name: 'Nome', email: 'E-mail', birthDate: 'Data de Nascimento',
    weight: 'Peso (kg)', height: 'Altura (cm)',
  },
  goals: {
    title: 'Título', isActive: 'Ativa', targetValue: 'Meta', startDate: 'Data de Início',
  },
  activities: {
    date: 'Data', steps: 'Passos', distance: 'Distância (m)', intensity: 'Intensidade',
  },
  bloodPressure: {
    systolic: 'Sistólica', diastolic: 'Diastólica', timestamp: 'Data/Hora',
  },
  hydration: {
    amount: 'Quantidade (copos)', timestamp: 'Data/Hora',
  },
  pomodoro: {
    type: 'Tipo', duration: 'Duração (s)', completedAt: 'Concluído em',
  },
  reminders: {
    title: 'Título', time: 'Horário', isEnabled: 'Ativo', type: 'Tipo',
  },
  symptoms: {
    description: 'Descrição', timestamp: 'Data/Hora',
  },
  wellness: {
    rating: 'Nota', notes: 'Observações', timestamp: 'Data/Hora',
  },
  workouts: {
    title: 'Título', intensity: 'Intensidade', completedAt: 'Concluído em',
  },
};

const FIELD_EMOJIS: Record<string, Record<string, string>> = {
  profile: {
    name: '🧑', email: '✉️', birthDate: '🎂', weight: '⚖️', height: '📏',
  },
  goals: {
    title: '🎯', isActive: '✅', targetValue: '🏆', startDate: '📅',
  },
  activities: {
    date: '📅', steps: '👟', distance: '🗺️', intensity: '⚡',
  },
  bloodPressure: {
    systolic: '🔺', diastolic: '🔻', timestamp: '🕐',
  },
  hydration: {
    amount: '💧', timestamp: '🕐',
  },
  pomodoro: {
    type: '🏷️', duration: '⏳', completedAt: '✅',
  },
  reminders: {
    title: '📌', time: '⏰', isEnabled: '🔔', type: '🏷️',
  },
  symptoms: {
    description: '📝', timestamp: '🕐',
  },
  wellness: {
    rating: '⭐', notes: '📝', timestamp: '🕐',
  },
  workouts: {
    title: '🏋️', intensity: '⚡', completedAt: '✅',
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  profile: '👤', goals: '🎯', activities: '👟', bloodPressure: '🩺',
  hydration: '💧', pomodoro: '🧘', reminders: '🔔', symptoms: '🤒',
  wellness: '😊', workouts: '💪',
};

function formatDisplayDate(value: unknown): string {
  if (value == null) return '—';
  const str = String(value);
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

const DATE_FIELDS = new Set([
  'birthDate', 'timestamp', 'completedAt', 'startDate', 'endDate', 'nextOccurrence',
]);

const BOOL_FIELDS = new Set(['isActive', 'isCompleted', 'isEnabled']);

const INTENSITY_MAP: Record<string, string> = {
  low: 'Leve', moderate: 'Moderada', high: 'Intensa',
};

const POMODORO_TYPE_MAP: Record<string, string> = {
  focus: 'Foco', break: 'Pausa',
};

const REMINDER_TYPE_MAP: Record<string, string> = {
  water: 'Água', meditation: 'Meditação', medicine: 'Remédio', custom: 'Personalizado',
};

function formatFieldValue(categoryKey: string, fieldKey: string, value: unknown): string {
  if (value == null) return '—';

  if (BOOL_FIELDS.has(fieldKey)) {
    return value ? 'Sim' : 'Não';
  }

  if (DATE_FIELDS.has(fieldKey)) {
    return formatDisplayDate(value);
  }

  if (fieldKey === 'intensity') {
    return INTENSITY_MAP[String(value)] ?? String(value);
  }

  if (categoryKey === 'pomodoro' && fieldKey === 'type') {
    return POMODORO_TYPE_MAP[String(value)] ?? String(value);
  }

  if (categoryKey === 'reminders' && fieldKey === 'type') {
    return REMINDER_TYPE_MAP[String(value)] ?? String(value);
  }

  const str = String(value);
  if (Array.isArray(value)) {
    return value.length > 0 ? str : 'Nenhum';
  }

  return str;
}

function buildCategoryItemHtml(
  categoryKey: string,
  item: Record<string, unknown>,
): string {
  const labels = FRIENDLY_LABELS[categoryKey] ?? {};
  const emojis = FIELD_EMOJIS[categoryKey] ?? {};
  const lines = Object.entries(item)
    .filter(([k]) => !HIDDEN_FIELDS.has(k))
    .map(([k, v]) => {
      const label = labels[k] ?? k;
      const formatted = formatFieldValue(categoryKey, k, v);
      const emoji = emojis[k] ? `${emojis[k]} ` : '';
      return `${emoji}<strong>${label}:</strong> ${formatted}`;
    })
    .join('<br />\n    ');

  return `<li style="padding:10px 12px;margin-bottom:8px;background:#F8F9FB;border-radius:8px;font-size:14px;line-height:1.8;">
    ${lines}
  </li>`;
}

function buildCategorySectionHtml(
  categoryKey: string,
  categoryLabel: string,
  items: Record<string, unknown>[] | undefined,
): string {
  const icon = CATEGORY_ICONS[categoryKey] ?? '📋';

  if (!items || items.length === 0) {
    return `<h3 style="color:#0052D4;font-size:16px;margin-top:24px;margin-bottom:10px;">${icon} ${categoryLabel}</h3>
      <p style="font-size:14px;color:#7D7D7D;margin:0 0 16px 0;">Nenhum dado disponível.</p>`;
  }

  const displayItems = items.slice(0, 20);
  const itemsHtml = displayItems.map((item) => buildCategoryItemHtml(categoryKey, item)).join('\n');

  const countNote = items.length > 20
    ? `<p style="font-size:12px;color:#7D7D7D;margin:4px 0 16px 0;">Exibindo 20 de ${items.length} registros.</p>`
    : '';

  return `<h3 style="color:#0052D4;font-size:16px;margin-top:24px;margin-bottom:10px;">${icon} ${categoryLabel} (${items.length})</h3>
    <ul style="list-style:none;padding:0;margin:0 0 12px 0;">
      ${itemsHtml}
    </ul>
    ${countNote}`;
}

function composeCategoryEmailHtml(
  categories: ExportCategoryKey[],
  data: Record<string, unknown[]>,
): string {
  const selectedCategories = EXPORT_CATEGORIES.filter((c) => categories.includes(c.key));

  const sectionsHtml = selectedCategories
    .map((cat) => {
      const items = data[cat.key] as Record<string, unknown>[] | undefined;
      return buildCategorySectionHtml(cat.key, cat.label, items);
    })
    .join('\n');

  return `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1C1C1C;line-height:1.8;">
  <h1 style="color:#0052D4;font-size:22px;margin-bottom:4px;">📋 Saude10 — Relatório de Dados</h1>
  <p style="color:#7D7D7D;font-size:14px;margin-top:0;margin-bottom:24px;">
    📂 Categorias: ${selectedCategories.map((c) => c.label).join(', ')}
  </p>
  ${sectionsHtml}
  <br />
  <p style="color:#7D7D7D;font-size:12px;margin-top:24px;">
    🤖 Relatório gerado automaticamente pelo app Saude10.
  </p>
</div>`;
}

function buildCategoryItemText(
  categoryKey: string,
  item: Record<string, unknown>,
): string {
  const labels = FRIENDLY_LABELS[categoryKey] ?? {};
  const emojis = FIELD_EMOJIS[categoryKey] ?? {};
  const lines = Object.entries(item)
    .filter(([k]) => !HIDDEN_FIELDS.has(k))
    .map(([k, v]) => {
      const label = labels[k] ?? k;
      const formatted = formatFieldValue(categoryKey, k, v);
      const emoji = emojis[k] ? `${emojis[k]} ` : '';
      return `  ${emoji}${label}: ${formatted}`;
    })
    .join('\n');

  return lines;
}

function composeCategoryEmailText(
  categories: ExportCategoryKey[],
  data: Record<string, unknown[]>,
): string {
  const selectedCategories = EXPORT_CATEGORIES.filter((c) => categories.includes(c.key));

  const sectionsText = selectedCategories
    .map((cat) => {
      const icon = CATEGORY_ICONS[cat.key] ?? '📋';
      const items = data[cat.key] as Record<string, unknown>[] | undefined;
      if (!items || items.length === 0) {
        return `${icon} ${cat.label}\n  Nenhum dado disponível.`;
      }

      const displayItems = items.slice(0, 20);
      const itemsText = displayItems
        .map((item) => buildCategoryItemText(cat.key, item))
        .join('\n—\n');

      const countNote = items.length > 20 ? `\n  (Exibindo 20 de ${items.length} registros.)` : '';
      return `${icon} ${cat.label} (${items.length})\n${itemsText}${countNote}`;
    })
    .join('\n\n━━━━━━━━━━━━━━━━━━\n\n');

  return `📋 Saude10 — Relatório de Dados\n📂 Categorias: ${selectedCategories.map((c) => c.label).join(', ')}\n\n━━━━━━━━━━━━━━━━━━\n\n${sectionsText}\n\n━━━━━━━━━━━━━━━━━━\n\n🤖 Relatório gerado automaticamente pelo app Saude10.`;
}

export async function sendCategoryReportEmail(
  realm: Realm,
  userId: string,
  categories: ExportCategoryKey[],
  userName: string,
  userEmail: string,
): Promise<{ sent: boolean; method: 'mail' | 'share' }> {
  const dataPayload: Record<string, unknown[]> = {};
  const selectedCategories = EXPORT_CATEGORIES.filter((c) => categories.includes(c.key));

  for (const category of selectedCategories) {
    try {
      const collection = realm.objects(category.entityType);
      dataPayload[category.key] = await normalizeRealmCollection(collection as Realm.Results<any>);
    } catch (error) {
      console.warn('[sendCategoryReportEmail] failed to export', category.entityType, error);
      dataPayload[category.key] = [];
    }
  }

  const bodyHtml = composeCategoryEmailHtml(categories, dataPayload);
  const bodyText = composeCategoryEmailText(categories, dataPayload);
  const subject = `Relatório de Dados — Saude10 (${selectedCategories.map((c) => c.label).join(', ')})`;

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