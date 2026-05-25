import { RecipeCard } from '@/components/RecipeCard';
import { Colors } from '@/constants/Colors';
import { useRecipes } from '@/hooks/useRecipes';
import { Recipe } from '@/models/Recipe';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecipesScreen() {
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
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedRecipe(null)}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(selectedRecipe)}>
              <Ionicons 
                name={selectedRecipe.isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={selectedRecipe.isFavorite ? Colors.error : Colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.recipeMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <Text style={styles.metaLabel}>Tempo</Text>
                <Text style={styles.metaValue}>{selectedRecipe.prepTime || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={20} color={Colors.primary} />
                <Text style={styles.metaLabel}>Calorias</Text>
                <Text style={styles.metaValue}>{selectedRecipe.calories || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
                <Text style={styles.metaLabel}>Categoria</Text>
                <Text style={styles.metaValue}>{selectedRecipe.category}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <Text style={styles.ingredientsText}>
              {selectedRecipe.ingredients.split(';').map(i => `• ${i.trim()}`).join('\n')}
            </Text>

            <Text style={styles.sectionTitle}>Modo de Preparo</Text>
            <Text style={styles.instructionsText}>{selectedRecipe.instructions}</Text>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Receitas Saudáveis</Text>
        <TouchableOpacity 
          style={[styles.favoriteToggle, showFavoritesOnly && styles.favoriteToggleActive]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons 
            name={showFavoritesOnly ? "heart" : "heart-outline"} 
            size={20} 
            color={showFavoritesOnly ? Colors.white : Colors.primary} 
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
                  selectedCategory === cat && styles.categoryBtnActive
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.categoryBtnText,
                  selectedCategory === cat && styles.categoryBtnTextActive
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
          <Text style={styles.favoritesTitle}>Meus Favoritos</Text>
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
            <Ionicons name="restaurant-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyText}>
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
    backgroundColor: Colors.background,
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
    color: Colors.text,
  },
  favoriteToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteToggleActive: {
    backgroundColor: Colors.primary,
  },
  categoryContainer: {
    paddingVertical: 10,
    paddingLeft: 20,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoryBtnTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  favoritesHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  favoritesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
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
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 12,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    marginTop: 10,
  },
  ingredientsText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 40,
  },
});
