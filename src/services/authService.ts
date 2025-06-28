import { AxiosError } from 'axios';
import { api, setAuthTokens, removeAuthTokens } from './api';
import { store } from '../store';
import { setUser, setToken } from '../store/slices/authSlice';


export interface UserInfoRequest {
  name: string;
  email: string;
  dislikedIngredients: string[];
  preferredIngredients: string[];
  allergyIngredients: string[];
}

export interface AuthResponse {
  accessToken: string;
  userId: string;
  onboarded: boolean;
  newUser: boolean;
  name?: string;
}

export const authService = {
  updateUserInfo: async (data: UserInfoRequest): Promise<void> => {
    await api.put('/users/info', data);
  },

  logout: async (): Promise<void> => {
    await api.delete('/auth/oauth/logout');
    await removeAuthTokens();
  },

  getCurrentUser: async (): Promise<UserInfoRequest> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  checkName: async (name: string): Promise<boolean> => {
    const response = await api.get(`/users/name-check?name=${name}`);
    return response.data;
  },

  loginWithGoogle: async ({ idToken }: { idToken: string }): Promise<AuthResponse> => {
    try {
      console.log('Google 로그인 요청 시작:', { idToken });
      
      const response = await api.post<AuthResponse>('/auth/oauth/google', { idToken });
      console.log('Google 로그인 응답:', response.data);
      
      if (!response.data) {
        throw new Error('서버 응답이 없습니다.');
      }
      
    const { accessToken, userId, onboarded, newUser } = response.data;
      
      if (!accessToken || !userId) {
        throw new Error('필수 응답 데이터가 없습니다.');
      }
      
      try {
    await setAuthTokens(accessToken, userId);
        console.log('토큰 저장 완료');
        
        // Redux 상태 업데이트
        store.dispatch(setToken(accessToken));
        store.dispatch(setUser({ 
          id: userId, 
          name: response.data.name,
          onboarded, 
          newUser,
          gender: '',
          age: 0,
          householdSize: 0,
          tools: [],
          preferences: [],
          dislikes: [],
          allergies: [],
          preferredCategories: [],
          nutritionPreference: {
            calories: 0,
            protein: 0,
            fat: 0,
            carbohydrates: 0
          }
        }));
        console.log('Redux 상태 업데이트 완료');
        
        return response.data;
      } catch (storageError) {
        console.error('토큰 저장 실패:', storageError);
        throw new Error('토큰 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Google 로그인 API 요청 실패:', error);
      if (error instanceof AxiosError) {
        console.error('에러 응답:', error.response?.data);
        console.error('에러 상태:', error.response?.status);
        throw new Error(error.response?.data?.message || '로그인에 실패했습니다.');
      }
      throw error;
    }
  },
}; 