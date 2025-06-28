import apiClient from '../axios';
import { IngredientResponseDto } from '../../types/ingredient';

const BASE_PATH = '/ingredients';

export const ingredientService = {
  /**
   * 모든 재료 조회
   * GET /ingredients
   */
  getAllIngredients: () => 
    apiClient.get<IngredientResponseDto[]>(BASE_PATH),
}; 