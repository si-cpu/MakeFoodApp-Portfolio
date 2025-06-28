import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface EmptyProps {
  message?: string;
  subMessage?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconSize?: number;
  style?: ViewStyle;
  onAction?: () => void;
  actionText?: string;
  showAction?: boolean;
}

const Empty: React.FC<EmptyProps> = ({ 
  message = '데이터가 없습니다.',
  subMessage,
  iconName = 'basket-outline',
  iconColor = '#ffb74d',
  iconSize = 80,
  style,
  onAction,
  actionText = '추가하기',
  showAction = false
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={iconName} 
          size={iconSize} 
          color={iconColor}
        />
      </View>
      
      <Text style={styles.mainText}>{message}</Text>
      
      {subMessage && (
        <Text style={styles.subText}>{subMessage}</Text>
      )}
      
      {showAction && onAction && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="add-circle" 
            size={20} 
            color="#fff" 
            style={styles.buttonIcon}
          />
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  iconContainer: {
    backgroundColor: theme.colors.surface + '80',
    borderRadius: 60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  mainText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.large,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subText: {
    color: theme.colors.textLight,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.medium,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  actionText: {
    color: '#fff',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.medium,
  },
});

export default Empty; 