import { Realm } from '@realm/react';

export type GuidedAudioCategory = 'anxiety' | 'focus' | 'sleep' | 'wind' | 'waves' | 'forest';
export type GuidedAudioType = 'guided' | 'ambient';

export class GuidedAudio extends Realm.Object<GuidedAudio> {
  _id!: Realm.BSON.ObjectId;
  title!: string;
  description?: string;
  category?: GuidedAudioCategory;
  type!: GuidedAudioType;
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
      type: { type: 'string', default: 'ambient' },
      remoteUrl: 'string?',
      localUri: 'string?',
      duration: 'int?',
      status: 'string',
      createdAt: 'date',
      updatedAt: 'date',
    },
  };
}
