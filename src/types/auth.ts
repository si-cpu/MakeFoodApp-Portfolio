/**
 * UUID 타입 정의
 */
export type UUID = string; // Swagger에서 format: uuid는 string

/**
 * 액세스 토큰 (Swagger AccessTokenDto 스펙)
 */
export interface AccessTokenDto {
  idToken: string;
}

/**
 * 인증 응답 (Swagger AuthResponseDto 스펙)
 */
export interface AuthResponseDto {
  accessToken: string;
  userId: UUID;
  onboarded: boolean;
  newUser: boolean;
}

/**
 * 토큰 갱신 요청 (Swagger RefreshRequestDto 스펙)
 */
export interface RefreshRequestDto {
  userId: UUID;
}

/**
 * 토큰 응답
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * 소셜 로그인 요청
 */
export interface SocialLoginRequest {
  code: string;
  state: string;
}

/**
 * 테스트 로그인 요청
 */
export interface TestLoginRequest {
  username: string;
  password: string;
} 