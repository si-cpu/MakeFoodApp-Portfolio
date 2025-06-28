import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Text, Easing } from 'react-native';
import { theme } from '../../theme/theme';

import LOADING_IMAGE from '../../assets/loading.jpeg';

const LoadingIndicator = () => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [translateY]);

  return (
    <View style={styles.container}>
      <Image source={LOADING_IMAGE} style={styles.image} resizeMode="contain" />
      <Animated.Text
        style={[
          styles.text,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        Loading...
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: theme.spacing.xxl,
  },
  text: {
    color: theme.colors.textLight,
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.extraBold,
    letterSpacing: 2,
    textShadowColor: theme.colors.secondary,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default LoadingIndicator; 