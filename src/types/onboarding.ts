export interface OnboardingFormData {
  gender: 'MALE' | 'FEMALE';
  age: string;
  householdSize: string;
  tools: string[];
  preferences: string[];
  dislikes: string[];
  allergies: string[];
  preferredCategories: string[];
  nutrition: {
    calories: string;
    protein: string;
    fat: string;
    carbohydrates: string;
  };
} 