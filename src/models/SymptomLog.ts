import { Realm } from '@realm/react';

export class SymptomLog extends Realm.Object<SymptomLog> {
  _id!: Realm.BSON.ObjectId;
  description!: string;
  timestamp!: Date;
  userId!: string;

  static schema: Realm.ObjectSchema = {
    name: 'SymptomLog',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      description: 'string',
      timestamp: 'date',
      userId: 'string',
    },
  };
}
