import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  Alert, 
  RefreshControl, 
  ImageBackground,
  Image,
  StatusBar,
  Platform,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WebSocketState, RecommendedRecipe } from '../../types/websocket';
import { useAuth } from '../../hooks/useAuth';
import { recipeService } from '../../api/services/recipe';
import { RecipeSummaryDto } from '../../types/recipe';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import Loading from '../../components/common/Loading';
import AIBadge from '../../components/common/AIBadge';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { authService } from '../../api/services/auth';
import { ingredientService } from '../../api/services/ingredient';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setIngredients } from '../../store/slices/ingredientSlice';

type MainScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MainScreenProps {
  // navigation 등의 props가 있다면 여기에 추가
}

// 캐시 키 상수
const CACHE_KEYS = {
  RECOMMENDATIONS: '@recommendations',
  CACHE_TIMESTAMP: '@recommendations_timestamp'
};

// 캐시된 추천 데이터 타입
interface CachedRecommendations {
  recipes: RecommendedRecipe[];
  timestamp: number;
}

const MainScreen: React.FC<MainScreenProps> = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const { user, userId, token, updateToken, logout } = useAuth();
  const webSocket = useWebSocket({ userId: userId || '', token: token || '' });
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY_COUNT = 3;
  const [seasonalRecipes, setSeasonalRecipes] = useState<RecipeSummaryDto[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<RecipeSummaryDto[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<RecommendedRecipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  
  const dispatch = useAppDispatch();
  const storedIngredients = useAppSelector(state => state.ingredient.ingredients);

  // 캐시된 추천 데이터 로드
  const loadCachedRecommendations = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.RECOMMENDATIONS);
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      
      if (cachedData && timestamp) {
        const data: CachedRecommendations = JSON.parse(cachedData);
        const cacheTime = parseInt(timestamp);
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        
        if (cacheTime >= midnight.getTime()) {
          await clearCache();
          return false;
        }
        
        setRecommendedRecipes(data.recipes);
        return true;
      }
      return false;
    } catch (error) {
      console.error('캐시 로드 실패:', error);
      return false;
    }
  };

  // 캐시 삭제
  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.RECOMMENDATIONS);
      await AsyncStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
    } catch (error) {
      console.error('캐시 삭제 실패:', error);
    }
  };

  // 자정 체크 및 캐시 삭제
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const timeUntilMidnight = midnight.getTime() - now.getTime();
      
      setTimeout(async () => {
        await clearCache();
        checkMidnight();
      }, timeUntilMidnight);
    };

    checkMidnight();
  }, []);

  // 추천 데이터 캐싱
  const cacheRecommendations = async (recipes: RecommendedRecipe[]) => {
    try {
      const data: CachedRecommendations = { recipes, timestamp: Date.now() };
      await AsyncStorage.setItem(CACHE_KEYS.RECOMMENDATIONS, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('캐시 저장 실패:', error);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (userId) {
      loadInitialData();
      loadCachedRecommendations();
      if (storedIngredients.length === 0) {
        loadIngredients();
      }
    }
  }, [userId]);

  const loadIngredients = async () => {
          try {
            const res = await ingredientService.getAllIngredients();
            const payload = (res.data || []).map(i => ({ 
              id: i.id, 
              name: i.name,
              unit: i.unit 
            }));
            dispatch(setIngredients(payload));
          } catch (err) {
            console.error('재료 로드 실패:', err);
          }
  };

  // WebSocket 연결
useEffect(() => {
  if (userId && token) {
      webSocket.connect().catch(async (error) => {
          if (error.response?.status === 404 || error.response?.status === 403) {
              try {
                  const response = await authService.refresh({ userId });
                  const newToken = response.data.accessToken;
                  updateToken(newToken);
                  webSocket.updateToken(`Bearer ${newToken}`);
                  await webSocket.connect();
                  return;
              } catch (refreshError) {
                  Alert.alert(
                      '세션 만료',
                      '로그인이 만료되었습니다. 다시 로그인해주세요.',
              [{ text: '확인', onPress: () => { webSocket.clearTokenExpired(); logout(); } }]
                  );
                  return;
              }
          }
      });
  }
}, [userId, token]);

  // 토큰 만료 처리
  useEffect(() => {
    if (webSocket.tokenExpired) {
      Alert.alert(
        '세션 만료',
        '로그인이 만료되었습니다. 다시 로그인해주세요.',
        [{ text: '확인', onPress: () => { webSocket.clearTokenExpired(); logout(); } }]
      );
    }
  }, [webSocket.tokenExpired]);

  useEffect(() => {
    if (webSocket.generalError) {
      webSocket.clearGeneralData();
    }
  }, [webSocket.generalError]);

  // 추천 요청 함수
  const requestRecommendation = async () => {
      const hasCachedData = await loadCachedRecommendations();
    if (hasCachedData && recommendedRecipes.length > 0) return;

    if (webSocket.state !== WebSocketState.CONNECTED) {
      setRecommendationError('서버와의 연결이 끊어져 있습니다.');
        return;
      }

      setIsLoadingRecommendation(true);
      setRecommendationError(null);
    setRetryCount(0);

      webSocket.requestRecommendation();
  };

  // WebSocket 데이터 처리
  useEffect(() => {
    if (webSocket.recommendationResult?.recipes) {
      setRecommendedRecipes(webSocket.recommendationResult.recipes);
      cacheRecommendations(webSocket.recommendationResult.recipes);
      setIsLoadingRecommendation(false);
      setRecommendationError(null);
      webSocket.clearRecommendationData();
    }
  }, [webSocket.recommendationResult]);

  // 에러 처리
  useEffect(() => {
    if (webSocket.recommendationError) {
      if (retryCount < MAX_RETRY_COUNT) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          requestRecommendation();
        }, 2000);
      } else {
      setRecommendationError(webSocket.recommendationError);
        setIsLoadingRecommendation(false);
      }
      webSocket.clearRecommendationData();
    }
  }, [webSocket.recommendationError]);

  const handleRetry = async () => {
      setRetryCount(0);
    await requestRecommendation();
  };

  const loadInitialData = async () => {
    try {
      setIsLoadingRecipes(true);
      await Promise.all([loadSeasonalRecipes(), loadPopularRecipes()]);
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  const loadSeasonalRecipes = async () => {
    try {
      const response = await recipeService.getSeasonalRecipes();
      setSeasonalRecipes(response.data|| []);
    } catch (error) {
      console.error('계절 레시피 로드 실패:', error);
    }
  };

  const loadPopularRecipes = async () => {
    try {
      const response = await recipeService.getPopularRecipes();
      setPopularRecipes(response.data.content || []);
    } catch (error) {
      console.error('인기 레시피 로드 실패:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    await requestRecommendation();
    setRefreshing(false);
  };

  const handleRecipePress = (recipeId: number) => {
    navigation.navigate('RecipeDetail', { id: recipeId });
  };

  const navigateToCart = () => {
    navigation.navigate('MainTabs', { screen: 'Cart' } as any);
  };

  const navigateToInventory = () => {
    navigation.navigate('MainTabs', { screen: 'Inventory' } as any);
  };

  const navigateToRecipes = () => {
    navigation.navigate('MainTabs', { screen: 'Recipe' } as any);
  };

  const navigateToAccount = () => {
    navigation.navigate('MainTabs', { screen: 'Account' } as any);
  };

  if (isLoadingRecipes) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
    <ScrollView 
      style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
    >
        {/* 헤더 섹션 */}
        <LinearGradient
          colors={theme.colors.gradientPrimary as [string, string]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeText}>안녕하세요!</Text>
              <Text style={styles.subText}>오늘도 맛있는 요리 함께해요 🍳</Text>
          </View>
        </View>
        </LinearGradient>

        {/* 빠른 액션 카드들 */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={navigateToCart}>
            <LinearGradient
              colors={theme.colors.gradientSecondary as [string, string]}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="cart" size={24} color={theme.colors.white} />
              <Text style={styles.actionCardText}>장바구니</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToInventory}>
            <LinearGradient
              colors={theme.colors.gradientAccent as [string, string]}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="cube" size={24} color={theme.colors.white} />
              <Text style={styles.actionCardText}>재고관리</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToRecipes}>
            <LinearGradient
              colors={['#FF6B87', '#4ECDC4'] as [string, string]}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="restaurant" size={24} color={theme.colors.white} />
              <Text style={styles.actionCardText}>레시피</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToAccount}>
            <LinearGradient
              colors={['#4ECDC4', '#FFD93D'] as [string, string]}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="analytics" size={24} color={theme.colors.white} />
              <Text style={styles.actionCardText}>가계부</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* AI 추천 섹션 */}
      <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="sparkles" size={20} color={theme.colors.accent} />
              <Text style={styles.sectionTitle}>AI 맞춤 추천</Text>
            </View>
          </View>
          <View style={styles.sectionSubtitle}>
            <Text style={styles.subtitleText}>하루에 3가지 특별한 레시피를 추천해드려요</Text>
          </View>

        {isLoadingRecommendation ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator />
              <Text style={styles.loadingText}>AI가 레시피를 추천하고 있어요...</Text>
            </View>
          ) : recommendationError ? (
            <TouchableOpacity style={styles.errorContainer} onPress={handleRetry}>
              <Ionicons name="refresh-circle" size={32} color={theme.colors.error} />
              <Text style={styles.errorText}>추천을 받아오지 못했어요</Text>
              <Text style={styles.retryText}>다시 시도하려면 터치하세요</Text>
            </TouchableOpacity>
        ) : recommendedRecipes.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {recommendedRecipes.map((recipe) => (
              <TouchableOpacity 
                  key={recipe.id}
                  style={[styles.recipeCard, styles.recommendedCard]}
                  onPress={() => handleRecipePress(Number(recipe.id))}
              >
                  <View style={styles.recipeImageContainer}>
                <Image 
                      source={{ 
                        uri: recipe.image_url || 'https://via.placeholder.com/200x120/FFB5B5/FFFFFF?text=Recipe'
                      }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
                    <AIBadge position="top-right" size="small" />
                </View>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeTitle} numberOfLines={2}>
                      {recipe.title}
                  </Text>
                    <Text style={styles.recipeDescription} numberOfLines={2}>
                      {recipe.description}
                    </Text>
                    <View style={styles.recipeStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="time" size={14} color={theme.colors.textLight} />
                        <Text style={styles.statText}>15분</Text>
                </View>
                      <View style={styles.statItem}>
                        <Ionicons name="heart" size={14} color={theme.colors.primary} />
                        <Text style={styles.statText}>AI 추천</Text>
            </View>
          </View>
            </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
              <Ionicons name="sparkles" size={32} color={theme.colors.primary} />
              <Text style={styles.emptyTitle}>오늘의 추천 준비 중</Text>
              <Text style={styles.emptyDescription}>곧 맞춤 레시피를 추천해드릴게요</Text>
          </View>
        )}
      </View>

        {/* 계절 추천 섹션 */}
        {seasonalRecipes.length > 0 && (
      <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                              <Ionicons name="leaf" size={20} color={theme.colors.secondary} />
              <Text style={styles.sectionTitle}>계절 레시피</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {seasonalRecipes.map((recipe) => (
              <TouchableOpacity 
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => handleRecipePress(recipe.id)}
              >
                <View style={styles.recipeImageContainer}>
                <Image 
                    source={{ 
                      uri: recipe.imageUrl || 'https://via.placeholder.com/200x120/B8E6E1/FFFFFF?text=Recipe'
                    }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
                  <AIBadge position="top-right" size="small" />
                </View>
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                    <View style={styles.recipeStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="leaf" size={14} color={theme.colors.secondary} />
                        <Text style={styles.statText}>제철</Text>
                </View>
            </View>
          </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

      {/* 인기 레시피 섹션 */}
        {popularRecipes.length > 0 && (
          <View style={[styles.section, styles.lastSection]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="flame" size={20} color={theme.colors.accent} />
                <Text style={styles.sectionTitle}>인기 레시피</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {popularRecipes.map((recipe) => (
              <TouchableOpacity 
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => handleRecipePress(recipe.id)}
              >
                  <View style={styles.recipeImageContainer}>
                <Image 
                      source={{ 
                        uri: recipe.imageUrl || 'https://via.placeholder.com/200x120/FFE4B3/FFFFFF?text=Recipe'
                      }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
                    <AIBadge position="top-right" size="small" />
                </View>
                                  <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                  <View style={styles.recipeStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="flame" size={14} color={theme.colors.accent} />
                        <Text style={styles.statText}>인기</Text>
                </View>
            </View>
          </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.huge, // xl에서 huge로 증가
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  subText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.white,
    opacity: 0.8,
    marginTop: theme.spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginTop: -theme.spacing.lg, // xl에서 lg로 줄여서 여백 증가
    marginBottom: theme.spacing.xl, // lg에서 xl로 증가
  },
  actionCard: {
    width: (screenWidth - theme.spacing.lg * 2 - theme.spacing.base * 3) / 4,
    aspectRatio: 1,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  actionCardGradient: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  actionCardText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  lastSection: {
    marginBottom: theme.spacing.huge,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  sectionSubtitle: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  subtitleText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  horizontalScroll: {
    paddingLeft: theme.spacing.lg,
  },
  recipeCard: {
    width: 200,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.base,
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  recipeImageContainer: {
    position: 'relative',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 120,
  },
  recipeInfo: {
    padding: theme.spacing.md,
  },
  recipeTitle: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.medium,
  },
  recipeDescription: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.lineHeight.base * theme.typography.fontSize.small,
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  errorText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  retryText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

export default MainScreen; 