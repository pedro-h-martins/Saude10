import { Realm } from '@realm/react';

export class MeditationLog extends Realm.Object<MeditationLog> {
  _id!: Realm.BSON.ObjectId;
  audioId!: string;
  category!: string;
  completedAt!: Date;
  durationSeconds!: number;

  static schema: Realm.ObjectSchema = {
    name: 'MeditationLog',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      audioId: 'string',
      category: 'string',
      completedAt: 'date',
      durationSeconds: 'int',
    },
  };
}
