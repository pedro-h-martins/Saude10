import { Realm } from '@realm/react';

export class PomodoroLog extends Realm.Object<PomodoroLog> {
  _id!: Realm.BSON.ObjectId;
  type!: 'focus' | 'break';
  duration!: number;
  completedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'PomodoroLog',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      type: 'string',
      duration: 'int',
      completedAt: 'date',
    },
  };
}
