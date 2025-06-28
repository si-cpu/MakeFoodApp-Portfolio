#!/bin/bash

# 소셜 로그인 설정 헬퍼 스크립트
# MakeFoodApp - 안드로이드 & iOS 소셜 로그인 설정 가이드

echo "🚀 MakeFoodApp 소셜 로그인 설정 가이드"
echo "================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 체크리스트 함수
print_checklist() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "-------------------"
}

print_todo() {
    echo -e "${YELLOW}  ☐ $1${NC}"
}

print_done() {
    echo -e "${GREEN}  ✓ $1${NC}"
}

print_error() {
    echo -e "${RED}  ✗ $1${NC}"
}

echo ""
echo "📱 플랫폼: Android & iOS"
echo "🔐 소셜 로그인: Google, Naver, Apple"
echo ""

# Google 로그인 설정
print_checklist "Google 로그인 설정"
print_todo "Google Cloud Console에서 프로젝트 생성"
print_todo "OAuth 2.0 클라이언트 ID 생성 (Android, iOS, Web)"
print_todo "android/app/google-services.json 파일 추가"
print_todo "ios/GoogleService-Info.plist 파일 추가"
print_todo "SHA-1 인증서 지문 등록 (Android 디버그/릴리즈)"
print_todo "Bundle ID/Package Name 등록"

# Naver 로그인 설정
print_checklist "네이버 로그인 설정"
print_todo "네이버 개발자센터에서 애플리케이션 등록"
print_todo "Android 키 해시 등록"
print_todo "iOS Bundle ID 등록"
print_todo "환경변수 설정 (NAVER_CONSUMER_KEY, NAVER_CONSUMER_SECRET)"

# 안드로이드 설정 확인
print_checklist "Android 설정 확인"
if [ -f "android/app/google-services.json" ]; then
    print_done "google-services.json 파일 존재"
else
    print_error "google-services.json 파일 없음"
fi

if grep -q "com.google.gms.google-services" android/app/build.gradle; then
    print_done "Google Services 플러그인 설정됨"
else
    print_error "Google Services 플러그인 미설정"
fi

if grep -q "makefoodapp" android/app/src/main/AndroidManifest.xml; then
    print_done "URL Scheme 설정됨"
else
    print_error "URL Scheme 미설정"
fi

# iOS 설정 확인
print_checklist "iOS 설정 확인"
if [ -f "ios/MakeFoodApp/GoogleService-Info.plist" ]; then
    print_done "GoogleService-Info.plist 파일 존재"
else
    print_error "GoogleService-Info.plist 파일 없음"
fi

if [ -f "ios/MakeFoodApp/Info.plist" ]; then
    if grep -q "makefoodapp" ios/MakeFoodApp/Info.plist; then
        print_done "URL Scheme 설정됨"
    else
        print_error "URL Scheme 미설정"
    fi
else
    print_error "Info.plist 파일 없음"
fi

# 환경변수 확인
print_checklist "환경변수 확인"
if [ -f ".env" ]; then
    print_done ".env 파일 존재"
    
    if grep -q "GOOGLE_WEB_CLIENT_ID" .env; then
        print_done "Google 웹 클라이언트 ID 설정됨"
    else
        print_error "Google 웹 클라이언트 ID 미설정"
    fi
    
    if grep -q "GOOGLE_IOS_CLIENT_ID" .env; then
        print_done "Google iOS 클라이언트 ID 설정됨"
    else
        print_error "Google iOS 클라이언트 ID 미설정"
    fi
    
    if grep -q "NAVER_CONSUMER_KEY" .env; then
        print_done "네이버 Consumer Key 설정됨"
    else
        print_error "네이버 Consumer Key 미설정"
    fi
else
    print_error ".env 파일 없음"
fi

# 키 해시 생성 명령어
print_checklist "Android 키 해시 생성"
echo -e "${YELLOW}디버그 키 해시 생성:${NC}"
echo "keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64"
echo ""
echo -e "${YELLOW}릴리즈 키 해시 생성:${NC}"
echo "keytool -exportcert -alias your-key-alias -keystore your-release-key.keystore | openssl sha1 -binary | openssl base64"

# 완료 메시지
echo ""
echo -e "${GREEN}🎉 설정이 완료되면 다음 명령어로 앱을 실행하세요:${NC}"
echo "npm run android  # 안드로이드"
echo "npm run ios      # iOS"
echo ""
echo -e "${BLUE}📚 자세한 설정 방법은 다음 문서를 참고하세요:${NC}"
echo "- Google Sign-In: https://github.com/react-native-google-signin/google-signin"
echo "- Naver Login: https://github.com/react-native-seoul/react-native-naver-login"
echo "" 