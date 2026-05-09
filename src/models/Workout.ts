import { Realm } from '@realm/react';

export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'custom';

export class Workout extends Realm.Object<Workout> {
  _id!: Realm.BSON.ObjectId;
  title!: string;
  instructions!: string;
  isCompleted!: boolean;
  isPredefined!: boolean;
  isRecurring!: boolean;
  recurrenceRule?: RecurrenceRule;
  createdAt!: Date;
  completedAt?: Date;
  lastCompletedAt?: Date;
  nextOccurrence?: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Workout',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      title: 'string',
      instructions: 'string',
      isCompleted: { type: 'bool', default: false },
      isPredefined: { type: 'bool', default: false },
      isRecurring: { type: 'bool', default: false },
      recurrenceRule: 'string?',
      createdAt: { type: 'date', default: () => new Date() },
      completedAt: 'date?',
      lastCompletedAt: 'date?',
      nextOccurrence: 'date?',
    },
  };
}
