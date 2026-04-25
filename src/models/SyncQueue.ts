import { Realm } from '@realm/react';

export class SyncQueue extends Realm.Object<SyncQueue> {
  _id!: Realm.BSON.ObjectId;
  entityType!: string;
  entityId!: string;
  operation!: 'CREATE' | 'UPDATE' | 'DELETE';
  payload!: string;
  createdAt!: Date;
  retryCount!: number;

  static schema: Realm.ObjectSchema = {
    name: 'SyncQueue',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      entityType: 'string',
      entityId: 'string',
      operation: 'string',
      payload: 'string',
      createdAt: 'date',
      retryCount: { type: 'int', default: 0 },
    },
  };
}
