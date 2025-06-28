import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { theme } from '../../theme/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  variant?: 'rect' | 'circle' | 'line';
  style?: ViewStyle;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  variant = 'rect',
  style,
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  let shapeStyle: ViewStyle = {
    width: width as DimensionValue,
    height: height as DimensionValue,
    borderRadius,
    backgroundColor: theme.colors.border,
    opacity,
  };
  if (variant === 'circle') {
    shapeStyle = {
      ...shapeStyle,
      borderRadius: typeof width === 'number' ? width / 2 : 999,
    };
  } else if (variant === 'line') {
    shapeStyle = {
      ...shapeStyle,
      height: 8,
      borderRadius: 4,
    };
  }

  return <Animated.View style={[styles.skeleton, shapeStyle, style]} />;
};

const styles = StyleSheet.create({
  skeleton: {
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.border,
  },
});

export default Skeleton; 