import { useAppDispatch, useAppSelector } from '../store/hooks';
import { authService } from '../api/services/auth';
import { setUser, setToken, logout, resetAll } from '../store/slices/authSlice';
import { resetRecipes } from '../store/slices/recipeSlice';
import { resetIngredients } from '../store/slices/ingredientSlice';
import { resetOnboarding } from '../store/slices/onboardingSlice';
import { setLoading } from '../store/slices/loadingSlice';
import { clearError } from '../store/slices/errorSlice';
import { googleSignInService } from '../services/socialLogin/GoogleSignInService';
import { appleSignInService } from '../services/socialLogin/AppleSignInService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
  const { isLoading, message } = useAppSelector((state) => state.loading);


  const socialLogin = async (provider: 'google' | 'apple') => {
    try {
      dispatch(setLoading({ isLoading: true, message: `${provider} 로그인 중...` }));
      
      let socialUserInfo;
      
      if (provider === 'google') {
        socialUserInfo = await googleSignInService.signIn();
        
        // 백엔드에 Google ID Token 전달
        const response = await authService.socialLogin({
          provider: 'google',
          idToken: socialUserInfo.idToken,
        });
        
        const { accessToken, userId, onboarded } = response.data;
        dispatch(setToken(accessToken));
        dispatch(setUser({ 
          id: userId, 
          gender: '',
          age: 0,
          householdSize: 0,
          onboarded,
          newUser: false,
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
      } else if (provider === 'apple') {
        socialUserInfo = await appleSignInService.signIn();
        
        // 백엔드에 Apple Identity Token과 Authorization Code 전달
        const response = await authService.socialLogin({
          provider: 'apple',
          identityToken: socialUserInfo.identityToken,
          authorizationCode: socialUserInfo.authorizationCode,
        });
        
        const { accessToken, userId, onboarded } = response.data;
        dispatch(setToken(accessToken));
        dispatch(setUser({ 
          id: userId, 
          gender: '',
          age: 0,
          householdSize: 0,
          onboarded,
          newUser: false,
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
      }
      
    } catch (error) {
      console.error(`${provider} 로그인 실패:`, error);
      throw error;
    } finally {
      dispatch(setLoading({ isLoading: false }));
    }
  };

  const logoutUser = async () => {
    try {
      dispatch(setLoading({ isLoading: true, message: '로그아웃 중...' }));
      
      // 서버에 로그아웃 요청 (선택적)
      try {
        await authService.logout();
        console.log('서버 로그아웃 성공');
      } catch (serverError: any) {
        // 404 에러는 서버에 로그아웃 엔드포인트가 없는 경우이므로 무시
        if (serverError?.response?.status === 404) {
          console.log('서버에 로그아웃 엔드포인트가 없습니다. 클라이언트 로그아웃만 진행합니다.');
        } else {
          console.warn('서버 로그아웃 요청 실패:', serverError);
        }
        // 서버 요청이 실패해도 클라이언트 로그아웃은 진행
      }
      
      // Redux 상태 초기화
      dispatch(logout());
      
      // AsyncStorage에서 토큰과 사용자 정보 삭제
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user_info');
      await AsyncStorage.removeItem('refreshToken');
      
      // 기타 캐시 데이터 삭제
      await AsyncStorage.removeItem('@recommendations');
      await AsyncStorage.removeItem('@recommendations_timestamp');
      
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    } finally {
      dispatch(setLoading({ isLoading: false }));
    }
  };

  const resetAllData = async () => {
    try {
      dispatch(setLoading({ isLoading: true, message: '데이터 초기화 중...' }));
      
      // 모든 Redux 상태 초기화
      dispatch(resetAll());
      dispatch(resetRecipes());
      dispatch(resetIngredients());
      dispatch(resetOnboarding());
      dispatch(clearError());
      
      // AsyncStorage에서 모든 데이터 삭제
      await AsyncStorage.clear();
      
    } catch (error) {
      console.error('데이터 초기화 실패:', error);
      throw error;
    } finally {
      dispatch(setLoading({ isLoading: false }));
    }
  };

  return {
    // 상태
    user: user || null,
    token: accessToken,
    isAuthenticated,
    userId: user?.id || null,
    isLoading,
    loadingMessage: message,
    
    // 액션
    socialLogin,
    logout: logoutUser,
    updateToken: (newToken: string) => dispatch(setToken(newToken)),
    resetAllData,
  };
}; 