import { Realm } from '@realm/react';

export class Recipe extends Realm.Object<Recipe> {
  _id!: Realm.BSON.ObjectId;
  title!: string;
  category!: 'pós-treino' | 'low carb' | 'café da manhã' | 'almoço' | 'jantar' | string;
  ingredients!: string;
  instructions!: string;
  isFavorite!: boolean;
  imageUrl?: string;
  prepTime?: string;
  calories?: string;

  static schema: Realm.ObjectSchema = {
    name: 'Recipe',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      title: 'string',
      category: 'string',
      ingredients: 'string',
      instructions: 'string',
      isFavorite: { type: 'bool', default: false },
      imageUrl: 'string?',
      prepTime: 'string?',
      calories: 'string?',
    },
  };
}
