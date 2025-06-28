import { Platform, Dimensions, ScaledSize } from 'react-native';

export const isIPad = Platform.OS === 'ios' && Platform.constants?.interfaceIdiom === 'pad';

export const getWindowDimensions = (): ScaledSize => {
  return Dimensions.get('window');
};

export const isLandscape = (): boolean => {
  const { width, height } = getWindowDimensions();
  return width > height;
};

export const getColumnCount = (): number => {
  const { width } = getWindowDimensions();
  if (isIPad) {
    return isLandscape() ? 4 : 3;
  }
  return isLandscape() ? 3 : 2;
};

export const getContentMaxWidth = (): number => {
  const { width } = getWindowDimensions();
  if (isIPad) {
    return isLandscape() ? width * 0.8 : width * 0.9;
  }
  return width;
};

// Split View 지원을 위한 레이아웃 계산
export const getSplitViewLayout = () => {
  const { width } = getWindowDimensions();
  const isCompact = width < 768; // iPad Split View의 기준점

  return {
    isCompact,
    mainContentWidth: isCompact ? width : width * 0.65,
    sidebarWidth: isCompact ? width : width * 0.35,
  };
}; 