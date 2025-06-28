import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export interface GoogleUserInfo {
  accessToken: string;
  idToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    photo?: string;
  };
}

class GoogleSignInService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // 간단한 설정으로 시작
      const config = {
        webClientId: '193063862311-q4qapg9lhlgj5fivjpehsld9cvchrf3p.apps.googleusercontent.com',
        offlineAccess: false, // 일단 false로 설정
        forceCodeForRefreshToken: false, // 일단 false로 설정
      };

      // iOS에서만 iosClientId 추가
      if (Platform.OS === 'ios') {
        (config as any).iosClientId = '193063862311-q4qapg9lhlgj5fivjpehsld9cvchrf3p.apps.googleusercontent.com';
      }

      await GoogleSignin.configure(config);

      this.initialized = true;
      console.log(`Google Sign-In 초기화 완료 (${Platform.OS})`);
    } catch (error) {
      console.error('Google Sign-In 초기화 실패:', error);
      throw error;
    }
  }

  async signIn(): Promise<GoogleUserInfo> {
    try {
      await this.initialize();

      // 현재 로그인 상태 확인 및 초기화
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // 로그인 상태가 아니면 무시
      }

      // Android에서 Google Play Services 확인
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      // 사용자가 Google 계정 선택
      const userInfo = await GoogleSignin.signIn();
      
      // 액세스 토큰 가져오기
      const tokens = await GoogleSignin.getTokens();

      // 타입 안전성을 위한 처리
      const user = userInfo.data?.user || (userInfo as any).user;
      if (!user) {
        throw new Error('사용자 정보를 가져올 수 없습니다.');
      }

      return {
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
        user: {
          id: user.id,
          name: user.name || '',
          email: user.email,
          photo: user.photo || undefined,
        },
      };

    } catch (error: any) {
      console.error('Google 로그인 실패:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Google 로그인이 취소되었습니다.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google 로그인이 이미 진행 중입니다.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services를 사용할 수 없습니다. Play Store에서 업데이트해주세요.');
      } else {
        throw new Error(`Google 로그인 실패: ${error.message}`);
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      console.log('Google 로그아웃 완료');
    } catch (error) {
      console.error('Google 로그아웃 실패:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<GoogleUserInfo | null> {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      if (!userInfo) return null;

      const tokens = await GoogleSignin.getTokens();
      
      // 타입 안전성을 위한 처리 - getCurrentUser는 User 타입을 반환
      const user = (userInfo as any).user || userInfo;
      if (!user) return null;

      return {
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
        user: {
          id: user.id,
          name: user.name || '',
          email: user.email,
          photo: user.photo || undefined,
        },
      };
    } catch (error) {
      console.error('현재 Google 사용자 정보 가져오기 실패:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('Google 토큰 갱신 실패:', error);
      throw error;
    }
  }

  // 플랫폼별 설정 확인 헬퍼 메소드
  getRequiredSettings() {
    if (Platform.OS === 'ios') {
      return {
        platform: 'iOS',
        requiredSettings: [
          'GoogleService-Info.plist 파일 추가',
          'Info.plist에 URL Scheme 추가 (REVERSED_CLIENT_ID)',
          'AppDelegate에 Google Sign-In 설정 추가'
        ]
      };
    } else {
      return {
        platform: 'Android',
        requiredSettings: [
          'google-services.json 파일 추가 (android/app/)',
          'android/build.gradle에 google-services 플러그인 추가',
          'android/app/build.gradle에 google-services 플러그인 적용',
          'SHA-1 인증서 지문을 Firebase 콘솔에 등록'
        ]
      };
    }
  }

  // 디버그용 설정 확인 메소드
  async checkConfiguration(): Promise<void> {
    try {
      console.log('Google Sign-In 초기화 상태:', this.initialized);
      
      if (Platform.OS === 'android') {
        const hasPlayServices = await GoogleSignin.hasPlayServices();
        console.log('Google Play Services 사용 가능:', hasPlayServices);
      }
    } catch (error) {
      console.error('Google Sign-In 설정 확인 실패:', error);
    }
  }
}

export const googleSignInService = new GoogleSignInService(); 