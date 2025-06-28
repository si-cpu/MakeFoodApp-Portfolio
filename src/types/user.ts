/**
 * UUID 타입 정의
 */
export type UUID = number;

/**
 * 레시피 카테고리
 */
export type RecipeCategory = 'KOREAN' | 'JAPANESE' | 'CHINESE' | 'WESTERN' | 'DESSERT' | 'HEALTHY' | 'VEGETARIAN' | 'FUSION' | 'OTHER';

/**
 * 사용자 기본 정보
 */
export interface UserDto {
  id: string;
  name: string;
  age: number;
  gender: string;
  householdSize: number;
}

/**
 * 영양 선호도
 */
export interface NutritionPreference {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

/**
 * 사용자 상세 정보
 */
export interface UserInfoDto {
  id: string;
  name?: string;
  email?: string;
  onboarded: boolean;
  newUser: boolean;
  gender: string;
  age: number;
  householdSize: number;
  tools: string[];
  preferences: import('./ingredient').IngredientResponseDto[];
  dislikes: import('./ingredient').IngredientResponseDto[];
  allergies: import('./ingredient').IngredientResponseDto[];
  preferredCategories: string[];
  nutritionPreference: NutritionPreference;
}

/**
 * 사용자 통계 기본 정보
 */
export interface UserBasicStats {
  totalRecipes: number;      // 총 조리한 레시피 수
  totalLikes: number;        // 받은 좋아요 수
  totalSaves: number;        // 저장된 레시피 수
  totalViews: number;        // 받은 조회수
}

/**
 * 사용자 최근 활동
 */
export interface UserRecentActivity {
  lastCooked: string;        // 마지막 조리 날짜
  lastLiked: string;         // 마지막 좋아요 날짜
  lastSaved: string;         // 마지막 저장 날짜
  lastViewed: string;        // 마지막 조회 날짜
}

/**
 * 월별 통계
 */
export interface MonthlyStats {
  month: string;             // YYYY-MM 형식
  cookedCount: number;       // 조리한 레시피 수
  likedCount: number;        // 좋아요한 레시피 수
  savedCount: number;        // 저장한 레시피 수
  viewedCount: number;       // 조회한 레시피 수
}

/**
 * 기본 통계 (Swagger BasicStats 스펙에 맞게)
 */
export interface BasicStats {
  createdRecipes: number;
  likedRecipes: number;
  savedRecipes: number;
  totalCookCount: number;
  cookedUniqueRecipes: number;
}

/**
 * 선호도 분석 (Swagger PreferenceAnalysis 스펙에 맞게)
 */
export interface PreferenceAnalysis {
  favoriteDifficulty: string;
  averageCookingTime: number;
  topIngredients: string[];
  topTools: string[];
}

/**
 * 최근 활동 (Swagger RecentActivity 스펙에 맞게)
 */
export interface RecentActivity {
  recentCooked: RecipeSummaryDto[];
  recentLiked: RecipeSummaryDto[];
  recentSaved: RecipeSummaryDto[];
}

/**
 * 사용자 통계 정보 (Swagger UserStatsDto 스펙에 맞게 수정)
 */
export interface UserStatsDto {
  basicStats: BasicStats;
  recentActivity: RecentActivity;
  preferenceAnalysis: PreferenceAnalysis;
  monthlyStats: { [key: string]: number }; // object with integer values
}

/**
 * 사용자 정보 업데이트 요청
 */
export interface UpdateUserInfoRequest extends UserInfoDto {}

/**
 * 사용자 정보 저장 요청
 */
export interface SaveUserInfoRequest extends UserInfoDto {}

// RecipeSummaryDto는 recipe.ts에서 import 필요
import { RecipeSummaryDto } from './recipe'; 