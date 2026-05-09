import { Realm } from '@realm/react';

export class ProgressPhoto extends Realm.Object<ProgressPhoto> {
  _id!: Realm.BSON.ObjectId;
  userId!: string;
  capturedAt!: Date;
  localUri!: string;
  remoteUrl?: string;
  status!: 'pending' | 'synced' | 'failed';
  notes?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  createdAt!: Date;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'ProgressPhoto',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      userId: 'string',
      capturedAt: 'date',
      localUri: 'string',
      remoteUrl: 'string?',
      status: 'string',
      notes: 'string?',
      width: 'int?',
      height: 'int?',
      fileSize: 'int?',
      createdAt: 'date',
      updatedAt: 'date',
    },
  };
}
