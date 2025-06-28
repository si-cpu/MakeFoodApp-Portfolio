import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  style?: ViewStyle;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
}

const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 99,
  style,
  buttonStyle,
  textStyle,
}) => {
  const decrease = () => {
    if (value > min) onChange(value - 1);
  };
  const increase = () => {
    if (value < max) onChange(value + 1);
  };
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.button, buttonStyle, value <= min && styles.disabled]}
        onPress={decrease}
        disabled={value <= min}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={20} color={value <= min ? theme.colors.textLight : theme.colors.primary} />
      </TouchableOpacity>
      <Text style={[styles.value, textStyle]}>{value}</Text>
      <TouchableOpacity
        style={[styles.button, buttonStyle, value >= max && styles.disabled]}
        onPress={increase}
        disabled={value >= max}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={20} color={value >= max ? theme.colors.textLight : theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  button: {
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    marginHorizontal: theme.spacing.xs,
  },
  disabled: {
    opacity: 0.4,
  },
  value: {
    minWidth: theme.spacing.xxl,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
  },
});

export default Stepper; 