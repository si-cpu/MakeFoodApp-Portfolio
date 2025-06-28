import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  image?: ImageSourcePropType;
  style?: ViewStyle;
  color?: string;
  size?: number;
  testID?: string;
}

const FAB: React.FC<FABProps> = ({
  onPress,
  icon = 'add',
  image,
  style,
  color = theme.colors.primary,
  size = 56,
  testID,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.fab, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }, style]}
      activeOpacity={0.8}
      testID={testID}
    >
      {image ? (
        <Image source={image} style={{ width: size * 0.5, height: size * 0.5 }} resizeMode="contain" />
      ) : (
        <Ionicons name={icon} size={size * 0.5} color={theme.colors.white} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: theme.spacing.xl,
    bottom: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    zIndex: 100,
  },
});

export default FAB; 