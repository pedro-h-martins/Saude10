import { Realm } from '@realm/react';

export class MealLog extends Realm.Object<MealLog> {
  _id!: Realm.BSON.ObjectId;
  userId!: string;
  timestamp!: Date;
  name!: string;
  mealType!: string;
  calories!: number;
  protein?: number;
  carbs?: number;
  fat?: number;

  static schema: Realm.ObjectSchema = {
    name: 'MealLog',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      userId: 'string',
      timestamp: 'date',
      name: 'string',
      mealType: 'string',
      calories: 'int',
      protein: 'double?',
      carbs: 'double?',
      fat: 'double?',
    },
  };
}
