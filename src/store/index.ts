import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import recipeReducer from './slices/recipeSlice';
import loadingReducer from './slices/loadingSlice';
import errorReducer from './slices/errorSlice';
import ingredientReducer from './slices/ingredientSlice';
import onboardingReducer from './slices/onboardingSlice';
import purchaseReducer from './slices/purchaseSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recipe: recipeReducer,
    loading: loadingReducer,
    error: errorReducer,
    ingredient: ingredientReducer,
    onboarding: onboardingReducer,
    purchase: purchaseReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 