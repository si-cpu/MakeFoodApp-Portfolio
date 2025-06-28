import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface MessageProps {
  message: string;
  variant?: 'error' | 'warning' | 'success' | 'info';
  style?: ViewStyle;
}

const iconMap = {
  error: 'close-circle',
  warning: 'alert-circle',
  success: 'checkmark-circle',
  info: 'information-circle',
};

const colorMap = {
  error: theme.colors.error,
  warning: '#E6A23C',
  success: '#7CB518',
  info: theme.colors.primary,
};

const Message: React.FC<MessageProps> = ({ message, variant = 'info', style }) => {
  return (
    <View style={[styles.container, { backgroundColor: colorMap[variant] + '22' }, style]}>
      <Ionicons
        name={iconMap[variant] as any}
        size={20}
        color={colorMap[variant]}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: colorMap[variant] }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.medium,
  },
});

export default Message; 