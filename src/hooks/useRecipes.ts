import { useQuery, useRealm } from '@/context/RealmProvider';
import { Recipe } from '@/models/Recipe';
import { useCallback, useMemo } from 'react';

export function useRecipes() {
  const realm = useRealm();
  const allRecipes = useQuery(Recipe);

  const toggleFavorite = useCallback((recipe: Recipe) => {
    realm.write(() => {
      recipe.isFavorite = !recipe.isFavorite;
    });
  }, [realm]);

  const getRecipesByCategory = useCallback((category: string) => {
    if (category === 'Todos') return allRecipes;
    return allRecipes.filtered('category == $0', category);
  }, [allRecipes]);

  const favorites = useMemo(() => {
    return allRecipes.filtered('isFavorite == true');
  }, [allRecipes]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allRecipes.forEach(r => cats.add(r.category));
    return ['Todos', ...Array.from(cats)];
  }, [allRecipes]);

  return {
    allRecipes,
    favorites,
    categories,
    toggleFavorite,
    getRecipesByCategory,
  };
}
