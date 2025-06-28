/**
 * 웹소켓 메시지 타입 정의
 */

// ============= 클라이언트 → 서버 요청 메시지 =============

export interface BaseClientMessage {
  type: string;
}

/**
 * OCR 요청 메시지
 */
export interface OcrRequestMessage extends BaseClientMessage {
  type: 'ocr';
  image_url: string;
}

/**
 * 레시피 추천 요청 메시지
 */
export interface RecommendationRequestMessage extends BaseClientMessage {
  type: 'recommendation';
}

export type ClientMessage = 
  | OcrRequestMessage 
  | RecommendationRequestMessage
  | { type: 'auth'; token: string };

// ============= 서버 → 클라이언트 응답 메시지 =============

export interface BaseServerMessage {
  type: string;
  service?: string;
}

/**
 * 진행 상황 정보
 */
export interface ProgressInfo {
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  percentage: number;
}

/**
 * OCR 진행 상황 메시지
 */
export interface OcrProgressMessage extends BaseServerMessage {
  type: 'ocr_progress';
  service: 'ocr';
  progress: ProgressInfo;
}

/**
 * OCR 결과 데이터 (실제 서버 응답 구조)
 */
export interface OcrResultData {
  // 기존 구조 (호환성을 위해 유지)
  ingredients?: Array<{
    itemName: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  
  // 실제 받은 메시지 구조
  text?: string;
  regions?: Array<{
    text: string;
    confidence: number;
    bbox: number[];
  }>;
  total_confidence?: number;
  processing_time?: number;
  language?: string;
  prices?: any[];
  dates?: any[];
  clear_ingredients_list?: any[];
}

/**
 * OCR 결과 메시지
 */
export interface OcrResultMessage extends BaseServerMessage {
  type: 'ocr_result';
  service: 'ocr';
  data: OcrResultData;
}

/**
 * OCR 에러 메시지
 */
export interface OcrErrorMessage extends BaseServerMessage {
  type: 'ocr_error';
  service: 'ocr';
  message: string;
}

/**
 * 추천 진행 상황 메시지
 */
export interface RecommendationProgressMessage extends BaseServerMessage {
  type: 'recommendation_progress';
  service: 'recommendation';
  progress: ProgressInfo;
}

/**
 * 레시피 영양 정보
 */
export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * 레시피 재료 정보
 */
export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

/**
 * 추천 레시피 정보
 */
export interface RecommendedRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  difficulty: 'easy' | 'medium' | 'hard';
  cooking_time: number;
  servings: number;
  category: string;
  image_url: string;
  rating: number;
  nutrition: RecipeNutrition;
}

/**
 * 추천 결과 데이터
 */
export interface RecommendationResultData {
  recipes: RecommendedRecipe[];
  total_count: number;
  recommendation_reason: string;
}

/**
 * 추천 결과 메시지
 */
export interface RecommendationResultMessage extends BaseServerMessage {
  type: 'recommendation_result';
  service: 'recommendation';
  data: RecommendationResultData;
}

/**
 * 추천 에러 메시지
 */
export interface RecommendationErrorMessage extends BaseServerMessage {
  type: 'recommendation_error';
  service: 'recommendation';
  message: string;
}

/**
 * 토큰 만료 메시지
 */
export interface TokenExpiredMessage extends BaseServerMessage {
  type: 'token_expired';
  message: string;
}

/**
 * 범용 진행 상황 메시지
 */
export interface GeneralProgressMessage extends BaseServerMessage {
  type: 'general_progress';
  service: 'general';
  progress: number;
  message: string;
}

/**
 * 범용 에러 메시지
 */
export interface GeneralErrorMessage extends BaseServerMessage {
  type: 'general_error';
  service: 'general';
  message: string;
}

/**
 * 공통 에러 메시지 (백엔드에서 type: 'error' 로 내려오는 경우)
 */
export interface ErrorMessage extends BaseServerMessage {
  type: 'error';
  error_type: string;
  message: string;
}

export type ServerMessage = 
  | { type: 'ocr_progress'; progress: ProgressInfo }
  | { type: 'ocr_result'; data: OcrResultData }
  | { type: 'ocr_error'; message: string }
  | { type: 'recommendation_progress'; progress: ProgressInfo }
  | { type: 'recommendation_result'; data: RecommendationResultData }
  | { type: 'recommendation_error'; message: string }
  | { type: 'token_expired' }
  | { type: 'general_progress'; progress: number; message: string }
  | { type: 'general_error'; message: string }
  | { type: 'error'; error_type: string; message: string }
  | { type: 'auth_response'; success: boolean };

// ============= 웹소켓 연결 상태 =============

export enum WebSocketState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  RECONNECTING = 'RECONNECTING',
}

/**
 * 웹소켓 연결 옵션
 */
export interface WebSocketOptions {
  userId: string;
  token: string;
  baseUrl?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * 웹소켓 이벤트 리스너 타입
 */
export interface WebSocketEventListeners {
  onStateChange?: (state: WebSocketState) => void;
  onOcrProgress?: (progress: ProgressInfo) => void;
  onOcrResult?: (result: OcrResultData) => void;
  onOcrError?: (error: string) => void;
  onRecommendationProgress?: (progress: ProgressInfo) => void;
  onRecommendationResult?: (result: RecommendationResultData) => void;
  onRecommendationError?: (error: string) => void;
  onTokenExpired?: () => void;
  onGeneralProgress?: (progress: number, message: string) => void;
  onGeneralError?: (error: string) => void;
}

/**
 * 웹소켓 연결 종료 코드
 */
export enum WebSocketCloseCode {
  INVALID_USER = 4001,
  POLICY_VIOLATION = 1008,
  NORMAL_CLOSURE = 1000,
} 