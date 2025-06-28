import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { setError } from '../store/slices/errorSlice';

const BASE_URL = 'https://makefood-api.store/api'; // 스프링 백엔드 API URL

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터
api.interceptors.request.use(
  async (config) => {
    // JWT 토큰 추가
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 요청 로그
    try {
      console.log('[API Request]', {
        method: (config.method || 'GET').toUpperCase(),
        url: config.baseURL ? `${config.baseURL}${config.url}` : config.url,
        params: config.params,
        data: config.data,
      });
    } catch (_) {}

    return config;
  },
  (error) => {
    console.log('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response 인터셉터
api.interceptors.response.use(
  (response) => {
    try {
      console.log('[API Response]', {
        method: (response.config.method || 'GET').toUpperCase(),
        url: response.config.baseURL ? `${response.config.baseURL}${response.config.url}` : response.config.url,
        status: response.status,
        data: response.data,
      });
    } catch (_) {}
    return response;
  },
  async (error) => {
    try {
      console.log('[API Error]', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } catch (_) {}
    if (error.response?.status === 401) {
      // 토큰 만료 처리 - Recoil에서 관리하는 토큰들 제거
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user_info');
      // TODO: Recoil 상태도 초기화하거나 로그인 화면으로 리다이렉트
    } else if (error.response?.status === 404) {
      console.error('API 엔드포인트를 찾을 수 없습니다:', error.config.url);
      // 토큰이 있는지 확인
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('토큰이 없습니다. 로그인이 필요합니다.');
        // TODO: 로그인 화면으로 리다이렉트
      }
    }
    // 전역 에러 상태 업데이트
    const message = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
    store.dispatch(setError(message));
    return Promise.reject(error);
  }
);

export default api; 