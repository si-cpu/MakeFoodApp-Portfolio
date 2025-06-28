import { Platform } from 'react-native';
import { appleAuth } from '@invertase/react-native-apple-authentication';

export interface AppleUserInfo {
  identityToken: string;
  authorizationCode: string;
  user: {
    id: string;
    name?: string;
    email?: string;
  };
}

class AppleSignInService {
  async isSupported(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }
    
    try {
      return await appleAuth.isSupported;
    } catch (error) {
      console.error('Apple Sign-In 지원 확인 실패:', error);
      return false;
    }
  }

  async signIn(): Promise<AppleUserInfo> {
    try {
      // Apple Sign-In 지원 확인
      const isSupported = await this.isSupported();
      if (!isSupported) {
        throw new Error('이 기기에서는 Apple 로그인을 사용할 수 없습니다.');
      }

      // Apple 로그인 요청
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // 신용도 상태 확인
      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      if (credentialState !== appleAuth.State.AUTHORIZED) {
        throw new Error('Apple 로그인이 승인되지 않았습니다.');
      }

      // 필수 정보 확인
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Identity Token을 받을 수 없습니다.');
      }

      if (!appleAuthRequestResponse.authorizationCode) {
        throw new Error('Apple Authorization Code를 받을 수 없습니다.');
      }

      return {
        identityToken: appleAuthRequestResponse.identityToken,
        authorizationCode: appleAuthRequestResponse.authorizationCode,
        user: {
          id: appleAuthRequestResponse.user,
          name: appleAuthRequestResponse.fullName?.givenName 
            ? `${appleAuthRequestResponse.fullName.givenName} ${appleAuthRequestResponse.fullName.familyName || ''}`.trim()
            : undefined,
          email: appleAuthRequestResponse.email || undefined,
        },
      };

    } catch (error: any) {
      console.error('Apple 로그인 실패:', error);
      
      if (error.code === appleAuth.Error.CANCELED) {
        throw new Error('Apple 로그인이 취소되었습니다.');
      } else if (error.code === appleAuth.Error.FAILED) {
        throw new Error('Apple 로그인에 실패했습니다.');
      } else if (error.code === appleAuth.Error.INVALID_RESPONSE) {
        throw new Error('Apple 로그인 응답이 유효하지 않습니다.');
      } else if (error.code === appleAuth.Error.NOT_HANDLED) {
        throw new Error('Apple 로그인이 처리되지 않았습니다.');
      } else if (error.code === appleAuth.Error.UNKNOWN) {
        throw new Error('알 수 없는 Apple 로그인 오류가 발생했습니다.');
      } else {
        throw new Error(`Apple 로그인 실패: ${error.message}`);
      }
    }
  }

  async getCredentialState(userID: string): Promise<string> {
    try {
      const credentialState = await appleAuth.getCredentialStateForUser(userID);
      
      switch (credentialState) {
        case appleAuth.State.AUTHORIZED:
          return 'authorized';
        case appleAuth.State.REVOKED:
          return 'revoked';
        case appleAuth.State.NOT_FOUND:
          return 'not_found';
        default:
          return 'unknown';
      }
    } catch (error) {
      console.error('Apple 신용도 상태 확인 실패:', error);
      throw error;
    }
  }

  // Apple은 명시적인 로그아웃 기능이 없음
  // 대신 로컬에서 사용자 정보를 제거
  async signOut(): Promise<void> {
    console.log('Apple Sign-In: 로컬 사용자 정보 제거');
    // 실제로는 앱에서 사용자 정보를 제거하는 로직
  }
}

export const appleSignInService = new AppleSignInService(); 