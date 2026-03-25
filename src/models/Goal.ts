import { Realm } from '@realm/react';

export class Goal extends Realm.Object<Goal> {
  _id!: Realm.BSON.ObjectId;
  type!: string;
  title!: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  startDate!: Date;
  endDate?: Date;
  isActive!: boolean;

  static schema: Realm.ObjectSchema = {
    name: 'Goal',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      type: 'string',
      title: 'string',
      targetValue: 'double?',
      currentValue: 'double?',
      unit: 'string?',
      startDate: 'date',
      endDate: 'date?',
      isActive: { type: 'bool', default: true },
    },
  };
}
