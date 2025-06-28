import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketState } from '../types/websocket';

interface WebSocketExampleProps {
  userId: string;
  token: string;
}

const WebSocketExample: React.FC<WebSocketExampleProps> = ({ userId, token }) => {
  const webSocket = useWebSocket({
    userId,
    token,
    baseUrl: __DEV__ ? 'ws://localhost:8000' : 'wss://makefood-api.store',
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  // 토큰 만료 처리
  useEffect(() => {
    if (webSocket.tokenExpired) {
      Alert.alert(
        '토큰 만료',
        '로그인이 만료되었습니다. 다시 로그인해주세요.',
        [
          {
            text: '확인',
            onPress: () => {
              webSocket.clearTokenExpired();
              // 여기서 로그인 화면으로 이동하는 로직 추가
            },
          },
        ]
      );
    }
  }, [webSocket.tokenExpired]);

  // 일반 에러 처리 - 조용히 로깅만 처리
  useEffect(() => {
    if (webSocket.generalError) {
      console.log('WebSocket 일반 에러:', webSocket.generalError);
      webSocket.clearGeneralData();
    }
  }, [webSocket.generalError]);

  // OCR 결과 처리
  useEffect(() => {
    if (webSocket.ocrResult) {
      console.log('OCR 결과:', webSocket.ocrResult);
      // OCR 결과를 처리하는 로직 추가
    }
  }, [webSocket.ocrResult]);

  // 추천 결과 처리
  useEffect(() => {
    if (webSocket.recommendationResult) {
      console.log('추천 결과:', webSocket.recommendationResult);
      // 추천 결과를 처리하는 로직 추가
    }
  }, [webSocket.recommendationResult]);

  const getStateColor = (state: WebSocketState): string => {
    switch (state) {
      case WebSocketState.CONNECTED:
        return '#4CAF50';
      case WebSocketState.CONNECTING:
      case WebSocketState.RECONNECTING:
        return '#FF9800';
      case WebSocketState.ERROR:
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStateText = (state: WebSocketState): string => {
    switch (state) {
      case WebSocketState.CONNECTED:
        return '연결됨';
      case WebSocketState.CONNECTING:
        return '연결 중...';
      case WebSocketState.RECONNECTING:
        return '재연결 중...';
      case WebSocketState.ERROR:
        return '오류';
      default:
        return '연결 안됨';
    }
  };

  const renderProgressBar = (progress: number): React.ReactNode => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.max(0, Math.min(100, progress))}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{progress}%</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>웹소켓 테스트</Text>

      {/* 연결 상태 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>연결 상태</Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStateColor(webSocket.state) },
            ]}
          />
          <Text style={styles.statusText}>{getStateText(webSocket.state)}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.connectButton]}
            onPress={webSocket.connect}
            disabled={webSocket.isConnected}
          >
            <Text style={styles.buttonText}>연결</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={webSocket.disconnect}
            disabled={!webSocket.isConnected}
          >
            <Text style={styles.buttonText}>연결 해제</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* OCR 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OCR 테스트</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.ocrButton]}
          onPress={() => webSocket.requestOcr('https://example.com/receipt.jpg')}
          disabled={!webSocket.isConnected}
        >
          <Text style={styles.buttonText}>OCR 요청</Text>
        </TouchableOpacity>

        {webSocket.ocrProgress && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              {webSocket.ocrProgress.stepDescription}
            </Text>
            {renderProgressBar(webSocket.ocrProgress.percentage)}
            <Text style={styles.progressStep}>
              {webSocket.ocrProgress.currentStep} / {webSocket.ocrProgress.totalSteps}
            </Text>
          </View>
        )}

        {webSocket.ocrError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>OCR 에러: {webSocket.ocrError}</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={webSocket.clearOcrData}
            >
              <Text style={styles.clearButtonText}>지우기</Text>
            </TouchableOpacity>
          </View>
        )}

        {webSocket.ocrResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>OCR 결과:</Text>
            <Text style={styles.resultText}>
              인식된 재료: {webSocket.ocrResult.ingredients?.length || 0}개
            </Text>
            {webSocket.ocrResult.ingredients?.map((ingredient, index) => (
              <Text key={index} style={styles.resultText}>
                • {ingredient.itemName} {ingredient.quantity}{ingredient.unit} ({ingredient.price.toLocaleString()}원)
              </Text>
            ))}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={webSocket.clearOcrData}
            >
              <Text style={styles.clearButtonText}>지우기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 추천 섹션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>레시피 추천 테스트</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.recommendationButton]}
          onPress={webSocket.requestRecommendation}
          disabled={!webSocket.isConnected}
        >
          <Text style={styles.buttonText}>추천 요청</Text>
        </TouchableOpacity>

        {webSocket.recommendationProgress && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              {webSocket.recommendationProgress.stepDescription}
            </Text>
            {renderProgressBar(webSocket.recommendationProgress.percentage)}
            <Text style={styles.progressStep}>
              {webSocket.recommendationProgress.currentStep} / {webSocket.recommendationProgress.totalSteps}
            </Text>
          </View>
        )}

        {webSocket.recommendationError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              추천 에러: {webSocket.recommendationError}
            </Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={webSocket.clearRecommendationData}
            >
              <Text style={styles.clearButtonText}>지우기</Text>
            </TouchableOpacity>
          </View>
        )}

        {webSocket.recommendationResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>추천 결과:</Text>
            <Text style={styles.resultText}>
              총 {webSocket.recommendationResult.total_count}개 레시피
            </Text>
            <Text style={styles.resultText}>
              표시된 레시피: {webSocket.recommendationResult.recipes.length}개
            </Text>
            <Text style={styles.resultText}>
              추천 이유: {webSocket.recommendationResult.recommendation_reason}
            </Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={webSocket.clearRecommendationData}
            >
              <Text style={styles.clearButtonText}>지우기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 일반 진행 상황 */}
      {webSocket.generalProgress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일반 진행 상황</Text>
          <Text style={styles.progressLabel}>
            {webSocket.generalProgress.message}
          </Text>
          {renderProgressBar(webSocket.generalProgress.progress)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  ocrButton: {
    backgroundColor: '#2196F3',
    marginBottom: 12,
  },
  recommendationButton: {
    backgroundColor: '#9C27B0',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 35,
  },
  progressStep: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 8,
  },
  resultContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 4,
  },
  clearButton: {
    backgroundColor: '#666',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default WebSocketExample; 