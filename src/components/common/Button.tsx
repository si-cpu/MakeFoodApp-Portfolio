import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';
import { theme } from '../../theme/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.textDisabled;
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textDisabled;
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.text;
      default:
        return theme.colors.white;
    }
  };

  const getBorderColor = () => {
    if (disabled) return theme.colors.textDisabled;
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      default:
        return 'transparent';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md };
      case 'large':
        return { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.xl };
      default:
        return { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return theme.typography.fontSize.small;
      case 'large':
        return theme.typography.fontSize.large;
      default:
        return theme.typography.fontSize.medium;
    }
  };

  const getBorderRadius = () => {
    switch (size) {
      case 'small':
        return theme.borderRadius.sm;
      case 'large':
        return theme.borderRadius.lg;
      default:
        return theme.borderRadius.md;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderRadius: getBorderRadius(),
          width: fullWidth ? '100%' : 'auto',
          ...getPadding(),
        },
        variant === 'primary' && !disabled ? theme.shadows.sm : {},
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
              fontFamily: theme.typography.fontFamily.medium,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.tight * 16,
  },
});

export default Button; 