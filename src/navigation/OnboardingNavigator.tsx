import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';

export type OnboardingStackParamList = {
  Onboarding: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  // 앞으로 온보딩 단계가 추가되면 여기에 선언
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: true, title: '이용약관' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: true, title: '개인정보처리방침' }} />
    </Stack.Navigator>
  );
} 