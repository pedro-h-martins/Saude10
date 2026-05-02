import { Realm } from '@realm/react';

export class FeedbackSurvey extends Realm.Object<FeedbackSurvey> {
  _id!: Realm.BSON.ObjectId;
  rating!: number;
  feedback!: string;
  type!: string;
  context?: string;
  createdAt!: Date;
  updatedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'FeedbackSurvey',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      rating: 'int',
      feedback: 'string',
      type: 'string',
      context: 'string?',
      createdAt: 'date',
      updatedAt: 'date',
    },
  };
}
