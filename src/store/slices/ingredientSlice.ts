import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Ingredient } from '../../types/ingredient';

interface IngredientState {
  ingredients: Ingredient[];
  selectedIngredients: string[]; // 선택된 재료 ID 목록
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: IngredientState = {
  ingredients: [],
  selectedIngredients: [],
  searchQuery: '',
  isLoading: false,
  error: null,
};

const ingredientSlice = createSlice({
  name: 'ingredient',
  initialState,
  reducers: {
    setIngredients: (state, action: PayloadAction<Ingredient[]>) => {
      state.ingredients = action.payload;
    },
    addSelectedIngredient: (state, action: PayloadAction<string>) => {
      if (!state.selectedIngredients.includes(action.payload)) {
        state.selectedIngredients.push(action.payload);
      }
    },
    removeSelectedIngredient: (state, action: PayloadAction<string>) => {
      state.selectedIngredients = state.selectedIngredients.filter(
        id => id !== action.payload
      );
    },
    clearSelectedIngredients: (state) => {
      state.selectedIngredients = [];
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetIngredients: (state) => {
      state.ingredients = [];
      state.selectedIngredients = [];
      state.searchQuery = '';
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setIngredients,
  addSelectedIngredient,
  removeSelectedIngredient,
  clearSelectedIngredients,
  setSearchQuery,
  setLoading,
  setError,
  resetIngredients,
} = ingredientSlice.actions;

// 선택자(Selectors)
export const selectFilteredIngredients = (state: { ingredient: IngredientState }) => {
  const { ingredients, searchQuery } = state.ingredient;
  if (!searchQuery) return ingredients;
  
  return ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

export const selectSelectedIngredients = (state: { ingredient: IngredientState }) =>
  state.ingredient.selectedIngredients;

export default ingredientSlice.reducer; 