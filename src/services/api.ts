import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://makefood-api.store/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000,
  validateStatus: (status) => {
    return status >= 200 && status < 500;
  }
});

// 요청 인터셉터
api.interceptors.request.use(
  async (config) => {
    try {
      const fullUrl = `${config.baseURL}${config.url}`;
      console.log('API 요청 시작:', {
        fullUrl,
        method: config.method,
        data: config.data,
        config: {
          timeout: config.timeout,
          validateStatus: config.validateStatus
        }
      });
      
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
      
      console.log('API 요청 헤더:', config.headers);
    return config;
    } catch (error) {
      console.error('요청 인터셉터 에러:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('API 요청 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    try {
      const fullUrl = `${response.config.baseURL}${response.config.url}`;
      console.log('API 응답 성공:', {
        fullUrl,
        status: response.status,
        data: response.data,
        headers: response.headers,
        config: {
          timeout: response.config.timeout,
          validateStatus: response.config.validateStatus
        }
      });
      return response;
    } catch (error) {
      console.error('응답 인터셉터 에러:', error);
      return Promise.reject(error);
    }
  },
  async (error) => {
    try {
      const fullUrl = error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
      
      if (error.code === 'ECONNABORTED') {
        console.error('요청 타임아웃:', {
          fullUrl,
          timeout: error.config?.timeout,
          config: error.config
        });
      } else if (!error.response) {
        console.error('네트워크 에러:', {
          fullUrl,
          message: error.message,
          code: error.code,
          stack: error.stack,
          config: error.config
        });
      } else {
        console.error('API 응답 에러:', {
          fullUrl,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          config: error.config
        });
      }
      
    if (error.response?.status === 401) {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        try {
          const response = await api.post('/auth/refresh', { userId });
          const { accessToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api(error.config);
        } catch (refreshError) {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('userId');
          }
        }
      }
      return Promise.reject(error);
    } catch (interceptorError) {
      console.error('에러 인터셉터 에러:', interceptorError);
      return Promise.reject(error);
    }
  }
);

export const setAuthTokens = async (accessToken: string, userId: string) => {
  try {
    console.log('토큰 저장 시작:', { accessToken, userId });
  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('userId', userId);
    console.log('토큰 저장 완료');
  } catch (error) {
    console.error('토큰 저장 에러:', error);
    throw error;
  }
};

export const removeAuthTokens = async () => {
  try {
    console.log('토큰 제거 시작');
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('userId');
    console.log('토큰 제거 완료');
  } catch (error) {
    console.error('토큰 제거 에러:', error);
    throw error;
  }
}; 