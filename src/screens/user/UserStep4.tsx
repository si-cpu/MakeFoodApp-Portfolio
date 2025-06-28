import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip } from 'react-native-paper';
import { theme } from '../../theme/theme';
import { RecipeCategory } from '../../types/recipe';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface UserStep4Props {
  preferences: string[];
  dislikes: string[];
  allergies: string[];
  preferredCategories: RecipeCategory[];
  preferenceSearch: string;
  dislikeSearch: string;
  allergySearch: string;
  ingredients: Ingredient[];
  onPreferencesChange: (preferences: string[]) => void;
  onDislikesChange: (dislikes: string[]) => void;
  onAllergiesChange: (allergies: string[]) => void;
  onPreferredCategoriesChange: (categories: RecipeCategory[]) => void;
  onPreferenceSearchChange: (search: string) => void;
  onDislikeSearchChange: (search: string) => void;
  onAllergySearchChange: (search: string) => void;
}

const UserStep4 = memo(({
  preferences,
  dislikes,
  allergies,
  preferredCategories,
  preferenceSearch,
  dislikeSearch,
  allergySearch,
  ingredients,
  onPreferencesChange,
  onDislikesChange,
  onAllergiesChange,
  onPreferredCategoriesChange,
  onPreferenceSearchChange,
  onDislikeSearchChange,
  onAllergySearchChange
}: UserStep4Props) => {
  console.log('🔄 UserStep4 리렌더링');

  const toggleSelect = useCallback((ingredientName: string, key: 'preferences' | 'dislikes' | 'allergies') => {
    const currentList = key === 'preferences' ? preferences : key === 'dislikes' ? dislikes : allergies;
    
    // 현재 선택을 해제하는 경우
    if (currentList.includes(ingredientName)) {
      if (key === 'preferences') onPreferencesChange(preferences.filter(n => n !== ingredientName));
      else if (key === 'dislikes') onDislikesChange(dislikes.filter(n => n !== ingredientName));
      else onAllergiesChange(allergies.filter(n => n !== ingredientName));
      LayoutAnimation.easeInEaseOut();
      return;
    }

    // 다른 두 리스트에서 동일 재료 제거 후 선택 리스트에 추가
    const newPreferences = key === 'preferences' ? [...preferences, ingredientName] : preferences.filter(n => n !== ingredientName);
    const newDislikes = key === 'dislikes' ? [...dislikes, ingredientName] : dislikes.filter(n => n !== ingredientName);
    const newAllergies = key === 'allergies' ? [...allergies, ingredientName] : allergies.filter(n => n !== ingredientName);
    
    onPreferencesChange(newPreferences);
    onDislikesChange(newDislikes);
    onAllergiesChange(newAllergies);
    
    LayoutAnimation.easeInEaseOut();
  }, [preferences, dislikes, allergies, onPreferencesChange, onDislikesChange, onAllergiesChange]);

  const renderSuggestion = useCallback((search: string, key: 'preferences' | 'dislikes' | 'allergies') => {
    if (search.trim().length < 1) return null;
    const filtered = ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 20);
    if (!filtered.length) return null;
    return (
      <View style={styles.suggestionBox}>
        {filtered.map(ing => (
          <TouchableOpacity key={ing.id} onPress={() => {
            toggleSelect(ing.name, key);
            if (key === 'preferences') onPreferenceSearchChange('');
            if (key === 'dislikes') onDislikeSearchChange('');
            if (key === 'allergies') onAllergySearchChange('');
          }} style={styles.suggestionItem}>
            <Text style={styles.suggestionText}>{ing.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [ingredients, toggleSelect, onPreferenceSearchChange, onDislikeSearchChange, onAllergySearchChange]);

  const CategoryButton = useCallback(({ cat }: { cat: RecipeCategory }) => (
    <TouchableOpacity
      key={cat}
      style={[
        styles.categoryButton,
        preferredCategories.includes(cat) && styles.categoryButtonSelected
      ]}
      onPress={() => onPreferredCategoriesChange(
        preferredCategories.includes(cat)
          ? preferredCategories.filter(c => c !== cat)
          : [...preferredCategories, cat]
      )}
    >
      <Text style={[
        styles.categoryButtonText,
        preferredCategories.includes(cat) && styles.categoryButtonTextSelected
      ]}>
        {cat}
      </Text>
    </TouchableOpacity>
  ), [preferredCategories, onPreferredCategoriesChange]);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="restaurant-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>재료 선호도</Text>
        </View>
        
        {/* 선호 재료 */}
        <Text style={styles.label}>선호 재료</Text>
        <TextInput
          placeholder="재료 검색..."
          value={preferenceSearch}
          onChangeText={onPreferenceSearchChange}
          style={styles.searchInput}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {renderSuggestion(preferenceSearch, 'preferences')}
        <View style={styles.chipRow}>
          {preferences.map(name => (
            <Chip
              key={name}
              style={styles.preferenceChip}
              onClose={() => toggleSelect(name, 'preferences')}
              textStyle={styles.chipText}
            >
              {name}
            </Chip>
          ))}
        </View>

        {/* 비선호 재료 */}
        <Text style={styles.label}>비선호 재료</Text>
        <TextInput
          placeholder="재료 검색..."
          value={dislikeSearch}
          onChangeText={onDislikeSearchChange}
          style={styles.searchInput}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {renderSuggestion(dislikeSearch, 'dislikes')}
        <View style={styles.chipRow}>
          {dislikes.map(name => (
            <Chip
              key={name}
              style={styles.dislikeChip}
              onClose={() => toggleSelect(name, 'dislikes')}
              textStyle={styles.chipText}
            >
              {name}
            </Chip>
          ))}
        </View>

        {/* 알레르기 재료 */}
        <Text style={styles.label}>알레르기 재료</Text>
        <TextInput
          placeholder="재료 검색..."
          value={allergySearch}
          onChangeText={onAllergySearchChange}
          style={styles.searchInput}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {renderSuggestion(allergySearch, 'allergies')}
        <View style={styles.chipRow}>
          {allergies.map(name => (
            <Chip
              key={name}
              style={styles.allergyChip}
              onClose={() => toggleSelect(name, 'allergies')}
              textStyle={styles.chipText}
            >
              {name}
            </Chip>
          ))}
        </View>

        {/* 선호 카테고리 */}
        <Text style={styles.label}>선호 카테고리</Text>
        <View style={styles.categoryGrid}>
          {Object.values(RecipeCategory).map(cat => (
            <CategoryButton key={cat} cat={cat as RecipeCategory} />
          ))}
        </View>
        
        <Text style={styles.helperText}>
          • 선호하는 재료를 선택하면 해당 재료가 포함된 레시피를 우선 추천합니다{'\n'}
          • 비선호 재료는 레시피 추천에서 제외됩니다{'\n'}
          • 알레르기 재료는 절대 포함되지 않습니다{'\n'}
          • 모든 설정은 선택사항이며 언제든지 변경 가능합니다
        </Text>
      </Card.Content>
    </Card>
  );
});

UserStep4.displayName = 'UserStep4';

// React DevTools
UserStep4.whyDidYouRender = true;

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
    fontFamily: theme.typography.fontFamily.regular,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  suggestionBox: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    maxHeight: 150,
    ...theme.shadows.sm,
  },
  suggestionItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionText: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  preferenceChip: {
    backgroundColor: theme.colors.success,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  dislikeChip: {
    backgroundColor: theme.colors.warning,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  allergyChip: {
    backgroundColor: theme.colors.error,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  chipText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.small,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  categoryButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  categoryButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
  },
  categoryButtonTextSelected: {
    color: theme.colors.white,
  },
  helperText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamily.regular,
  },
});

export default UserStep4; 