import React from 'react';
import { View, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Input from '../../components/common/Input';

interface Step2Props {
  // 상태값들
  householdSize: string;
  age: string;
  
  // 핸들러들
  onHouseholdChange: (value: string) => void;
  onAgeChange: (value: string) => void;
}

const HouseholdInput = React.memo(({ 
  onValueChange,
  initialValue = ''
}: {
  onValueChange: (value: string) => void;
  initialValue?: string;
}) => {
  console.log('🔄 HouseholdInput 리렌더링');
  const [localValue, setLocalValue] = React.useState(initialValue);
  
  // initialValue가 변경되면 localValue도 업데이트
  React.useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);
  
  const handleBlur = () => {
    onValueChange(localValue);
  };
  
  const handleTextChange = (value: string) => {
    // 숫자만 입력 허용
    const numericValue = value.replace(/[^0-9]/g, '');
    setLocalValue(numericValue);
  };
  
  return (
    <Input
      value={localValue}
      onChangeText={handleTextChange}
      onBlur={handleBlur}
      placeholder="가구원 수를 입력하세요"
      keyboardType="number-pad"
      style={styles.input}
      maxLength={2}
    />
  );
});

const AgeInput = React.memo(({ 
  onValueChange,
  initialValue = ''
}: {
  onValueChange: (value: string) => void;
  initialValue?: string;
}) => {
  console.log('🔄 AgeInput 리렌더링');
  const [localValue, setLocalValue] = React.useState(initialValue);
  
  // initialValue가 변경되면 localValue도 업데이트
  React.useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);
  
  const handleBlur = () => {
    onValueChange(localValue);
  };
  
  const handleTextChange = (value: string) => {
    // 숫자만 입력 허용
    const numericValue = value.replace(/[^0-9]/g, '');
    setLocalValue(numericValue);
  };
  
  return (
    <Input
      value={localValue}
      onChangeText={handleTextChange}
      onBlur={handleBlur}
      placeholder="나이를 입력하세요"
      keyboardType="number-pad"
      style={styles.input}
      maxLength={3}
    />
  );
});

const Step2 = React.memo(({
  householdSize,
  age,
  onHouseholdChange,
  onAgeChange
}: Step2Props) => {
  console.log('🔄 Step2 리렌더링');

  return (
    <Card style={styles.modernCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="home-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>가구 정보</Text>
        </View>
        
        <Text style={styles.modernLabel}>가구원 수</Text>
        <HouseholdInput
          onValueChange={onHouseholdChange}
          initialValue={householdSize}
        />
        
        <Text style={styles.modernLabel}>나이</Text>
        <AgeInput
          onValueChange={onAgeChange}
          initialValue={age}
        />
        
        <Text style={styles.helperText}>
          💡 가구 정보 안내{'\n'}
          • 가구원 수는 본인을 포함한 총 인원수입니다{'\n'}
          • 정확한 정보를 입력하시면 더 맞춤형 레시피를 추천받을 수 있습니다
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
  input: {
    marginBottom: theme.spacing.lg,
  },
  helperText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
};

// why-did-you-render 추적 활성화
Step2.whyDidYouRender = true;
HouseholdInput.whyDidYouRender = true;
AgeInput.whyDidYouRender = true;

export default Step2; 