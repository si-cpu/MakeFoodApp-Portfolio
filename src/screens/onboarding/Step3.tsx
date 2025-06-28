import React from 'react';
import { View, Text } from 'react-native';
import { SegmentedButtons, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface Step3Props {
  // 상태값들
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  
  // 핸들러들
  onGenderChange: (value: 'MALE' | 'FEMALE' | 'OTHER') => void;
}

const Step3 = React.memo(({
  gender,
  onGenderChange
}: Step3Props) => {
  console.log('🔄 Step3 리렌더링');

  return (
    <Card style={styles.modernCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>개인 정보</Text>
        </View>
        
        <Text style={styles.modernLabel}>성별</Text>
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
          💡 개인 정보 안내{'\n'}
          • 성별 정보는 영양 권장량 계산에 사용됩니다{'\n'}
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
    marginBottom: theme.spacing.md,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.xl,
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
Step3.whyDidYouRender = true;

export default Step3; 