export const theme = {
  colors: {
    // 음식 앱에 적합한 따뜻하고 식욕을 자극하는 컬러 팔레트
    primary: '#FF6B35',       // 따뜻한 오렌지 (식욕 자극, 에너지)
    primaryLight: '#FF8F68',  // 밝은 오렌지
    primaryDark: '#E5521B',   // 진한 오렌지
    
    secondary: '#4CAE4F',     // 신선한 그린 (건강함, 자연스러움)
    secondaryLight: '#7BC34E', // 밝은 그린
    secondaryDark: '#3A8B3D',  // 진한 그린
    
    accent: '#FFD93D',        // 활기찬 골드 (프리미엄, 밝음)
    accentLight: '#FFE666',   // 밝은 골드
    accentDark: '#E6C42D',    // 진한 골드
    
    // 중성 색상 (고급스러운 그레이 스케일)
    background: '#FFFFFF',    // 순수한 화이트
    surface: '#F8F9FA',       // 연한 회색 표면
    surfaceVariant: '#F1F3F4', // 조금 더 진한 표면
    
    // 텍스트 색상 (명확한 계층구조)
    text: '#1A1A1A',          // 진한 블랙 (가독성 최우선)
    textSecondary: '#4A4A4A', // 보조 텍스트
    textLight: '#757575',     // 연한 텍스트
    textDisabled: '#BDBDBD',  // 비활성화 텍스트
    
    // 상태 색상 (현대적이고 명확함)
    success: '#4CAE4F',       // 성공 (그린으로 통일)
    error: '#FF5555',         // 오류 (빨간색)
    warning: '#FFA726',       // 경고 (오렌지)
    info: '#42A5F5',          // 정보 (파란색)
    
    // 기능적 색상
    white: '#FFFFFF',
    black: '#000000',
    border: '#E0E0E0',        // 경계선
    borderLight: '#F0F0F0',   // 연한 경계선
    shadow: '#000000',        // 그림자
    
    // 오버레이와 백드롭
    overlay: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.25)',
    
    // 그라데이션 (음식 앱에 적합한 따뜻한 조합)
    gradientPrimary: ['#FF6B35', '#FF8F68'],
    gradientSecondary: ['#4CAE4F', '#7BC34E'],
    gradientAccent: ['#FFD93D', '#FFE666'],
    gradientSunset: ['#FF6B35', '#FFD93D'], // 새로운 따뜻한 그라데이션
  },
  
  typography: {
    fontFamily: {
      regular: 'Pretendard-Regular',
      medium: 'Pretendard-Medium',
      semiBold: 'Pretendard-SemiBold',
      bold: 'Pretendard-Bold',
      extraBold: 'Pretendard-ExtraBold',
    },
    fontSize: {
      xs: 11,       // 매우 작은 텍스트
      small: 13,    // 캡션, 라벨
      base: 15,     // 기본 텍스트
      medium: 17,   // 부제목
      large: 20,    // 제목
      xl: 24,       // 큰 제목
      xxl: 28,      // 섹션 헤더
      xxxl: 32,     // 메인 헤더
      display: 40,  // 디스플레이용
    },
    lineHeight: {
      tight: 1.2,
      base: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    base: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    huge: 48,
    massive: 64,
  },
  
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 6,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  // 현대적인 그림자 시스템
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 12,
    },
    colored: {
      shadowColor: '#FF6B87',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  
  // 애니메이션 타이밍
  animation: {
    fast: 150,
    base: 200,
    slow: 300,
    slower: 500,
  },
  
  // 반응형 브레이크포인트
  breakpoints: {
    sm: 320,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

// 더 이상 사용하지 않는 레거시 테마들 제거
export type Theme = typeof theme;

// 다크 테마 (향후 확장용)
export const darkTheme: Theme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    text: '#FFFFFF',
    textSecondary: '#E0E0E0',
    textLight: '#B0B0B0',
    border: '#333333',
    borderLight: '#2A2A2A',
  },
}; 