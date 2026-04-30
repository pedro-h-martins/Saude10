import { useQuery, useRealm } from '@/context/RealmProvider';
import { useSync } from '@/hooks/useSync';
import { Workout } from '@/models/Workout';
import { Realm } from '@realm/react';

function computeNextOccurrence(reference: Date, recurrenceRule?: Workout['recurrenceRule']) {
  const next = new Date(reference);
  switch (recurrenceRule) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'daily':
    default:
      next.setDate(next.getDate() + 1);
      break;
  }
  return next;
}

export function isWorkoutDue(workout: Workout) {
  if (!workout.isRecurring) {
    return !workout.isCompleted;
  }

  if (!workout.nextOccurrence) {
    return true;
  }

  return new Date() >= workout.nextOccurrence;
}

export function isWorkoutCompleted(workout: Workout) {
  if (!workout.isRecurring) {
    return workout.isCompleted;
  }

  if (!workout.nextOccurrence) {
    return false;
  }

  return workout.isCompleted && new Date() < workout.nextOccurrence;
}

export function getWorkoutStatusText(workout: Workout) {
  if (!workout.isRecurring) {
    return workout.isCompleted ? 'Concluído' : 'Pendente';
  }

  if (isWorkoutCompleted(workout)) {
    return 'Concluído';
  }

  if (!isWorkoutDue(workout)) {
    return 'Agendado';
  }

  return 'Pendente';
}

export function getWorkoutRecurrenceLabel(workout: Workout) {
  if (!workout.isRecurring) {
    return 'Treino único';
  }

  switch (workout.recurrenceRule) {
    case 'daily':
      return 'Recorrência diária';
    case 'weekly':
      return 'Recorrência semanal';
    case 'monthly':
      return 'Recorrência mensal';
    default:
      return 'Recorrência personalizada';
  }
}

export function getNextOccurrenceLabel(workout: Workout) {
  if (!workout.nextOccurrence) {
    return 'Próxima sessão não agendada';
  }

  return `Próxima sessão: ${workout.nextOccurrence.toLocaleDateString('pt-BR')} ${workout.nextOccurrence.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function useWorkouts() {
  const realm = useRealm();
  const workouts = useQuery(Workout);
  const { save } = useSync();

  const toggleWorkoutCompleted = async (id: Realm.BSON.ObjectId) => {
    const workout = realm.objectForPrimaryKey(Workout, id);
    if (!workout) return;

    const now = new Date();

    if (workout.isRecurring) {
      const nextOccurrence = computeNextOccurrence(workout.nextOccurrence || now, workout.recurrenceRule);
      await save('Workout', id.toHexString(), {
        isCompleted: true,
        completedAt: now,
        lastCompletedAt: now,
        nextOccurrence,
      });
      return;
    }

    await save('Workout', id.toHexString(), {
      isCompleted: !workout.isCompleted,
      completedAt: workout.isCompleted ? null : now,
    });
  };

  return {
    workouts,
    toggleWorkoutCompleted,
  };
}
