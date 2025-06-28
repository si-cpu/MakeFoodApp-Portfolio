import React from 'react';
import { View, Text, TouchableOpacity, TextInput, LayoutAnimation } from 'react-native';
import { Chip, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { RecipeCategory } from '../../types/recipe';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface Step4Props {
  // 상태값들
  preferences: string[];
  dislikes: string[];
  allergies: string[];
  preferredCategories: RecipeCategory[];
  preferenceSearch: string;
  dislikeSearch: string;
  allergySearch: string;
  ingredients: Ingredient[];
  
  // 핸들러들
  onPreferencesChange: (preferences: string[]) => void;
  onDislikesChange: (dislikes: string[]) => void;
  onAllergiesChange: (allergies: string[]) => void;
  onPreferredCategoriesChange: (categories: RecipeCategory[]) => void;
  onPreferenceSearchChange: (search: string) => void;
  onDislikeSearchChange: (search: string) => void;
  onAllergySearchChange: (search: string) => void;
}

const Step4 = React.memo(({
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
}: Step4Props) => {
  console.log('🔄 Step4 리렌더링');

  const toggleSelect = (ingredientName: string, key: 'preferences' | 'dislikes' | 'allergies') => {
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
  };

  const renderSuggestion = (search: string, key: 'preferences' | 'dislikes' | 'allergies') => {
    if (search.trim().length < 1) return null;
    const filtered = ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 20);
    if (!filtered.length) return null;
    return (
      <View style={styles.suggestionBox}>
        {filtered.map(ing => (
          <TouchableOpacity key={ing.id} onPress={() => {
            toggleSelect(ing.name, key);
            if (key==='preferences') onPreferenceSearchChange('');
            if (key==='dislikes') onDislikeSearchChange('');
            if (key==='allergies') onAllergySearchChange('');
          }} style={styles.suggestionItem}>
            <Text style={styles.suggestionText}>{ing.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const CategoryButton = ({ cat }: { cat: RecipeCategory }) => (
    <TouchableOpacity
      key={cat}
      style={{
        backgroundColor: preferredCategories.includes(cat) ? theme.colors.primary : '#eee',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
      }}
      onPress={() => onPreferredCategoriesChange(
        preferredCategories.includes(cat)
          ? preferredCategories.filter(c => c !== cat)
          : [...preferredCategories, cat]
      )}
    >
      <Text style={{ color: preferredCategories.includes(cat) ? '#fff' : '#333' }}>{cat}</Text>
    </TouchableOpacity>
  );

  return (
    <Card style={styles.modernCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="restaurant-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>재료 선호도</Text>
        </View>

        {/* 선호 재료 */}
        <Text style={styles.modernLabel}>선호 재료</Text>
        <TextInput
          placeholder="재료 검색..."
          value={preferenceSearch}
          onChangeText={onPreferenceSearchChange}
          style={styles.searchInput}
        />
        {renderSuggestion(preferenceSearch, 'preferences')}
        <View style={styles.chipRow}>
          {preferences.map(name => (
            <Chip key={name} style={styles.modernChip} onClose={() => toggleSelect(name, 'preferences')}>{name}</Chip>
          ))}
        </View>

        {/* 비선호 재료 */}
        <Text style={styles.modernLabel}>비선호 재료</Text>
        <TextInput
          placeholder="재료 검색..."
          value={dislikeSearch}
          onChangeText={onDislikeSearchChange}
          style={styles.searchInput}
        />
        {renderSuggestion(dislikeSearch, 'dislikes')}
        <View style={styles.chipRow}>
          {dislikes.map(name => (
            <Chip key={name} style={styles.modernChipDislike} onClose={() => toggleSelect(name, 'dislikes')}>{name}</Chip>
          ))}
        </View>

        {/* 알레르기 재료 */}
        <Text style={styles.modernLabel}>알레르기 재료</Text>
        <TextInput
          placeholder="재료 검색..."
          value={allergySearch}
          onChangeText={onAllergySearchChange}
          style={styles.searchInput}
        />
        {renderSuggestion(allergySearch, 'allergies')}
        <View style={styles.chipRow}>
          {allergies.map(name => (
            <Chip key={name} style={styles.modernChipAllergy} onClose={() => toggleSelect(name, 'allergies')}>{name}</Chip>
          ))}
        </View>

        {/* 카테고리 */}
        <Text style={styles.modernLabel}>선호 카테고리</Text>
        <View style={styles.categoryGrid}>
          {Object.values(RecipeCategory).map(cat => <CategoryButton key={cat} cat={cat as RecipeCategory} />)}
        </View>
        
        <Text style={styles.helperText}>
          💡 재료 선호도 안내{'\n'}
          • 선호하는 재료를 선택하면 맞춤형 레시피를 추천받을 수 있습니다{'\n'}
          • 알레르기 재료는 레시피에서 제외됩니다{'\n'}
          • 언제든지 설정에서 변경할 수 있습니다
        </Text>
      </Card.Content>
    </Card>
  );
});

const styles = {
  modernCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.md,
    zIndex: 0,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.xl,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  modernLabel: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.medium,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: theme.typography.fontFamily.regular,
  },
  chipRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: theme.spacing.sm,
  },
  modernChip: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  modernChipDislike: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  modernChipAllergy: {
    backgroundColor: theme.colors.warning,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  suggestionBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    maxHeight: 200,
    marginBottom: theme.spacing.sm,
  },
  suggestionItem: {
    padding: theme.spacing.md,
  },
  suggestionText: {
    fontSize: theme.typography.fontSize.medium,
  },
  categoryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: theme.spacing.lg,
  },
  helperText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamily.regular,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
};

// why-did-you-render 추적 활성화
Step4.whyDidYouRender = true;

export default Step4; 