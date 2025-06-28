import { Platform } from 'react-native';
import { googleSignInService, GoogleUserInfo } from '../services/socialLogin/GoogleSignInService';
import { naverSignInService, NaverUserInfo } from '../services/socialLogin/NaverSignInService';

export enum SocialProvider {
  GOOGLE = 'google',
  NAVER = 'naver',
  APPLE = 'apple'
}

export interface UnifiedSocialUser {
  provider: SocialProvider;
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  accessToken: string;
  idToken?: string;
}

export class SocialLoginUtils {
  // 플랫폼별 지원되는 소셜 로그인 제공자 확인
  static getSupportedProviders(): SocialProvider[] {
    const providers = [SocialProvider.GOOGLE, SocialProvider.NAVER];
    
    // Apple Sign-In은 iOS에서만 지원
    if (Platform.OS === 'ios') {
      providers.push(SocialProvider.APPLE);
    }
    
    return providers;
  }

  // 특정 제공자가 현재 플랫폼에서 지원되는지 확인
  static isProviderSupported(provider: SocialProvider): boolean {
    return this.getSupportedProviders().includes(provider);
  }

  // 통합된 소셜 로그인 실행
  static async signIn(provider: SocialProvider): Promise<UnifiedSocialUser> {
    if (!this.isProviderSupported(provider)) {
      throw new Error(`${provider} 로그인은 ${Platform.OS}에서 지원되지 않습니다.`);
    }

    try {
      switch (provider) {
        case SocialProvider.GOOGLE:
          return await this.signInWithGoogle();
        case SocialProvider.NAVER:
          return await this.signInWithNaver();
        case SocialProvider.APPLE:
          if (Platform.OS === 'ios') {
            return await this.signInWithApple();
          }
          throw new Error('Apple Sign-In은 iOS에서만 지원됩니다.');
        default:
          throw new Error(`지원되지 않는 소셜 로그인 제공자입니다: ${provider}`);
      }
    } catch (error) {
      console.error(`Social login failed for ${provider}:`, error);
      throw error;
    }
  }

  // Google 로그인
  private static async signInWithGoogle(): Promise<UnifiedSocialUser> {
    const userInfo: GoogleUserInfo = await googleSignInService.signIn();
    
    return {
      provider: SocialProvider.GOOGLE,
      id: userInfo.user.id,
      name: userInfo.user.name,
      email: userInfo.user.email,
      profileImage: userInfo.user.photo,
      accessToken: userInfo.accessToken,
      idToken: userInfo.idToken,
    };
  }

  // 네이버 로그인
  private static async signInWithNaver(): Promise<UnifiedSocialUser> {
    const userInfo: NaverUserInfo = await naverSignInService.signIn();
    
    return {
      provider: SocialProvider.NAVER,
      id: userInfo.user.id,
      name: userInfo.user.name,
      email: userInfo.user.email,
      profileImage: userInfo.user.profileImage,
      accessToken: userInfo.accessToken,
    };
  }

  // Apple 로그인 (iOS 전용)
  private static async signInWithApple(): Promise<UnifiedSocialUser> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In은 iOS에서만 지원됩니다.');
    }

    // Apple Sign-In 구현이 필요한 경우 여기에 추가
    throw new Error('Apple Sign-In 구현이 필요합니다.');
    
    // 예시 구현:
    // const appleAuthRequestResponse = await appleAuth.performRequest({
    //   requestedOperation: appleAuth.Operation.LOGIN,
    //   requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    // });
    
    // return {
    //   provider: SocialProvider.APPLE,
    //   id: appleAuthRequestResponse.user,
    //   name: `${appleAuthRequestResponse.fullName?.givenName || ''} ${appleAuthRequestResponse.fullName?.familyName || ''}`.trim(),
    //   email: appleAuthRequestResponse.email || '',
    //   accessToken: appleAuthRequestResponse.identityToken || '',
    // };
  }

  // 통합 로그아웃
  static async signOut(provider: SocialProvider): Promise<void> {
    try {
      switch (provider) {
        case SocialProvider.GOOGLE:
          await googleSignInService.signOut();
          break;
        case SocialProvider.NAVER:
          await naverSignInService.signOut();
          break;
        case SocialProvider.APPLE:
          // Apple Sign-In은 별도 로그아웃이 필요 없음 (앱에서 토큰만 삭제)
          console.log('Apple Sign-In 로그아웃 완료');
          break;
        default:
          console.warn(`알 수 없는 소셜 로그인 제공자입니다: ${provider}`);
      }
    } catch (error) {
      console.error(`Social logout failed for ${provider}:`, error);
      throw error;
    }
  }

  // 현재 로그인된 사용자 정보 가져오기
  static async getCurrentUser(provider: SocialProvider): Promise<UnifiedSocialUser | null> {
    try {
      switch (provider) {
        case SocialProvider.GOOGLE:
          const googleUser = await googleSignInService.getCurrentUser();
          if (!googleUser) return null;
          
          return {
            provider: SocialProvider.GOOGLE,
            id: googleUser.user.id,
            name: googleUser.user.name,
            email: googleUser.user.email,
            profileImage: googleUser.user.photo,
            accessToken: googleUser.accessToken,
            idToken: googleUser.idToken,
          };
          
        case SocialProvider.NAVER:
          const naverUser = await naverSignInService.getCurrentUser();
          if (!naverUser) return null;
          
          return {
            provider: SocialProvider.NAVER,
            id: naverUser.user.id,
            name: naverUser.user.name,
            email: naverUser.user.email,
            profileImage: naverUser.user.profileImage,
            accessToken: naverUser.accessToken,
          };
          
        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to get current user for ${provider}:`, error);
      return null;
    }
  }

  // 플랫폼별 설정 요구사항 가져오기
  static getConfigurationRequirements(): Record<string, string[]> {
    return {
      common: [
        '환경변수 파일(.env) 설정',
        '소셜 로그인 제공자별 앱 등록',
        '클라이언트 ID 및 시크릿 발급'
      ],
      android: [
        'google-services.json 파일 추가',
        'AndroidManifest.xml 권한 및 액티비티 설정',
        'SHA-1 인증서 지문 등록',
        '안드로이드 키 해시 등록 (네이버)',
        'Proguard 규칙 설정'
      ],
      ios: [
        'GoogleService-Info.plist 파일 추가',
        'Info.plist URL Scheme 설정',
        'LSApplicationQueriesSchemes 설정',
        'Bundle ID 등록',
        'AppDelegate 설정'
      ]
    };
  }

  // 디버깅용 설정 검증
  static async validateConfiguration(): Promise<Record<string, boolean>> {
    const validation: Record<string, boolean> = {};

    try {
      // Google 설정 검증
      await googleSignInService.checkConfiguration();
      validation.google = true;
    } catch (error) {
      validation.google = false;
    }

    // 네이버 설정 검증
    try {
      const naverSettings = naverSignInService.getRequiredSettings();
      validation.naver = naverSettings.platform === Platform.OS;
    } catch (error) {
      validation.naver = false;
    }

    return validation;
  }
}

export default SocialLoginUtils; 