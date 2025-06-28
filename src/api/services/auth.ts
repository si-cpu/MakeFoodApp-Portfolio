import api from '../axios';
import { AuthResponseDto, AccessTokenDto, RefreshRequestDto } from '../../types/auth';

const BASE_PATH = '/auth';

export interface SocialLoginRequest {
  provider: 'google' | 'apple' | 'naver';
  accessToken?: string; // Google용
  idToken?: string; // Google용  
  identityToken?: string; // Apple용
  authorizationCode?: string; // Apple용
}


export const authService = {
  loginWithGoogle: async (idToken: string): Promise<AuthResponseDto> => {
    const response = await api.post('/auth/oauth/google', { idToken });
    return response.data;
  },

  /**
   * 토큰 갱신
   * POST /api/auth/refresh
   */
  refresh: (request: RefreshRequestDto) => 
    apiClient.post<AuthResponseDto>(`${BASE_PATH}/refresh`, request),

  logout: async (): Promise<void> => {
    await api.delete('/auth/oauth/logout');
  },
}; 