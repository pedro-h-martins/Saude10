import { Realm } from '@realm/react';

export class HydrationLog extends Realm.Object<HydrationLog> {
  _id!: Realm.BSON.ObjectId;
  amount!: number;
  timestamp!: Date;
  userId!: string;

  static schema: Realm.ObjectSchema = {
    name: 'HydrationLog',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      amount: 'int',
      timestamp: 'date',
      userId: 'string',
    },
  };
}
