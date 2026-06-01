import { Realm } from '@realm/react';

export class GuidedAudio extends Realm.Object<GuidedAudio> {
  _id!: Realm.BSON.ObjectId;
  title!: string;
  description?: string;
  category?: 'wind' | 'waves' | 'forest';
  remoteUrl?: string;
  localUri?: string;
  duration?: number;
  status!: 'available' | 'downloaded' | 'pending' | 'failed';
  createdAt!: Date;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'GuidedAudio',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      title: 'string',
      description: 'string?',
      category: 'string?',
      remoteUrl: 'string?',
      localUri: 'string?',
      duration: 'int?',
      status: 'string',
      createdAt: 'date',
      updatedAt: 'date',
    },
  };
}
