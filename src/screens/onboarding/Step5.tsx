import React from 'react';
import { View, Text, TextInput, LayoutAnimation } from 'react-native';
import { Chip, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface Step5Props {
  // 상태값들
  calories: string;
  protein: string;
  fat: string;
  carbohydrates: string;
  presetIdx: number | null;
  
  // 핸들러들
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
  },
  {
    label: '다이어트',
    value: { carbohydrates: 30, protein: 40, fat: 30 },
    icon: 'scale-outline',
    color: theme.colors.primary,
  },
  {
    label: '근육 증가',
    value: { carbohydrates: 50, protein: 35, fat: 15 },
    icon: 'barbell-outline',
    color: theme.colors.warning,
  },
  {
    label: '케토제닉',
    value: { carbohydrates: 10, protein: 20, fat: 70 },
    icon: 'leaf-outline',
    color: theme.colors.secondary,
  },
];

const Step5 = React.memo(({
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
}: Step5Props) => {
  console.log('🔄 Step5 리렌더링');

  return (
    <Card style={styles.modernCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="nutrition-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>영양 비율</Text>
        </View>
        
        <Text style={styles.modernLabel}>선호 영양성분</Text>
        <View style={styles.presetRow}>
          {nutritionPresets.map((preset, i) => (
            <Chip
              key={preset.label}
              selected={presetIdx === i}
              onPress={() => {
                LayoutAnimation.easeInEaseOut();
                onPresetSelect(i);
              }}
              style={presetIdx === i ? styles.presetChipSelected : styles.presetChip}
              textStyle={presetIdx === i ? styles.presetChipTextSelected : styles.presetChipText}
            >
              {preset.label}
            </Chip>
          ))}
        </View>
        
        <View style={styles.nutritionGrid}>
          <View style={styles.nutriBox}>
            <Text style={styles.nutriLabel}>칼로리(kcal)</Text>
            <TextInput
              style={styles.nutriInput}
              keyboardType="number-pad"
              value={calories}
              onChangeText={onCaloriesChange}
            />
          </View>
          <View style={styles.nutriBox}>
            <Text style={styles.nutriLabel}>탄수화물(%)</Text>
            <TextInput
              style={styles.nutriInput}
              keyboardType="number-pad"
              value={carbohydrates}
              onChangeText={onCarbohydratesChange}
            />
          </View>
          <View style={styles.nutriBox}>
            <Text style={styles.nutriLabel}>단백질(%)</Text>
            <TextInput
              style={styles.nutriInput}
              keyboardType="number-pad"
              value={protein}
              onChangeText={onProteinChange}
            />
          </View>
          <View style={styles.nutriBox}>
            <Text style={styles.nutriLabel}>지방(%)</Text>
            <TextInput
              style={styles.nutriInput}
              keyboardType="number-pad"
              value={fat}
              onChangeText={onFatChange}
            />
          </View>
        </View>
        
        {/* 비율 검증 */}
        <View style={styles.percentageInfo}>
          <Text style={[
            styles.percentageText,
            ((Number(protein) || 0) + (Number(fat) || 0) + (Number(carbohydrates) || 0)) === 100 
              ? styles.percentageValid : styles.percentageInvalid
          ]}>
            총 비율: {(Number(protein) || 0) + (Number(fat) || 0) + (Number(carbohydrates) || 0)}%
          </Text>
          {((Number(protein) || 0) + (Number(fat) || 0) + (Number(carbohydrates) || 0)) !== 100 && (
            <Text style={styles.percentageWarning}>
              ⚠️ 영양소 비율의 합이 100%가 되어야 합니다
            </Text>
          )}
        </View>
        
        <Text style={styles.helperText}>
          💡 영양 비율 안내{'\n'}
          • 영양 프리셋을 선택하면 자동으로 비율이 설정됩니다{'\n'}
          • 개별 설정도 가능하며, 총 비율은 100%가 되어야 합니다{'\n'}
          • 칼로리는 일일 목표 칼로리를 입력해주세요{'\n'}
          • 설정된 영양 비율에 따라 맞춤형 레시피를 추천받을 수 있습니다
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
  },
  presetRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  presetChip: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    marginRight: theme.spacing.xs,
  },
  presetChipSelected: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  presetChipText: {
    color: theme.colors.primary,
  },
  presetChipTextSelected: {
    color: '#fff',
  },
  nutritionGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing.md,
  },
  nutriBox: {
    width: '48%' as const,
    marginBottom: theme.spacing.sm,
  },
  nutriLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: theme.colors.text,
  },
  nutriInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  percentageInfo: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center' as const,
  },
  percentageText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.bold,
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
    marginTop: theme.spacing.xs,
    textAlign: 'center' as const,
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
Step5.whyDidYouRender = true;

export default Step5; 