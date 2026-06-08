import { RecipeCard } from '@/components/RecipeCard';
import { useTheme } from '@/context/ThemeContext';
import { useRecipes } from '@/hooks/useRecipes';
import { Recipe } from '@/models/Recipe';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecipesScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { categories, getRecipesByCategory, toggleFavorite, favorites } = useRecipes();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const recipes = showFavoritesOnly 
    ? favorites 
    : getRecipesByCategory(selectedCategory);

  const renderRecipeDetails = () => {
    if (!selectedRecipe) return null;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={!!selectedRecipe}
        onRequestClose={() => setSelectedRecipe(null)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
            <TouchableOpacity onPress={() => setSelectedRecipe(null)}>
              <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>{selectedRecipe.title}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(selectedRecipe)}>
              <Ionicons
                name={selectedRecipe.isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={selectedRecipe.isFavorite ? colors.error : colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={[styles.recipeMeta, { backgroundColor: colors.background }]}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>Tempo</Text>
                <Text style={[styles.metaValue, { color: colors.onSurface }]}>{selectedRecipe.prepTime || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={20} color={colors.primary} />
                <Text style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>Calorias</Text>
                <Text style={[styles.metaValue, { color: colors.onSurface }]}>{selectedRecipe.calories || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                <Text style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>Categoria</Text>
                <Text style={[styles.metaValue, { color: colors.onSurface }]}>{selectedRecipe.category}</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Ingredientes</Text>
            <Text style={[styles.ingredientsText, { color: colors.onSurface }]}>
              {selectedRecipe.ingredients.split(';').map(i => `• ${i.trim()}`).join('\n')}
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Modo de Preparo</Text>
            <Text style={[styles.instructionsText, { color: colors.onSurface }]}>{selectedRecipe.instructions}</Text>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Receitas Saudáveis</Text>
        <TouchableOpacity
          style={[styles.favoriteToggle, { borderColor: colors.primary }, showFavoritesOnly && { backgroundColor: colors.primary }]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons
            name={showFavoritesOnly ? "heart" : "heart-outline"}
            size={20}
            color={showFavoritesOnly ? colors.onPrimary : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {!showFavoritesOnly && (
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
                  selectedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.categoryBtnText,
                  { color: colors.onSurfaceVariant },
                  selectedCategory === cat && { color: colors.onPrimary, fontWeight: 'bold' }
                ]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {showFavoritesOnly && (
        <View style={styles.favoritesHeader}>
          <Text style={[styles.favoritesTitle, { color: colors.onSurface }]}>Meus Favoritos</Text>
        </View>
      )}

      <FlatList
        data={recipes}
        keyExtractor={(item) => item._id.toHexString()}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => setSelectedRecipe(item)}
            onToggleFavorite={() => toggleFavorite(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={colors.outlineVariant} />
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {showFavoritesOnly ? 'Você ainda não tem receitas favoritas.' : 'Nenhuma receita encontrada.'}
            </Text>
          </View>
        }
      />

      {renderRecipeDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  favoriteToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    paddingVertical: 10,
    paddingLeft: 20,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryBtnText: {
    fontSize: 14,
  },
  favoritesHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  favoritesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  modalBody: {
    padding: 20,
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    padding: 15,
    borderRadius: 12,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  ingredientsText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },
});
