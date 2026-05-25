import { Realm } from '@realm/react';
import 'react-native-get-random-values';

export class SleepLog extends Realm.Object<SleepLog> {
  _id!: Realm.BSON.ObjectId;
  userId!: string;
  startTime!: Date;
  endTime!: Date;
  quality!: number; // 1-5 scale
  notes?: string;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'SleepLog',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      userId: 'string',
      startTime: 'date',
      endTime: 'date',
      quality: 'int',
      notes: 'string?',
      updatedAt: 'date',
    },
  };
}
