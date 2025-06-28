import React from 'react';
import { View, Text, StyleSheet, Image, ImageStyle, ViewStyle } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { theme } from '../../theme/theme';
import { UploadProgress } from '../../utils/s3Upload';

interface S3UploadImageProps {
  imageUri?: string;
  uploadProgress?: UploadProgress | null;
  uploadError?: string | null;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  showProgress?: boolean;
}

import placeholderImage from '../../assets/image-placeholder.png';
import errorImage from '../../assets/image-error..png';

const S3UploadImage: React.FC<S3UploadImageProps> = ({
  imageUri,
  uploadProgress,
  uploadError,
  style,
  containerStyle,
  showProgress = true,
}) => {
  // 업로드 상태 결정
  const isUploading = uploadProgress && uploadProgress.percentage < 100;
  const hasError = uploadError || (uploadProgress && uploadProgress.percentage === 0);
  const isCompleted = uploadProgress && uploadProgress.percentage === 100;

  // 표시할 이미지 결정
  const getImageSource = () => {
    if (hasError) return errorImage;
    if (imageUri) return { uri: imageUri };
    return placeholderImage;
  };

    // 상태 텍스트
  const getStatusText = () => {
    if (hasError) return uploadError || '업로드 실패';
    if (isUploading) return '업로드 중...';

    return '';
  };

  const imageSource = getImageSource();
  const statusText = getStatusText();

  return (
    <View style={[styles.container, containerStyle]}>
      <Image 
        source={imageSource}
        style={[
          styles.image, 
          !imageUri && styles.placeholderImage,
          style
        ]}
        resizeMode={!imageUri ? "contain" : "cover"}
      />
      
      {/* 오버레이 - 플레이스홀더, 업로드 중, 에러 상태에서만 표시 */}
      {(isUploading || hasError || !imageUri) && (
        <View style={[styles.overlay, !imageUri && styles.placeholderOverlay]}>
          <View style={styles.statusContainer}>
            {statusText && (
              <Text style={[
                styles.statusText,
                hasError && styles.errorText,
                !imageUri && styles.placeholderText
              ]}>
                {statusText}
              </Text>
            )}
            
            {/* 진행률 표시 */}
            {showProgress && uploadProgress && !hasError && (
              <>
                <ProgressBar 
                  progress={uploadProgress.percentage / 100}
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  {uploadProgress.percentage}%
                </Text>
                {uploadProgress.loaded && uploadProgress.total && (
                  <Text style={styles.sizeText}>
                    {Math.round(uploadProgress.loaded / 1024)}KB / {Math.round(uploadProgress.total / 1024)}KB
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      )}

      {/* 이미지가 있고 업로드 중이 아닐 때 미리보기 표시 */}
      {imageUri && !isUploading && !hasError && (
        <View style={styles.previewBadge}>
          <Text style={styles.previewText}>미리보기</Text>
        </View>
      )}

      {/* 완료 표시 */}
      {isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    opacity: 0.6,
    alignSelf: 'center',
  },
    overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  placeholderOverlay: {

  },
  statusContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: '#ff5252',
  },
  placeholderIcon: {
    marginBottom: theme.spacing.sm,
  },
  placeholderIconText: {
    fontSize: 32,
    textAlign: 'center',
  },
  placeholderText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
  },
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    marginBottom: theme.spacing.xs,
  },
  sizeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
  },
  completedBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: '#4caf50',
    borderRadius: theme.borderRadius.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.bold,
  },
  previewBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  previewText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
  },
});

export default S3UploadImage; 