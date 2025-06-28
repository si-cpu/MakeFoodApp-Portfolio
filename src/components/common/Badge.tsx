import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme/theme';

interface BadgeProps {
  value?: number | string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string; // 배경색 커스텀
}

const Badge: React.FC<BadgeProps> = ({ value, style, textStyle, color }) => {
  return (
    <View style={[styles.badge, { backgroundColor: color || theme.colors.primary }, style]}>
      {value !== undefined && (
        <Text style={[styles.text, textStyle]}>{value}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: theme.spacing.lg,
    height: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    position: 'absolute',
    top: -theme.spacing.xs,
    right: -theme.spacing.xs,
    zIndex: 1,
    ...theme.shadows.sm,
  },
  text: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.small,
    textAlign: 'center',
  },
});

export default Badge; 