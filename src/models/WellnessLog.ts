import { Realm } from '@realm/react';

export class WellnessLog extends Realm.Object<WellnessLog> {
  _id!: Realm.BSON.ObjectId;
  rating!: number;
  notes?: string;
  timestamp!: Date;
  userId!: string;

  static schema: Realm.ObjectSchema = {
    name: 'WellnessLog',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      rating: 'int',
      notes: 'string?',
      timestamp: 'date',
      userId: 'string',
    },
  };
}