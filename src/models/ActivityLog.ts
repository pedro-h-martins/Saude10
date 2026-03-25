import { Realm } from '@realm/react';

export class ActivityLog extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  date!: string;
  steps!: number;
  distance!: number;
  updatedAt!: Date;

  static schema = {
    name: 'ActivityLog',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      date: { type: 'string', indexed: true },
      steps: { type: 'int', default: 0 },
      distance: { type: 'double', default: 0 },
      updatedAt: 'date',
    },
  };
}
