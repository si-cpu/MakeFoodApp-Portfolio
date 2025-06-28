#!/bin/bash

echo "🔍 버전 호환성 체크 시작..."

# Node.js 버전 체크
echo "📱 Node.js 버전:"
node --version

# React Native 버전 체크  
echo "⚛️ React Native 버전:"
npx react-native --version

# iOS 의존성 체크
echo "🍎 iOS 의존성 체크:"
cd ios && pod --version

# 호환성 문제 스캔
echo "🔍 패키지 호환성 스캔:"
npx react-native doctor

echo "✅ 버전 체크 완료!" 