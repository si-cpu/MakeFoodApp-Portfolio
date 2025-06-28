import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, SegmentedButtons, Chip } from 'react-native-paper';
import { theme } from '../../theme/theme';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface UserStep3Props {
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  tools: string[];
  onGenderChange: (value: 'MALE' | 'FEMALE' | 'OTHER') => void;
  onToolsChange: (tools: string[]) => void;
  ingredients: Ingredient[];
}

const UserStep3 = memo(({ gender, tools, onGenderChange, onToolsChange, ingredients }: UserStep3Props) => {
  console.log('🔄 UserStep3 리렌더링');


  const toggleTool = useCallback((toolName: string) => {
    if (tools.includes(toolName)) {
      onToolsChange(tools.filter(t => t !== toolName));
    } else {
      onToolsChange([...tools, toolName]);
    }
    LayoutAnimation.easeInEaseOut();
  }, [tools, onToolsChange]);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>개인 정보</Text>
        </View>
        
        <Text style={styles.label}>성별</Text>
        <SegmentedButtons
          value={gender}
          onValueChange={onGenderChange}
          buttons={[
            { 
              value: 'MALE', 
              label: '남성',
              icon: 'account-outline'
            },
            { 
              value: 'FEMALE', 
              label: '여성',
              icon: 'account-outline'
            },
            { 
              value: 'OTHER', 
              label: '기타',
              icon: 'account-question-outline'
            },
          ]}
          style={styles.segmentedButtons}
        />
      
        
        <Text style={styles.helperText}>
          • 성별 정보는 영양 권장량 계산에 사용됩니다{'\n'}
          • 보유한 조리도구를 선택하면 맞춤형 레시피를 추천받을 수 있습니다{'\n'}
          • 언제든지 설정에서 변경할 수 있습니다
        </Text>
      </Card.Content>
    </Card>
  );
});

UserStep3.displayName = 'UserStep3';

// React DevTools
UserStep3.whyDidYouRender = true;

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
    marginBottom: theme.spacing.md,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.xl,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  toolButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  toolButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toolButtonText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
  },
  toolButtonTextSelected: {
    color: theme.colors.white,
  },
  selectedToolsContainer: {
    marginBottom: theme.spacing.lg,
  },
  selectedToolsLabel: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  toolChip: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  chipText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.small,
  },
  helperText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamily.regular,
  },
});

export default UserStep3; 