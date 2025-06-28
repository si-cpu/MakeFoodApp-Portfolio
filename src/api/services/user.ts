import apiClient from '../axios';
import { 
  UserInfoDto, 
  UserStatsDto, 
  UpdateUserInfoRequest, 
  SaveUserInfoRequest,
  RecipeCategory
} from '../../types/user';
import { RecipeSummaryDto } from '../../types/recipe';

const BASE_PATH = '/users';

export const userService = {
  /**
   * 사용자 정보 업데이트
   * PUT /api/users/info
   */
  updateUserInfo: (userInfo: UserInfoDto) => 
    apiClient.put(`${BASE_PATH}/info`, userInfo),

  /**
   * 사용자 정보 저장
   * POST /api/users/info
   */
  saveUserInfo: (userInfo: UserInfoDto) => 
    apiClient.post(`${BASE_PATH}/info`, userInfo),

  /**
   * 내 정보 조회
   * GET /api/users/me
   */
  getMyInfo: () => 
    apiClient.get<UserInfoDto>(`${BASE_PATH}/me`),

  /**
   * 계정 삭제
   * DELETE /api/users/me
   */
  deleteMyAccount: () => 
    apiClient.delete(`${BASE_PATH}/me`),

  /**
   * 사용자 통계 조회
   * GET /api/users/stats
   */
  getUserStats: () => 
    apiClient.get<UserStatsDto>(`${BASE_PATH}/stats`),

  /**
   * 조리한 레시피 목록 조회
   * GET /api/users/cooked-recipes
   */
  getCookedRecipes: () => 
    apiClient.get<RecipeSummaryDto[]>(`${BASE_PATH}/cooked-recipes`),

  /**
   * 닉네임 중복 확인
   * GET /api/users/name-check?name={name}
   */
  checkName: (name: string) =>
    apiClient.get<boolean>(`${BASE_PATH}/name-check?name=${name}`),
}; 