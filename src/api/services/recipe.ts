import apiClient from '../axios';
import {
  RecipeDetailDto,
  RecipeSummaryDto,
  RecipeCreateDto,
  RecipeListParams,
  PageRecipeSummaryDto,
  ToggleResponse,
  IngredientDto,
  RecipeSummaryWithStatusDto
} from '../../types/recipe';
import axiosInstance from '../axios';
import { AxiosResponse } from 'axios';

/**
 * 레시피 관련 API 서비스
 * API 문서: http://localhost:8080/api/swagger-ui/index.html
 */
const BASE_PATH = '/recipes';

export const recipeService = {
  /**
   * 모든 레시피 조회
   * GET /api/recipes
   */
  getRecipes: (params?: RecipeListParams) => 
    apiClient.get<PageRecipeSummaryDto>(BASE_PATH, { params }),

  /**
   * 커서 기반 레시피 조회
   * GET /api/recipes/cursor
   */
  getRecipesWithCursor: (cursor?: string, size: number = 20) => 
    apiClient.get(`${BASE_PATH}/cursor`, { 
      params: { cursor, size } 
    }),

  /**
   * 특정 레시피 상세 조회
   * GET /api/recipes/{id}
   */
  getRecipeById: (id: number) => 
    apiClient.get<RecipeDetailDto>(`${BASE_PATH}/${id}`),

  /**
   * 새 레시피 생성
   * POST /api/recipes
   */
  createRecipe: (data: RecipeCreateDto) => 
    apiClient.post(BASE_PATH, data),

  /**
   * 레시피 검색
   * GET /api/recipes/search
   */
  searchRecipes: (keyword: string, params?: RecipeListParams) => 
    apiClient.get<PageRecipeSummaryDto>(`${BASE_PATH}/search`, { 
      params: { keyword, ...params } 
    }),

  /**
   * 도구로 레시피 검색
   * GET /api/recipes/tools
   */
  getRecipesByTools: (tools: string[]) => 
    apiClient.get<RecipeSummaryDto[]>(`${BASE_PATH}/tools`, { 
      params: { tools } 
    }),

  /**
   * 제철 레시피 조회
   * GET /api/recipes/seasonal
   */
  getSeasonalRecipes: () => 
    apiClient.get<RecipeSummaryDto[]>(`${BASE_PATH}/seasonal`),

  /**
   * 인기 레시피 조회
   * GET /api/recipes/popular
   */
  getPopularRecipes: (params?: RecipeListParams) => 
    apiClient.get<PageRecipeSummaryDto>(`${BASE_PATH}/popular`, { params }),

  /**
   * 커서 기반 인기 레시피 조회
   * GET /api/recipes/popular/cursor
   */
  getPopularRecipesWithCursor: (cursor?: string, size: number = 20) => 
    apiClient.get(`${BASE_PATH}/popular/cursor`, { 
      params: { cursor, size } 
    }),

  /**
   * 최근 레시피 조회
   * GET /api/recipes/recent
   */
  getRecentRecipes: (params?: RecipeListParams) => 
    apiClient.get<PageRecipeSummaryDto>(`${BASE_PATH}/recent`, { params }),

  /**
   * 내가 작성한 레시피 조회
   * GET /api/recipes/mine
   */
  getMyRecipes: () => 
    apiClient.get<RecipeSummaryDto[]>(`${BASE_PATH}/mine`),

  /**
   * 좋아요한 레시피 조회
   * GET /api/recipes/liked
   */
  getLikedRecipes: () => 
    apiClient.get<RecipeSummaryDto[]>(`${BASE_PATH}/liked`),

  /**
   * 저장한 레시피 조회
   * GET /api/recipes/saved
   */
  getSavedRecipes: async (): Promise<AxiosResponse<RecipeSummaryDto[]>> => {
    return await axiosInstance.get('/recipes/saved');
  },

  /**
   * 최근 조회한 레시피 조회
   * GET /api/recipes/recent/viewed
   */
  getRecentViewedRecipes: async (): Promise<AxiosResponse<RecipeSummaryDto[]>> => {
    return await axiosInstance.get('/recipes/recent/viewed');
  },

  /**
   * 레시피 좋아요/취소 토글
   * POST /api/recipes/{id}/toggle-like
   */
  toggleRecipeLike: (id: number) => 
    apiClient.post<ToggleResponse>(`${BASE_PATH}/${id}/toggle-like`),

  /**
   * 레시피 저장/취소 토글
   * POST /api/recipes/{id}/toggle-save
   */
  toggleRecipeSave: (id: number) => 
    apiClient.post<ToggleResponse>(`${BASE_PATH}/${id}/toggle-save`),

  /**
   * 레시피 좋아요
   * POST /api/recipes/{id}/like
   */
  likeRecipe: (id: number) => 
    apiClient.post(`${BASE_PATH}/${id}/like`),

  /**
   * 레시피 좋아요 취소
   * DELETE /api/recipes/{id}/like
   */
  unlikeRecipe: (id: number) => 
    apiClient.delete(`${BASE_PATH}/${id}/like`),

  /**
   * 레시피 저장
   * POST /api/recipes/{id}/save
   */
  saveRecipe: (id: number) => 
    apiClient.post(`${BASE_PATH}/${id}/save`),

  /**
   * 레시피 저장 취소
   * DELETE /api/recipes/{id}/save
   */
  unsaveRecipe: (id: number) => 
    apiClient.post(`${BASE_PATH}/${id}/unsave`),

  /**
   * 레시피 조리 기록
   * POST /api/recipes/{recipeId}/interaction/cook
   */
  recordCook: async (recipeId: number): Promise<void> => {
    await apiClient.post(`/recipes/${recipeId}/interaction/cook`);
  },

  /**
   * 레시피 클릭 기록
   * POST /api/recipes/{recipeId}/click
   */
  recordClick: (id: number) => 
    apiClient.post(`${BASE_PATH}/${id}/click`),

  /**
   * 레시피 피드백 기록
   * POST /api/recipes/{recipeId}/feedback
   */
  recordFeedback: (id: number, liked: boolean) => 
    apiClient.post(`${BASE_PATH}/${id}/feedback`, null, { params: { liked } }),

  /**
   * 레시피 조회 기록
   * POST /api/recipes/{id}/view
   */
  addToRecentViewed: (id: number) => 
    apiClient.post(`${BASE_PATH}/${id}/view`),

  /**
   * 레시피 재료를 장바구니에 추가
   * POST /api/recipes/{id}/add-to-cart
   */
  addRecipeIngredientsToCart: (id: number) => 
    apiClient.post(`${BASE_PATH}/${id}/add-to-cart`),

  /**
   * 재료로 레시피 필터링
   * POST /api/recipes/filter
   */
  filterRecipesByIngredients: (ingredientIds: number[]) => 
    apiClient.post<RecipeSummaryDto[]>(`${BASE_PATH}/filter`, ingredientIds),

  /**
   * 레시피 평점 저장
   * POST /api/recipes/score
   */
  addScore: (data: { recipeId: number; rating: number }) => 
    apiClient.post(`${BASE_PATH}/score`, data),

  /**
   * 내가 매긴 레시피 평점 조회
   * GET /api/recipes/{id}/score
   */
  getMyScore: (id: number) => 
    apiClient.get<number>(`${BASE_PATH}/${id}/score`),

  /**
   * 레시피 평균 평점 조회
   * GET /api/recipes/{id}/score/average
   */
  getScoreAverage: (id: number) => 
    apiClient.get<number>(`${BASE_PATH}/${id}/score/average`),

  /**
   * 레시피 북마크 상태 확인
   * GET /api/recipes/saved/check/{recipeId}
   */
  checkIfSaved: async (id: number): Promise<boolean> => {
    try {
      const response = await apiClient.get<boolean>(`${BASE_PATH}/saved/check/${id}`);
      return response.data;
    } catch (error) {
      console.error('북마크 상태 확인 실패:', error);
      return false;
    }
  },
}; 