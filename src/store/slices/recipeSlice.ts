import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RecipeDetailDto, RecipeSummaryDto } from '../../types/recipe';

interface RecipeState {
  selectedRecipe: RecipeDetailDto | null;
  recommendedRecipes: RecipeSummaryDto[];
  seasonalRecipes: RecipeSummaryDto[];
  popularRecipes: RecipeSummaryDto[];
  isLoading: boolean;
}

const initialState: RecipeState = {
  selectedRecipe: null,
  recommendedRecipes: [],
  seasonalRecipes: [],
  popularRecipes: [],
  isLoading: false,
};

const recipeSlice = createSlice({
  name: 'recipe',
  initialState,
  reducers: {
    setSelectedRecipe: (state, action: PayloadAction<RecipeDetailDto | null>) => {
      state.selectedRecipe = action.payload;
    },
    setRecommendedRecipes: (state, action: PayloadAction<RecipeSummaryDto[]>) => {
      state.recommendedRecipes = action.payload;
    },
    setSeasonalRecipes: (state, action: PayloadAction<RecipeSummaryDto[]>) => {
      state.seasonalRecipes = action.payload;
    },
    setPopularRecipes: (state, action: PayloadAction<RecipeSummaryDto[]>) => {
      state.popularRecipes = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    resetRecipes: (state) => {
      state.selectedRecipe = null;
      state.recommendedRecipes = [];
      state.seasonalRecipes = [];
      state.popularRecipes = [];
      state.isLoading = false;
    },
  },
});

export const {
  setSelectedRecipe,
  setRecommendedRecipes,
  setSeasonalRecipes,
  setPopularRecipes,
  setLoading,
  resetRecipes,
} = recipeSlice.actions;

export default recipeSlice.reducer; 