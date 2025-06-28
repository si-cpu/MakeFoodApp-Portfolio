import React from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthStackNavigator from './AuthNavigator';
import MainStackNavigator from './MainNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { theme, darkTheme } from '../theme/theme';

const Stack = createNativeStackNavigator();

  export const RootNavigator = () => {
  const { theme } = useTheme();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const isAuthenticated = Boolean(accessToken);
  const needsOnboarding = !user?.onboarded;

  const navTheme = {
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.text,
      notification: theme.colors.error,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: false, contentStyle: { paddingTop: insets.top } }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 