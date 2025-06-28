import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import { theme } from '../../theme/theme';
import Input from '../../components/common/Input';

interface UserStep2Props {
  householdSize: string;
  age: string;
  onHouseholdChange: (value: string) => void;
  onAgeChange: (value: string) => void;
}

const UserStep2 = memo(({ householdSize, age, onHouseholdChange, onAgeChange }: UserStep2Props) => {
  console.log('🔄 UserStep2 리렌더링');

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="home-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>가구 정보</Text>
        </View>
        
        <Text style={styles.label}>가구원 수</Text>
        <Input
          value={householdSize}
          onChangeText={(value) => {
            // 숫자만 입력 허용
            const numericValue = value.replace(/[^0-9]/g, '');
            onHouseholdChange(numericValue);
          }}
          placeholder="가구원 수를 입력하세요"
          keyboardType="number-pad"
          style={styles.input}
          maxLength={2}
        />
        
        <Text style={styles.label}>나이</Text>
        <Input
          value={age}
          onChangeText={(value) => {
            // 숫자만 입력 허용
            const numericValue = value.replace(/[^0-9]/g, '');
            onAgeChange(numericValue);
          }}
          placeholder="나이를 입력하세요"
          keyboardType="number-pad"
          style={styles.input}
          maxLength={3}
        />
        
        <Text style={styles.helperText}>
          • 가구원 수는 본인을 포함한 총 인원수입니다{'\n'}
          • 정확한 정보를 입력하시면 더 맞춤형 레시피를 추천받을 수 있습니다
        </Text>
      </Card.Content>
    </Card>
  );
});

UserStep2.displayName = 'UserStep2';

// React DevTools
UserStep2.whyDidYouRender = true;

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
    marginTop: theme.spacing.sm,
  },
});

export default UserStep2; 