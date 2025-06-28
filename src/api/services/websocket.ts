import {
  WebSocketState,
  WebSocketOptions,
  WebSocketEventListeners,
  WebSocketCloseCode,
  ClientMessage,
  ServerMessage,
  OcrRequestMessage,
  RecommendationRequestMessage,
  ProgressInfo,
  OcrResultData,
  RecommendationResultData,
} from '../../types/websocket';

// React Native 웹소켓 타입 정의
type WebSocketMessageEvent = {
  data: string;
};

type WebSocketCloseEvent = {
  code: number;
  reason: string;
};

/**
 * FastAPI 웹소켓 클라이언트 서비스
 */
export class WebSocketService {
  private ws: WebSocket | null = null;
  private state: WebSocketState = WebSocketState.DISCONNECTED;
  private listeners: WebSocketEventListeners = {};
  private options: Required<WebSocketOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(options: WebSocketOptions) {
    this.options = {
      baseUrl: 'wss://makefood-api.store',
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      ...options,
    };
  }

  /**
   * 이벤트 리스너 등록
   */
  setEventListeners(listeners: WebSocketEventListeners): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * 웹소켓 연결
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === WebSocketState.CONNECTED || this.state === WebSocketState.CONNECTING) {
        resolve();
        return;
      }

      this.setState(WebSocketState.CONNECTING);

      // Bearer 토큰 형식으로 전달
      const token = this.options.token.startsWith('Bearer ') 
        ? this.options.token 
        : `Bearer ${this.options.token}`;
      
      // React Native WebSocket은 헤더를 지원하지 않으므로 쿼리 파라미터로 토큰 전달
      const url = `${this.options.baseUrl}/ws/${this.options.userId}?token=${encodeURIComponent(token)}`;
      
      console.log('WebSocket 연결 시도:', {
        userId: this.options.userId,
        tokenLength: token.length,
        url,
        baseUrl: this.options.baseUrl,
        autoReconnect: this.options.autoReconnect,
        maxReconnectAttempts: this.options.maxReconnectAttempts
      });
      
      try {
        this.ws = new WebSocket(url);
        this.setupEventHandlers(resolve, reject);
      } catch (error) {
        this.setState(WebSocketState.ERROR);
        reject(error);
      }
    });
  }

  /**
   * 웹소켓 연결 해제
   */
  disconnect(): void {
    this.clearReconnectTimer();
    this.options.autoReconnect = false; // 수동 해제 시 자동 재연결 비활성화
    
    if (this.ws) {
      this.ws.close(WebSocketCloseCode.NORMAL_CLOSURE);
      this.ws = null;
    }
    
    this.setState(WebSocketState.DISCONNECTED);
  }

  /**
   * OCR 요청 전송
   */
  requestOcr(imageUrl: string): void {
    const message: OcrRequestMessage = {
      type: 'ocr',
      image_url: imageUrl,
    };
    this.sendMessage(message);
  }

  /**
   * 레시피 추천 요청 전송
   */
  requestRecommendation(): void {
    const message: RecommendationRequestMessage = {
      type: 'recommendation',
    };
    this.sendMessage(message);
  }

  /**
   * 현재 연결 상태 반환
   */
  getState(): WebSocketState {
    return this.state;
  }

  /**
   * 연결 여부 확인
   */
  isConnected(): boolean {
    return this.state === WebSocketState.CONNECTED;
  }

  /**
   * 토큰 업데이트 (재연결 필요)
   */
  updateToken(newToken: string): void {
    this.options.token = newToken;
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }

  // =================== Private Methods ===================

  /**
   * 메시지 전송
   */
  private sendMessage(message: ClientMessage): void {
    if (!this.isConnected() || !this.ws) {
      console.warn('WebSocket is not connected. Message not sent:', message);
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      console.log('WebSocket 메시지 전송:', {
        type: message.type,
        message: message,
        jsonString: messageStr
      });
      this.ws.send(messageStr);
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.listeners.onGeneralError?.('메시지 전송에 실패했습니다.');
    }
  }

  /**
   * 상태 변경 및 리스너 호출
   */
  private setState(newState: WebSocketState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.onStateChange?.(newState);
    }
  }

  /**
   * 웹소켓 이벤트 핸들러 설정
   */
  private setupEventHandlers(resolve: () => void, reject: (error: any) => void): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully');
      this.setState(WebSocketState.CONNECTED);
      this.reconnectAttempts = 0;
      
      // 연결 성공 후 약간의 지연을 두고 토큰 검증 메시지 전송
      setTimeout(() => {
        // 연결이 여전히 유지되고 있는지 확인
        if (this.isConnected() && this.ws) {
          const authMessage = {
            type: 'auth' as const,
            token: this.options.token
          };
          console.log('인증 메시지 전송 시도:', authMessage);
          this.sendMessage(authMessage as ClientMessage);
        } else {
          console.log('연결이 종료되어 인증 메시지 전송 취소');
        }
      }, 100); // 100ms 지연
      
      resolve();
    };

    this.ws.onmessage = (event) => {
      try {
        console.log('WebSocket raw message received:', event.data);
        const message: ServerMessage = JSON.parse(event.data);
        console.log('WebSocket parsed message:', {
          type: message.type,
          service: (message as any).service,
          dataType: typeof (message as any).data,
          dataLength: Array.isArray((message as any).data) ? (message as any).data.length : 'not array'
        });
        
        // 인증 응답 처리 추가
        if (message.type === 'auth_response') {
          if (!message.success) {
            this.setState(WebSocketState.ERROR);
            this.listeners.onTokenExpired?.();
            return;
          }
        }
        
        this.handleServerMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        this.listeners.onGeneralError?.('서버 메시지 파싱에 실패했습니다.');
      }
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket error details:', {
        error: event,
        state: this.state,
        url: this.options.baseUrl,
        userId: this.options.userId
      });
      this.setState(WebSocketState.ERROR);
      if (this.state === WebSocketState.CONNECTING) {
        reject(new Error(`WebSocket 연결 실패: ${event.message || '알 수 없는 오류가 발생했습니다.'}`));
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed with details:', {
        code: event.code,
        reason: event.reason,
        state: this.state
      });
      this.setState(WebSocketState.DISCONNECTED);
      this.ws = null;

      // FastAPI 백엔드의 에러 코드에 맞춰 처리
      switch (event.code) {
        case 4001: // 토큰 관련 에러
          this.listeners.onGeneralError?.('유효하지 않은 사용자입니다.');
          break;
        case 1008: // 정책 위반 (토큰 만료)
        case 4003: // 인증 실패
          this.listeners.onTokenExpired?.();
          break;
        case 1006: // 비정상 종료 (502, 403 등 서버 오류)
          // 서버 오류는 토큰 만료가 아닐 수 있으므로 일반 에러로 처리
          this.listeners.onGeneralError?.('서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
        case 1011: // 서버 내부 오류
          this.listeners.onGeneralError?.('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
        case 1012: // 서비스 재시작
          this.listeners.onGeneralError?.('서비스가 재시작 중입니다. 잠시 후 다시 시도해주세요.');
          break;
        case 1013: // 서비스 과부하
          this.listeners.onGeneralError?.('서비스가 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
          break;
        default:
          // 정상 종료(1000)인 경우 에러 메시지 표시하지 않음
          if (event.code === 1000) {
            console.log('WebSocket 정상 종료');
          } else if (this.options.autoReconnect) {
            console.log('자동 재연결 시도...');
            this.attemptReconnect();
          } else {
            this.listeners.onGeneralError?.('연결이 종료되었습니다.');
          }
          break;
      }
    };
  }

  /**
   * 서버 메시지 처리
   */
  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'ocr_progress':
        this.listeners.onOcrProgress?.(message.progress);
        break;
      
      case 'ocr_result':
        // 실제 받은 메시지 구조에 맞게 처리
        const ocrData = (message as any).ocr_result || message.data;
        this.listeners.onOcrResult?.(ocrData);
        break;
      
      case 'ocr_error': {
        const errorMessage = message.message;
        console.log('OCR 에러 수신:', errorMessage);
        
        // OCR 요청 제한 에러인 경우 연결 해제
        if (errorMessage.includes('10분에 한 번만 가능') || 
            errorMessage.includes('요청 제한') || 
            errorMessage.includes('rate limit')) {
          console.log('OCR 요청 제한 에러 - WebSocket 연결 해제');
          this.listeners.onOcrError?.(errorMessage);
          // 연결 해제
          setTimeout(() => {
            this.disconnect();
          }, 1000); // 1초 후 연결 해제 (에러 처리 완료 후)
        } else {
          this.listeners.onOcrError?.(errorMessage);
        }
        break;
      }
      
      case 'recommendation_progress':
        this.listeners.onRecommendationProgress?.(message.progress);
        break;
      
      case 'recommendation_result': {
        // 서버에서 보내는 실제 구조에 맞게 변환
        const messageData = message as any;
        const recipes = messageData.data || [];
        
        // 클라이언트가 기대하는 구조로 변환
        const transformedData: RecommendationResultData = {
          recipes: recipes.map((recipe: any) => ({
            id: String(recipe.recipe_id),
            title: recipe.title,
            description: recipe.description,
            image_url: recipe.image_url,
            difficulty: recipe.difficulty?.toLowerCase() || 'medium',
            cooking_time: recipe.cooking_time || 0,
            calories: recipe.calories || 0,
            matching_score: recipe.matching_score || 0,
            inventory_match_percentage: recipe.inventory_match_percentage || 0,
            matching_reasons: recipe.matching_reasons || [],
            // 기본값들 추가
            ingredients: [],
            servings: 1,
            category: 'general',
            rating: 0,
            nutrition: {
              calories: recipe.calories || 0,
              protein: 0,
              carbs: 0,
              fat: 0
            }
          })),
          total_count: recipes.length,
          recommendation_reason: messageData.recommendation_reason || 
            recipes.length > 0 ? `${recipes.length}개의 추천 레시피를 찾았습니다.` : '추천 레시피가 없습니다.'
        };
        
        console.log('추천 결과 변환 완료:', transformedData);
        this.listeners.onRecommendationResult?.(transformedData);
        break;
      }
      
      case 'recommendation_error':
        this.listeners.onRecommendationError?.(message.message);
        break;
      
      case 'token_expired':
        this.listeners.onTokenExpired?.();
        break;
      
      case 'general_progress':
        this.listeners.onGeneralProgress?.(message.progress, message.message);
        break;
      
      case 'general_error':
        this.listeners.onGeneralError?.(message.message);
        break;
      
      case 'error': {
        const err = message as any;
        const errorMessage = err.error || err.message || '알 수 없는 오류가 발생했습니다.';
        console.log('일반 에러 수신:', errorMessage);
        
        // OCR 요청 제한 에러 확인
        if (typeof errorMessage === 'string' && 
            (errorMessage.includes('10분에 한 번만 가능') || 
             errorMessage.includes('요청 제한') || 
             errorMessage.includes('rate limit'))) {
          console.log('OCR 요청 제한 에러 감지 - WebSocket 연결 해제');
          this.listeners.onOcrError?.(errorMessage);
          // 연결 해제
          setTimeout(() => {
            this.disconnect();
          }, 1000);
        } else if (err.error_type === 'recommendation') {
          this.listeners.onRecommendationError?.(errorMessage);
        } else {
          // 기술적인 에러 메시지는 사용자에게 표시하지 않음
          const technicalErrors = [
            'Invalid message type',
            'Unknown message type',
            'Message parsing error',
            'Invalid JSON',
            'Protocol error',
            'Connection error',
            'Websocket error',
            'Parse error',
            'Serialization error'
          ];
          
          const isTechnicalError = technicalErrors.some(tech => 
            errorMessage.toLowerCase().includes(tech.toLowerCase())
          );
          
          if (!isTechnicalError) {
            // 사용자에게 의미있는 에러만 표시
            this.listeners.onGeneralError?.(errorMessage);
          } else {
            // 기술적인 에러는 콘솔에만 로그하고 조용히 처리
            console.warn('기술적인 에러 (사용자에게 표시 안함):', errorMessage);
            // 기술적 에러가 반복되면 연결을 재설정할 수도 있음
            if (errorMessage.toLowerCase().includes('invalid message type')) {
              console.log('메시지 타입 에러 감지 - 연결 상태 확인');
              // 필요시 재연결 로직 추가 가능
            }
          }
        }
        break;
      }
      
      default:
        console.warn('Unknown message type:', message);
        break;
    }
  }

  /**
   * 재연결 시도
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.listeners.onGeneralError?.('서버 연결에 실패했습니다. 나중에 다시 시도해주세요.');
      return;
    }

    this.reconnectAttempts++;
    this.setState(WebSocketState.RECONNECTING);
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
        this.attemptReconnect();
      });
    }, this.options.reconnectInterval);
  }

  /**
   * 재연결 타이머 정리
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// 전역 웹소켓 서비스 인스턴스 (싱글톤 패턴)
let webSocketServiceInstance: WebSocketService | null = null;

/**
 * 웹소켓 서비스 인스턴스 생성/반환
 */
export const createWebSocketService = (options: WebSocketOptions): WebSocketService => {
  if (webSocketServiceInstance) {
    webSocketServiceInstance.disconnect();
  }
  webSocketServiceInstance = new WebSocketService(options);
  return webSocketServiceInstance;
};

/**
 * 현재 웹소켓 서비스 인스턴스 반환
 */
export const getWebSocketService = (): WebSocketService | null => {
  return webSocketServiceInstance;
};

/**
 * 웹소켓 서비스 정리
 */
export const cleanupWebSocketService = (): void => {
  if (webSocketServiceInstance) {
    webSocketServiceInstance.disconnect();
    webSocketServiceInstance = null;
  }
}; 