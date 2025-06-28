import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useTheme } from '../../theme/ThemeContext';
import Button from '../../components/common/Button';
import { authService } from '../../services/authService';
import { AxiosError } from 'axios';
import Config from 'react-native-config';

// Google 로그인 설정
console.log('Google 로그인 설정 확인...');
console.log('WEB_CLIENT_ID:', Config.GOOGLE_WEB_CLIENT_ID);
console.log('IOS_CLIENT_ID:', Config.GOOGLE_IOS_CLIENT_ID);

// 임시로 직접 값 할당 (테스트용)
const GOOGLE_WEB_CLIENT_ID = Config.GOOGLE_WEB_CLIENT_ID || '193063862311-8c9ic2g74d2gk4mh2jiotideqafgcjhq.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = Config.GOOGLE_IOS_CLIENT_ID || '193063862311-q4qapg9lhlgj5fivjpehsld9cvchrf3p.apps.googleusercontent.com';

console.log('실제 사용할 WEB_CLIENT_ID:', GOOGLE_WEB_CLIENT_ID);
console.log('실제 사용할 IOS_CLIENT_ID:', GOOGLE_IOS_CLIENT_ID);

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true, // 토큰 갱신을 위해 true로 변경
  hostedDomain: '', // 특정 도메인 제한이 없으면 빈 문자열
  forceCodeForRefreshToken: true, // 갱신 토큰 강제 요청
  accountName: '', // 기본값 사용
  googleServicePlistPath: '', // iOS에서 자동으로 찾도록 빈 문자열
  openIdRealm: '', // 기본값 사용
  profileImageSize: 120, // 프로필 이미지 크기
});

export const LoginScreen = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      console.log('Google 로그인 시작...');
      
      // Play Services 확인 (Android 전용이지만 iOS에서도 안전하게 실행됨)
      await GoogleSignin.hasPlayServices();
      
      // Google 로그인 실행
      const result = await GoogleSignin.signIn();
      console.log('Google 로그인 응답:', result);
      
      // 사용자가 로그인을 취소한 경우
      if (result.type === 'cancelled') {
        console.log('사용자가 Google 로그인을 취소했습니다.');
        return;
      }
      
      // 성공적인 로그인 응답에서 데이터 추출
      const userInfo = result.data;
      if (!userInfo) {
        throw new Error('Google 로그인 응답에서 사용자 정보를 찾을 수 없습니다.');
      }
      
      console.log('Google 사용자 정보:', userInfo);
      
      // idToken 추출 (올바른 경로로 수정)
      const idToken = userInfo.idToken;
      if (!idToken) {
        console.error('사용자 정보 전체:', JSON.stringify(userInfo, null, 2));
        throw new Error('Google ID 토큰이 없습니다. 다시 시도해주세요.');
      }
      
      console.log('ID 토큰 획득 성공, 서버 로그인 시도...');
      await authService.loginWithGoogle({ idToken });
      
    } catch (error: any) {
      console.error('Google 로그인 에러:', error);
      
      // 사용자가 취소한 경우는 에러 알림을 표시하지 않음
      if (error?.code === '-5' || error?.message?.includes('cancelled')) {
        console.log('사용자가 로그인을 취소했습니다.');
        return;
      }
      
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={[styles.title, { color: theme.colors.text }]}>
          맛있는 요리, 쉽게 시작하세요    
        </Text>

        <View style={styles.inputContainer}>
        </View>


        <View style={styles.divider}>
      
        </View>

        <Button
          title="Google로 계속하기"
          onPress={handleGoogleLogin}
          variant="outline"
          style={styles.socialButton}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            구글 계정으로 간편하게 시작하세요
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontFamily: 'Pretendard-Regular',
  },
  button: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontFamily: 'Pretendard-Regular',
  },
  socialButton: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: 'Pretendard-Regular',
    marginRight: 8,
  },
  footerLink: {
    fontFamily: 'Pretendard-Medium',
  },
}); 