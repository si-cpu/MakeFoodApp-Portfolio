import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OnboardingFormData } from '../../types/onboarding';

interface OnboardingState {
  currentStep: number;
  formData: OnboardingFormData;
  isCompleted: boolean;
}

const defaultFormData: OnboardingFormData = {
  gender: 'MALE',
  age: '',
  householdSize: '',
  tools: [],
  preferences: [],
  dislikes: [],
  allergies: [],
  preferredCategories: [],
  nutrition: {
    calories: '',
    protein: '',
    fat: '',
    carbohydrates: '',
  },
};

const initialState: OnboardingState = {
  currentStep: 1,
  formData: defaultFormData,
  isCompleted: false,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    updateFormData: (state, action: PayloadAction<Partial<OnboardingFormData>>) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    setCompleted: (state, action: PayloadAction<boolean>) => {
      state.isCompleted = action.payload;
    },
    resetOnboarding: (state) => {
      state.currentStep = 1;
      state.formData = defaultFormData;
      state.isCompleted = false;
    },
  },
});

export const {
  setStep,
  updateFormData,
  setCompleted,
  resetOnboarding,
} = onboardingSlice.actions;

// 선택자(Selectors)
export const selectCurrentStep = (state: { onboarding: OnboardingState }) =>
  state.onboarding.currentStep;

export const selectFormData = (state: { onboarding: OnboardingState }) =>
  state.onboarding.formData;

export const selectIsCompleted = (state: { onboarding: OnboardingState }) =>
  state.onboarding.isCompleted;

export default onboardingSlice.reducer; 