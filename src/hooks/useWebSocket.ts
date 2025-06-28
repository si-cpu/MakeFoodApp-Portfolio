import { useEffect, useState, useCallback, useRef } from 'react';
import {
  WebSocketService,
  createWebSocketService,
  getWebSocketService,
  cleanupWebSocketService,
} from '../api/services/websocket';
import {
  WebSocketState,
  WebSocketOptions,
  ProgressInfo,
  OcrResultData,
  RecommendationResultData,
} from '../types/websocket';

interface UseWebSocketReturn {
  // 연결 상태
  state: WebSocketState;
  isConnected: boolean;
  
  // 연결 관리
  connect: () => Promise<void>;
  disconnect: () => void;
  updateToken: (token: string) => void;
  
  // OCR 관련
  requestOcr: (imageUrl: string) => void;
  ocrProgress: ProgressInfo | null;
  ocrResult: OcrResultData | null;
  ocrError: string | null;
  clearOcrData: () => void;
  
  // 추천 관련
  requestRecommendation: () => void;
  recommendationProgress: ProgressInfo | null;
  recommendationResult: RecommendationResultData | null;
  recommendationError: string | null;
  clearRecommendationData: () => void;
  
  // 일반 상태
  generalProgress: { progress: number; message: string } | null;
  generalError: string | null;
  clearGeneralData: () => void;
  
  // 토큰 만료
  tokenExpired: boolean;
  clearTokenExpired: () => void;
}

export const useWebSocket = (options: WebSocketOptions): UseWebSocketReturn => {
  // 연결 상태
  const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  
  // OCR 상태
  const [ocrProgress, setOcrProgress] = useState<ProgressInfo | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResultData | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  
  // 추천 상태
  const [recommendationProgress, setRecommendationProgress] = useState<ProgressInfo | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResultData | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  
  // 일반 상태
  const [generalProgress, setGeneralProgress] = useState<{ progress: number; message: string } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);
  
  // 웹소켓 서비스 참조
  const webSocketRef = useRef<WebSocketService | null>(null);

  // 웹소켓 서비스 초기화
  useEffect(() => {
    const wsService = createWebSocketService(options);
    webSocketRef.current = wsService;

    // 이벤트 리스너 설정
    wsService.setEventListeners({
      onStateChange: setState,
      
      // OCR 이벤트
      onOcrProgress: (progress) => {
        setOcrProgress(progress);
        setOcrError(null); // 진행 중이면 에러 초기화
      },
      onOcrResult: (result) => {
        setOcrResult(result);
        setOcrProgress(null); // 완료되면 진행 상황 초기화
        setOcrError(null);
      },
      onOcrError: (error) => {
        setOcrError(error);
        setOcrProgress(null); // 에러 발생시 진행 상황 초기화
      },
      
      // 추천 이벤트
      onRecommendationProgress: (progress) => {
        setRecommendationProgress(progress);
        setRecommendationError(null);
      },
      onRecommendationResult: (result) => {
        setRecommendationResult(result);
        setRecommendationProgress(null);
        setRecommendationError(null);
      },
      onRecommendationError: (error) => {
        setRecommendationError(error);
        setRecommendationProgress(null);
      },
      
      // 일반 이벤트
      onGeneralProgress: (progress, message) => {
        setGeneralProgress({ progress, message });
        setGeneralError(null);
      },
      onGeneralError: (error) => {
        setGeneralError(error);
        setGeneralProgress(null);
      },
      
      // 토큰 만료
      onTokenExpired: () => {
        setTokenExpired(true);
      },
    });

    // 초기 상태 설정
    setState(wsService.getState());

    // 컴포넌트 언마운트 시 정리
    return () => {
      cleanupWebSocketService();
    };
  }, [options.userId, options.baseUrl]); // 토큰은 updateToken으로 업데이트

  // 연결 관리 메서드들
  const connect = useCallback(async (): Promise<void> => {
    if (webSocketRef.current) {
      await webSocketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback((): void => {
    if (webSocketRef.current) {
      webSocketRef.current.disconnect();
    }
  }, []);

  const updateToken = useCallback((token: string): void => {
    if (webSocketRef.current) {
      webSocketRef.current.updateToken(token);
    }
  }, []);

  // OCR 메서드들
  const requestOcr = useCallback((imageUrl: string): void => {
    if (webSocketRef.current) {
      // 이전 OCR 데이터 초기화
      setOcrResult(null);
      setOcrError(null);
      setOcrProgress(null);
      
      webSocketRef.current.requestOcr(imageUrl);
    }
  }, []);

  const clearOcrData = useCallback((): void => {
    setOcrProgress(null);
    setOcrResult(null);
    setOcrError(null);
  }, []);

  // 추천 메서드들
  const requestRecommendation = useCallback((): void => {
    if (webSocketRef.current) {
      // 이전 추천 데이터 초기화
      setRecommendationResult(null);
      setRecommendationError(null);
      setRecommendationProgress(null);
      
      webSocketRef.current.requestRecommendation();
    }
  }, []);

  const clearRecommendationData = useCallback((): void => {
    setRecommendationProgress(null);
    setRecommendationResult(null);
    setRecommendationError(null);
  }, []);

  // 일반 데이터 정리
  const clearGeneralData = useCallback((): void => {
    setGeneralProgress(null);
    setGeneralError(null);
  }, []);

  // 토큰 만료 상태 정리
  const clearTokenExpired = useCallback((): void => {
    setTokenExpired(false);
  }, []);

  // 연결 상태 계산
  const isConnected = state === WebSocketState.CONNECTED;

  return {
    // 연결 상태
    state,
    isConnected,
    
    // 연결 관리
    connect,
    disconnect,
    updateToken,
    
    // OCR 관련
    requestOcr,
    ocrProgress,
    ocrResult,
    ocrError,
    clearOcrData,
    
    // 추천 관련
    requestRecommendation,
    recommendationProgress,
    recommendationResult,
    recommendationError,
    clearRecommendationData,
    
    // 일반 상태
    generalProgress,
    generalError,
    clearGeneralData,
    
    // 토큰 만료
    tokenExpired,
    clearTokenExpired,
  };
};

// 기본 훅 (현재 웹소켓 서비스 사용)
export const useExistingWebSocket = (): Omit<UseWebSocketReturn, 'connect' | 'disconnect' | 'updateToken'> | null => {
  const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  
  // OCR 상태
  const [ocrProgress, setOcrProgress] = useState<ProgressInfo | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResultData | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  
  // 추천 상태
  const [recommendationProgress, setRecommendationProgress] = useState<ProgressInfo | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResultData | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  
  // 일반 상태
  const [generalProgress, setGeneralProgress] = useState<{ progress: number; message: string } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);

  useEffect(() => {
    const wsService = getWebSocketService();
    if (!wsService) {
      return;
    }

    // 이벤트 리스너 설정 (위와 동일)
    wsService.setEventListeners({
      onStateChange: setState,
      onOcrProgress: setOcrProgress,
      onOcrResult: setOcrResult,
      onOcrError: setOcrError,
      onRecommendationProgress: setRecommendationProgress,
      onRecommendationResult: setRecommendationResult,
      onRecommendationError: setRecommendationError,
      onGeneralProgress: (progress, message) => setGeneralProgress({ progress, message }),
      onGeneralError: setGeneralError,
      onTokenExpired: () => setTokenExpired(true),
    });

    setState(wsService.getState());
  }, []);

  const wsService = getWebSocketService();
  if (!wsService) {
    return null;
  }

  return {
    // 연결 상태
    state,
    isConnected: state === WebSocketState.CONNECTED,
    
    // OCR 관련
    requestOcr: (imageUrl: string) => wsService.requestOcr(imageUrl),
    ocrProgress,
    ocrResult,
    ocrError,
    clearOcrData: () => {
      setOcrProgress(null);
      setOcrResult(null);
      setOcrError(null);
    },
    
    // 추천 관련
    requestRecommendation: () => wsService.requestRecommendation(),
    recommendationProgress,
    recommendationResult,
    recommendationError,
    clearRecommendationData: () => {
      setRecommendationProgress(null);
      setRecommendationResult(null);
      setRecommendationError(null);
    },
    
    // 일반 상태
    generalProgress,
    generalError,
    clearGeneralData: () => {
      setGeneralProgress(null);
      setGeneralError(null);
    },
    
    // 토큰 만료
    tokenExpired,
    clearTokenExpired: () => setTokenExpired(false),
  };
}; 