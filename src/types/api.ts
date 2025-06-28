// 공통 타입
export interface UserDto {
  id: string;
  name: string;
  age: number;
  gender: string;
  householdSize: number;
}

export interface NutritionDto {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

// 레시피 관련 타입
export interface RecipeSummaryDto {
  likeCount: number;
  saveCount: number;
  cookCount: number;
  id: number;
  title: string;
  description: string;
  category: RecipeCategory;
  difficulty: string;
  cookingTime: number;
  servings: number;
  imageUrl: string;
  author: UserDto;
}

export interface RecipeDetailDto extends RecipeSummaryDto {
  nutrition: NutritionDto;
  ingredients: IngredientDto[];
  toolNames: string[];
  steps: RecipeStepDto[];
}

export interface RecipeStepDto {
  stepNumber: number;
  description: string;
  imageUrl?: string;
}

export interface IngredientDto {
  ingredientId: number;
  amount: number;
  unit: string;
}

export type RecipeCategory = 
  | 'KOREAN'
  | 'JAPANESE'
  | 'CHINESE'
  | 'WESTERN'
  | 'DESSERT'
  | 'HEALTHY'
  | 'VEGETARIAN'
  | 'FUSION'
  | 'OTHER';

// 재고 관리 관련 타입
export interface InventoryDto {
  id: number;
  itemName: string;
  quantity: number;
  unit: string;
  price: number;
  purchaseDate: string;
  expiryDate: string;
  isConsumed: boolean;
  createdAt: string;
  updatedAt: string;
}

// 장바구니 관련 타입
export interface CartItemDto {
  id: number;
  itemName: string;
  quantity: number;
  unit: string;
  purchased: boolean;
}

// 사용자 관련 타입
export interface UserInfoDto {
  id: string;
  name?: string;
  householdSize?: number;
  dislikedIngredients?: string[];
  preferredIngredients?: string[];
  allergyIngredients?: string[];
  onboarded?: boolean;
}

// 페이지네이션 관련 타입
export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  content: T[];
  number: number;
  numberOfElements: number;
  last: boolean;
  empty: boolean;
}

// 커서 기반 페이지네이션
export interface CursorResponse<T> {
  data: T[];
  nextCursor: string;
  hasNext: boolean;
  size: number;
}

export interface AuthResponseDto extends UserInfoDto {
  accessToken: string;
  isNewUser: boolean;
  isOnboarded: boolean;
} 