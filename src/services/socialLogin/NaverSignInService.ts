import NaverLogin from '@react-native-seoul/naver-login';
import { Platform } from 'react-native';

export interface NaverUserInfo {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
}

class NaverSignInService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // 네이버 개발자 콘솔에서 발급받은 클라이언트 정보
      const consumerKey = process.env.NAVER_CONSUMER_KEY || 'YOUR_NAVER_CONSUMER_KEY';
      const consumerSecret = process.env.NAVER_CONSUMER_SECRET || 'YOUR_NAVER_CONSUMER_SECRET';
      const appName = process.env.NAVER_APP_NAME || 'MakeFoodApp';

      NaverLogin.initialize({
        appName,
        consumerKey,
        consumerSecret,
        // iOS 설정
        serviceUrlSchemeIOS: 'makefoodapp', // iOS URL Scheme
        disableNaverAppAuthIOS: true, // 네이버 앱 없이도 로그인 가능
        
        // Android 설정
        ...(Platform.OS === 'android' && {
          // 안드로이드용 추가 설정
          // 네이버 개발자 콘솔에서 안드로이드 앱 등록 시 받은 정보
          // packageName: 'com.makefoodapp', // AndroidManifest.xml의 package name과 일치해야 함
          // keyHash: 'YOUR_ANDROID_KEY_HASH', // 안드로이드 키 해시 (개발자 콘솔에서 확인)
        }),
      });

      this.initialized = true;
      console.log(`네이버 로그인 초기화 완료 (${Platform.OS})`);
    } catch (error) {
      console.error('네이버 로그인 초기화 실패:', error);
      throw error;
    }
  }

  async signIn(): Promise<NaverUserInfo> {
    try {
      await this.initialize();

      // 네이버 로그인 실행
      const result = await NaverLogin.login();
      
      if (result.isSuccess && result.successResponse) {
        const { accessToken } = result.successResponse;
        
        // 사용자 정보 가져오기
        const profileResult = await NaverLogin.getProfile(accessToken);
        
        if (profileResult.message === 'success' && profileResult.response) {
          const profile = profileResult.response;
          
          return {
            accessToken,
            user: {
              id: profile.id,
              name: profile.name || profile.nickname || '',
              email: profile.email || '',
              profileImage: profile.profile_image || undefined,
            },
          };
        } else {
          throw new Error('네이버 프로필 정보를 가져올 수 없습니다.');
        }
      } else {
        throw new Error(result.failureResponse?.message || '네이버 로그인에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('네이버 로그인 실패:', error);
      
      if (error.message?.includes('cancel') || error.message?.includes('취소')) {
        throw new Error('네이버 로그인이 취소되었습니다.');
      } else if (error.message?.includes('network')) {
        throw new Error('네트워크 연결을 확인해주세요.');
      } else {
        throw new Error(`네이버 로그인 실패: ${error.message}`);
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      await NaverLogin.logout();
      console.log('네이버 로그아웃 완료');
    } catch (error) {
      console.error('네이버 로그아웃 실패:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<NaverUserInfo | null> {
    try {
      // 현재 로그인 상태 확인
      // 실제 구현에서는 AsyncStorage에서 토큰을 확인하거나
      // 네이버 SDK의 현재 사용자 정보 조회 기능을 사용
      return null;
    } catch (error) {
      console.error('현재 네이버 사용자 정보 가져오기 실패:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string> {
    try {
      // 네이버 로그인은 토큰 갱신을 지원하지 않음
      // 토큰이 만료되면 다시 로그인해야 함
      throw new Error('네이버 로그인은 토큰 갱신을 지원하지 않습니다. 다시 로그인해주세요.');
    } catch (error) {
      console.error('네이버 토큰 갱신 실패:', error);
      throw error;
    }
  }

  // 플랫폼별 설정 확인 헬퍼 메소드
  getRequiredSettings() {
    if (Platform.OS === 'ios') {
      return {
        platform: 'iOS',
        requiredSettings: [
          'Info.plist에 URL Scheme 추가',
          'LSApplicationQueriesSchemes에 naversearchapp, naversearchthirdlogin 추가',
          'AppDelegate에 네이버 로그인 설정 추가'
        ]
      };
    } else {
      return {
        platform: 'Android',
        requiredSettings: [
          'AndroidManifest.xml에 intent-filter 추가',
          '네이버 개발자 콘솔에서 안드로이드 앱 등록',
          '키 해시 등록 (개발/배포용)',
          'Proguard 설정 (배포 시)'
        ]
      };
    }
  }
}

export const naverSignInService = new NaverSignInService();