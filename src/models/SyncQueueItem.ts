import { Realm } from '@realm/react';

export class SyncQueueItem extends Realm.Object<SyncQueueItem> {
  _id!: Realm.BSON.ObjectId;
  userId!: string;
  entityType!: string;
  entityId!: string;
  operation!: 'set' | 'delete';
  payload?: any;
  status!: 'pending' | 'failed';
  attempts!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'SyncQueueItem',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      userId: 'string',
      entityType: 'string',
      entityId: 'string',
      operation: 'string',
      payload: 'mixed?',
      status: 'string',
      attempts: { type: 'int', default: 0 },
      createdAt: 'date',
      updatedAt: 'date',
    },
  };
}
