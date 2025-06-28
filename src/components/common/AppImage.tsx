import React, { useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, ImageProps, ImageSourcePropType, ViewStyle, ImageStyle } from 'react-native';
import { theme } from '../../theme/theme';

interface AppImageProps extends Omit<ImageProps, 'source'> {
  source: ImageSourcePropType;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: ImageSourcePropType;
  errorImage?: ImageSourcePropType;
  rounded?: boolean;
}

import defaultPlaceholder from '../../assets/image-placeholder.png';
import defaultError from '../../assets/image-error..png';

const AppImage: React.FC<AppImageProps> = ({
  source,
  style,
  containerStyle,
  placeholder = defaultPlaceholder,
  errorImage = defaultError,
  rounded = false,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[styles.container, rounded && styles.rounded, containerStyle]}>
      {loading && !error && (
        <Image source={placeholder} style={[styles.image, style, rounded && styles.rounded]} resizeMode="cover" />
      )}
      {error ? (
        <Image source={errorImage} style={[styles.image, style, rounded && styles.rounded]} resizeMode="cover" />
      ) : (
        <Image
          source={source}
          style={[styles.image, style, rounded && styles.rounded]}
          resizeMode="cover"
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          {...props}
        />
      )}
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  image: {
    width: 100,
    height: 100,
  },
  rounded: {
    borderRadius: theme.borderRadius.lg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: theme.borderRadius.md,
  },
});

export default AppImage; 