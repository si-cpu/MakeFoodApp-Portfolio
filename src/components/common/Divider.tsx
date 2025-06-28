import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { theme } from '../../theme/theme';

interface DividerProps {
  vertical?: boolean;
  color?: string;
  thickness?: number;
  style?: ViewStyle;
  length?: DimensionValue;
}

const Divider: React.FC<DividerProps> = ({
  vertical = false,
  color = theme.colors.border,
  thickness = 1,
  style,
  length,
}) => {
  return (
    <View
      style={[
        vertical
          ? [styles.vertical, { backgroundColor: color, width: thickness, height: length || '100%' }]
          : [styles.horizontal, { backgroundColor: color, height: thickness, width: length || '100%' }],
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.border,
    borderRadius: 1,
  },
  vertical: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.border,
    borderRadius: 1,
  },
});

export default Divider; 