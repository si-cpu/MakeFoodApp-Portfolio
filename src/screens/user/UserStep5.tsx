import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip } from 'react-native-paper';
import { theme } from '../../theme/theme';

interface UserStep5Props {
  calories: string;
  protein: string;
  fat: string;
  carbohydrates: string;
  presetIdx: number | null;
  onCaloriesChange: (value: string) => void;
  onProteinChange: (value: string) => void;
  onFatChange: (value: string) => void;
  onCarbohydratesChange: (value: string) => void;
  onPresetSelect: (presetIdx: number) => void;
}

const nutritionPresets = [
  {
    label: '일반 건강',
    value: { carbohydrates: 50, protein: 20, fat: 30 },
    icon: 'fitness-outline',
    color: theme.colors.success,
    description: '균형 잡힌 일반적인 영양 비율'
  },
  {
    label: '다이어트',
    value: { carbohydrates: 30, protein: 40, fat: 30 },
    icon: 'scale-outline',
    color: theme.colors.primary,
    description: '체중 감량을 위한 고단백 저탄수화물'
  },
  {
    label: '근육 증가',
    value: { carbohydrates: 50, protein: 35, fat: 15 },
    icon: 'barbell-outline',
    color: theme.colors.warning,
    description: '근육량 증가를 위한 고단백 비율'
  },
  {
    label: '케토제닉',
    value: { carbohydrates: 10, protein: 20, fat: 70 },
    icon: 'leaf-outline',
    color: theme.colors.secondary,
    description: '극저탄수화물 고지방 식단'
  },
];

const UserStep5 = memo(({
  calories,
  protein,
  fat,
  carbohydrates,
  presetIdx,
  onCaloriesChange,
  onProteinChange,
  onFatChange,
  onCarbohydratesChange,
  onPresetSelect
}: UserStep5Props) => {
  console.log('🔄 UserStep5 리렌더링');

  const handlePresetSelect = useCallback((idx: number) => {
    LayoutAnimation.easeInEaseOut();
    onPresetSelect(idx);
  }, [onPresetSelect]);

  const totalPercentage = (Number(protein) || 0) + (Number(fat) || 0) + (Number(carbohydrates) || 0);
  const isValidPercentage = totalPercentage === 100;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="nutrition-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>영양 비율</Text>
        </View>
        
        <Text style={styles.label}>영양 프리셋</Text>
        <View style={styles.presetRow}>
          {nutritionPresets.map((preset, i) => (
            <Chip
              key={preset.label}
              selected={presetIdx === i}
              onPress={() => handlePresetSelect(i)}
              style={[
                styles.presetChip,
                presetIdx === i && styles.presetChipSelected
              ]}
              textStyle={[
                styles.presetChipText,
                presetIdx === i && styles.presetChipTextSelected
              ]}
              icon={preset.icon}
            >
              {preset.label}
            </Chip>
          ))}
        </View>

        {presetIdx !== null && (
          <View style={styles.presetDescription}>
            <Text style={styles.presetDescriptionText}>
              {nutritionPresets[presetIdx]?.description}
            </Text>
          </View>
        )}
        
        <Text style={styles.label}>상세 설정</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutriBox}>
            <Text style={styles.nutriLabel}>칼로리 (kcal)</Text>
            <TextInput
              style={styles.nutriInput}
              keyboardType="number-pad"
              value={calories}
              onChangeText={onCaloriesChange}
              placeholder="2000"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <View style={styles.nutriBox}>
            <Text style={styles.nutriLabel}>탄수화물 (%)</Text>
            <TextInput
              style={styles.nutriInput}
              keyboardType="number-pad"
              value={carbohydrates}
              onChangeText={onCarbohydratesChange}
              placeholder="50"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <View style={styles.nutriBox}>
            <Text style={styles.nutriLabel}>단백질 (%)</Text>
            <TextInput
              style={styles.nutriInput}
              keyboardType="number-pad"
              value={protein}
              onChangeText={onProteinChange}
              placeholder="20"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <View style={styles.nutriBox}>
            <Text style={styles.nutriLabel}>지방 (%)</Text>
            <TextInput
              style={styles.nutriInput}
              keyboardType="number-pad"
              value={fat}
              onChangeText={onFatChange}
              placeholder="30"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.percentageInfo}>
          <Text style={[
            styles.percentageText,
            isValidPercentage ? styles.percentageValid : styles.percentageInvalid
          ]}>
            총 비율: {totalPercentage}%
          </Text>
          {!isValidPercentage && (
            <Text style={styles.percentageWarning}>
              ⚠️ 영양소 비율의 합이 100%가 되어야 합니다
            </Text>
          )}
        </View>
        
        <Text style={styles.helperText}>
          • 영양 프리셋을 선택하면 자동으로 비율이 설정됩니다{'\n'}
          • 개별 설정도 가능하며, 총 비율은 100%가 되어야 합니다{'\n'}
          • 칼로리는 일일 목표 칼로리를 입력해주세요{'\n'}
          • 설정된 영양 비율에 따라 맞춤형 레시피를 추천받을 수 있습니다
        </Text>
      </Card.Content>
    </Card>
  );
});

UserStep5.displayName = 'UserStep5';

// React DevTools
UserStep5.whyDidYouRender = true;

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
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  presetChip: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  presetChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  presetChipText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.small,
  },
  presetChipTextSelected: {
    color: theme.colors.white,
  },
  presetDescription: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  presetDescriptionText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  nutriBox: {
    width: '48%',
    marginBottom: theme.spacing.sm,
  },
  nutriLabel: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  nutriInput: {
    height: 48,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
    ...theme.shadows.sm,
  },
  percentageInfo: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  percentageText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.xs,
  },
  percentageValid: {
    color: theme.colors.success,
  },
  percentageInvalid: {
    color: theme.colors.error,
  },
  percentageWarning: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center',
  },
  helperText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamily.regular,
  },
});

export default UserStep5; 