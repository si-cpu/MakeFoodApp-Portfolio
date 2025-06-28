import React, { Suspense } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';
import { store } from './src/store';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useAppSelector, useAppDispatch } from './src/store/hooks';
import Toast from './src/components/common/Toast';
import { clearError } from './src/store/slices/errorSlice';
import { theme as appTheme } from './src/theme/theme';

// Navigators
import { RootNavigator } from './src/navigation/RootNavigator';

// 로딩 컴포넌트 (Suspense fallback)
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#ff6b6b" />
    <Text style={{ marginTop: 16, color: '#666' }}>앱을 불러오는 중...</Text>
  </View>
);

const GlobalErrorToast = () => {
  const dispatch = useAppDispatch();
  const errorMessage = useAppSelector(state => state.error.error);

  return (
    <Toast
      message={errorMessage || ''}
      visible={!!errorMessage}
      onHide={() => dispatch(clearError())}
      variant="error"
    />
  );
};

// 커스텀 react-native-paper 테마 (surface 색을 흰색으로 통일)
const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: appTheme.colors.primary,
    surface: appTheme.colors.white,
    background: appTheme.colors.background,
    elevation: {
      ...DefaultTheme.colors.elevation,
      level0: appTheme.colors.white,
      level1: appTheme.colors.white,
      level2: appTheme.colors.white,
      level3: appTheme.colors.white,
      level4: appTheme.colors.white,
      level5: appTheme.colors.white,
    },
  },
};

const App = () => {
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={paperTheme}>
        <ThemeProvider>
          <SafeAreaProvider>
              <Suspense fallback={<LoadingScreen />}>
              <RootNavigator />
              </Suspense>
            <GlobalErrorToast />
          </SafeAreaProvider>
        </ThemeProvider>
      </PaperProvider>
    </ReduxProvider>
  );
};

export default App; 