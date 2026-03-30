import { Realm } from '@realm/react';

export class Reminder extends Realm.Object<Reminder> {
  _id!: Realm.BSON.ObjectId;
  title!: string;
  time!: string;
  isEnabled!: boolean;
  type!: 'water' | 'meditation' | 'medicine' | 'custom';
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Reminder',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      title: 'string',
      time: 'string',
      isEnabled: { type: 'bool', default: true },
      type: { type: 'string', default: 'custom' },
      createdAt: { type: 'date', default: () => new Date() },
    },
  };
}
