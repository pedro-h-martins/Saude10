import Realm from 'realm';
import { Goal } from './Goal';

export class UserProfile extends Realm.Object<UserProfile> {
  _id!: string;
  name!: string;
  email!: string;
  birthDate!: Date;
  weight!: number;
  height!: number;
  currentGoalId?: string;
  goals!: Realm.List<Goal>;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'UserProfile',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      name: 'string',
      email: 'string',
      birthDate: 'date',
      weight: 'double',
      height: 'double',
      currentGoalId: 'string?',
      goals: 'Goal[]',
      updatedAt: 'date',
    },
  };
}
