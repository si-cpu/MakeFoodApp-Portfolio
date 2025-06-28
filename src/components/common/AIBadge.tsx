import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface AIBadgeProps {
  position?: 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium';
  style?: any;
}

const AIBadge: React.FC<AIBadgeProps> = ({ 
  position = 'top-right', 
  size = 'small',
  style 
}) => {
  const isSmall = size === 'small';
  
  const positionStyles = {
    'top-right': { top: theme.spacing.xs, right: theme.spacing.xs },
    'bottom-left': { bottom: theme.spacing.xs, left: theme.spacing.xs },
    'bottom-right': { bottom: theme.spacing.xs, right: theme.spacing.xs },
  };

  return (
    <View style={[
      styles.container,
      positionStyles[position],
      isSmall ? styles.containerSmall : styles.containerMedium,
      theme.shadows.base,
      style
    ]}>
      <Ionicons 
        name="sparkles" 
        size={isSmall ? 10 : 12} 
        color={theme.colors.accent} 
      />
      <Text style={[
        styles.text,
        isSmall ? styles.textSmall : styles.textMedium
      ]}>
        AI
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    zIndex: 10,
  },
  containerSmall: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    gap: 2,
  },
  containerMedium: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  text: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.accent,
    includeFontPadding: false,
  },
  textSmall: {
    fontSize: theme.typography.fontSize.xs,
  },
  textMedium: {
    fontSize: theme.typography.fontSize.small,
  },
});

export default AIBadge; 