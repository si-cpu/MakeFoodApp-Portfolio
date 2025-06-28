import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Main Screens
import RecipeScreen from '../screens/recipe/RecipeScreen';
import RecipeDetailScreen from '../screens/recipe/RecipeDetailScreen';
import MyRecipeEditScreen from '../screens/recipe/MyRecipeEditScreen';
import CartScreen from '../screens/recipe/CartScreen';
import InventoryScreen from '../screens/recipe/InventoryScreen';
import AccountScreen from '../screens/recipe/AccountScreen';
import AccountBookScreen from '../screens/recipe/AccountBookScreen';
import MainScreen from '../screens/main/MainScreen';
import CookingStepsScreen from '../screens/recipe/CookingStepsScreen';
import UserProfileEditScreen from '../screens/user/UserProfileEditScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export type MainStackParamList = {
  MainTabs: undefined;
  RecipeDetail: { id: number };
  MyRecipeEdit: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
};

// 메인 탭 네비게이터
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={MainScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Recipe"
        component={RecipeScreen}
        options={{
          tabBarLabel: '레시피',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="food" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarLabel: '인벤토리',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="fridge" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: '장바구니',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AccountBook"
        component={AccountBookScreen}
        options={{
          tabBarLabel: '가계부',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: '개인정보',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// 메인 네비게이터 (탭 + 모달 스크린들)
export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="MyRecipeEdit" component={MyRecipeEditScreen} />
      <Stack.Screen name="CookingSteps" component={CookingStepsScreen} />
      <Stack.Screen name="UserInfoEdit" component={UserProfileEditScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: true, title: '이용약관' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: true, title: '개인정보처리방침' }} />
    </Stack.Navigator>
  );
} 