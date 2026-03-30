import { Realm } from '@realm/react';

export class BloodPressure extends Realm.Object<BloodPressure> {
  _id!: Realm.BSON.ObjectId;
  systolic!: number;
  diastolic!: number;
  timestamp!: Date;
  userId!: string;

  static schema: Realm.ObjectSchema = {
    name: 'BloodPressure',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      systolic: 'int',
      diastolic: 'int',
      timestamp: 'date',
      userId: 'string',
    },
  };
}
