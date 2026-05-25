import { Colors } from '@/constants/Colors';
import { Recipe } from '@/models/Recipe';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress, onToggleFavorite }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="restaurant-outline" size={40} color={Colors.primary} />
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.favoriteButton} 
        onPress={onToggleFavorite}
      >
        <Ionicons 
          name={recipe.isFavorite ? "heart" : "heart-outline"} 
          size={24} 
          color={recipe.isFavorite ? Colors.error : Colors.textSecondary} 
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.category}>{recipe.category.toUpperCase()}</Text>
        <Text style={styles.title}>{recipe.title}</Text>
        
        <View style={styles.footer}>
          {recipe.prepTime && (
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{recipe.prepTime}</Text>
            </View>
          )}
          {recipe.calories && (
            <View style={styles.infoItem}>
              <Ionicons name="flame-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{recipe.calories}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 150,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 6,
  },
  content: {
    padding: 12,
  },
  category: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});
