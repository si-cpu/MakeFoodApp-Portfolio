#!/bin/bash

# 안드로이드 키 생성 및 확인 스크립트
# MakeFoodApp - Google Sign-In & Naver Login 키 생성

echo "🔑 안드로이드 키 생성 및 확인 도구"
echo "================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 디버그 키스토어 경로
DEBUG_KEYSTORE="$HOME/.android/debug.keystore"
APP_DEBUG_KEYSTORE="android/app/debug.keystore"

echo ""
echo -e "${BLUE}📱 패키지명: com.makefoodapp${NC}"
echo ""

# 1. SHA-1 인증서 지문 생성 (Google Sign-In용)
echo -e "${YELLOW}1. SHA-1 인증서 지문 생성 (Google Sign-In용)${NC}"
echo "================================================"

if [ -f "$DEBUG_KEYSTORE" ]; then
    echo -e "${GREEN}✓ 시스템 디버그 키스토어 발견: $DEBUG_KEYSTORE${NC}"
    echo ""
    echo -e "${BLUE}SHA-1 지문 (시스템 디버그 키스토어):${NC}"
    keytool -list -v -keystore "$DEBUG_KEYSTORE" -alias androiddebugkey -storepass android -keypass android | grep SHA1 | head -1
    echo ""
else
    echo -e "${RED}✗ 시스템 디버그 키스토어를 찾을 수 없습니다.${NC}"
fi

if [ -f "$APP_DEBUG_KEYSTORE" ]; then
    echo -e "${GREEN}✓ 앱 디버그 키스토어 발견: $APP_DEBUG_KEYSTORE${NC}"
    echo ""
    echo -e "${BLUE}SHA-1 지문 (앱 디버그 키스토어):${NC}"
    keytool -list -v -keystore "$APP_DEBUG_KEYSTORE" -alias androiddebugkey -storepass android -keypass android | grep SHA1 | head -1
    echo ""
else
    echo -e "${RED}✗ 앱 디버그 키스토어를 찾을 수 없습니다.${NC}"
fi

# 2. 네이버 로그인용 키 해시 생성
echo -e "${YELLOW}2. 네이버 로그인용 키 해시 생성${NC}"
echo "=================================="

if [ -f "$DEBUG_KEYSTORE" ]; then
    echo -e "${BLUE}키 해시 (시스템 디버그 키스토어):${NC}"
    keytool -exportcert -alias androiddebugkey -keystore "$DEBUG_KEYSTORE" -storepass android -keypass android | openssl sha1 -binary | openssl base64
    echo ""
else
    echo -e "${RED}✗ 시스템 디버그 키스토어를 찾을 수 없습니다.${NC}"
fi

if [ -f "$APP_DEBUG_KEYSTORE" ]; then
    echo -e "${BLUE}키 해시 (앱 디버그 키스토어):${NC}"
    keytool -exportcert -alias androiddebugkey -keystore "$APP_DEBUG_KEYSTORE" -storepass android -keypass android | openssl sha1 -binary | openssl base64
    echo ""
else
    echo -e "${RED}✗ 앱 디버그 키스토어를 찾을 수 없습니다.${NC}"
fi

# 3. 릴리즈 키스토어 생성 (선택사항)
echo -e "${YELLOW}3. 릴리즈 키스토어 생성 (선택사항)${NC}"
echo "=================================="

RELEASE_KEYSTORE="android/app/release.keystore"

if [ ! -f "$RELEASE_KEYSTORE" ]; then
    echo -e "${BLUE}릴리즈 키스토어가 없습니다. 생성하시겠습니까? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo ""
        echo -e "${YELLOW}릴리즈 키스토어 생성 중...${NC}"
        keytool -genkey -v -keystore "$RELEASE_KEYSTORE" -alias release -keyalg RSA -keysize 2048 -validity 10000
        
        if [ -f "$RELEASE_KEYSTORE" ]; then
            echo ""
            echo -e "${GREEN}✓ 릴리즈 키스토어 생성 완료!${NC}"
            echo ""
            echo -e "${BLUE}릴리즈 SHA-1 지문:${NC}"
            keytool -list -v -keystore "$RELEASE_KEYSTORE" -alias release | grep SHA1 | head -1
            echo ""
            echo -e "${BLUE}릴리즈 키 해시 (네이버용):${NC}"
            keytool -exportcert -alias release -keystore "$RELEASE_KEYSTORE" | openssl sha1 -binary | openssl base64
            echo ""
        fi
    fi
else
    echo -e "${GREEN}✓ 릴리즈 키스토어 존재: $RELEASE_KEYSTORE${NC}"
    echo ""
    echo -e "${BLUE}릴리즈 SHA-1 지문:${NC}"
    keytool -list -v -keystore "$RELEASE_KEYSTORE" -alias release | grep SHA1 | head -1
    echo ""
    echo -e "${BLUE}릴리즈 키 해시 (네이버용):${NC}"
    keytool -exportcert -alias release -keystore "$RELEASE_KEYSTORE" | openssl sha1 -binary | openssl base64
    echo ""
fi

# 4. 설정 가이드
echo -e "${YELLOW}4. 설정 가이드${NC}"
echo "=============="
echo ""
echo -e "${BLUE}📋 Google Cloud Console 설정:${NC}"
echo "1. https://console.cloud.google.com/ 접속"
echo "2. 프로젝트 생성 또는 선택"
echo "3. 'APIs & Services' > 'Credentials' 이동"
echo "4. 'CREATE CREDENTIALS' > 'OAuth client ID' 선택"
echo "5. Application type: Android"
echo "6. Package name: com.makefoodapp"
echo "7. SHA-1 certificate fingerprint: 위에서 생성된 SHA-1 지문 입력"
echo ""
echo -e "${BLUE}📋 네이버 개발자센터 설정:${NC}"
echo "1. https://developers.naver.com/apps/ 접속"
echo "2. 애플리케이션 등록"
echo "3. 사용 API: 네이버 로그인"
echo "4. 환경 추가 > Android"
echo "5. 패키지명: com.makefoodapp"
echo "6. 키 해시: 위에서 생성된 키 해시 입력"
echo ""
echo -e "${GREEN}🎉 모든 키가 생성되었습니다!${NC}"
echo -e "${YELLOW}⚠️  생성된 키들을 각각의 개발자 콘솔에 등록해주세요.${NC}"
echo "" 