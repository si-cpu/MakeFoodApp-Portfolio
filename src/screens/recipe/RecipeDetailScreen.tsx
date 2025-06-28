import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Animated,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { recipeService } from '../../api/services/recipe';
import { inventoryService } from '../../api/services/inventory';
import { cartService } from '../../api/services/cart';
import { RecipeDetailDto, IngredientDto } from '../../types/recipe';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import Loading from '../../components/common/Loading';
import AppImage from '../../components/common/AppImage';
import AIBadge from '../../components/common/AIBadge';
import Modal from '../../components/common/Modal';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store/hooks';
import { setIngredients } from '../../store/slices/ingredientSlice';
import { ingredientService } from '../../api/services/ingredient';
import { Ingredient } from '../../types/ingredient';

interface RouteParams {
  id: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const RecipeDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { id } = route.params as RouteParams;
  
  // Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // 상태 관리
  const [recipe, setRecipe] = useState<RecipeDetailDto | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [myRating, setMyRating] = useState(0); // 내가 매긴 평점
  const [averageRating, setAverageRating] = useState(0); // 평균 평점
  const [tempRating, setTempRating] = useState(0); // 임시 평점 (모달에서 사용)
  const [missingIngredients, setMissingIngredients] = useState<IngredientDto[]>([]);
  const [consumable, setConsumable] = useState<IngredientDto[]>([]);
  
  // Modal 상태
  const [showCartModal, setShowCartModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(false); // 모든 단계 표시 상태
  const [consumingIngredients, setConsumingIngredients] = useState(false); // 재료 소비 중 상태
  
  const reduxIngredients = useSelector((state: any) => (state.ingredient?.ingredients as Ingredient[]) || []);
  const dispatch = useAppDispatch();

  // 헤더 애니메이션
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [50, 0, -50],
    extrapolate: 'clamp',
  });

  // 재료 데이터 로드
  const loadIngredientsData = async () => {
    try {
      const response = await ingredientService.getAllIngredients();
      dispatch(setIngredients(response.data.map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
      }))));
    } catch (error) {
      console.error('재료 데이터 로드 실패:', error);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadRecipeData();
    loadInventoryData();
    loadRatingData();
    loadBookmarkStatus();
    
    if (reduxIngredients.length === 0) {
      loadIngredientsData();
    }
  }, [id]);

  useEffect(() => {
    if (reduxIngredients.length === 0) {
      loadIngredientsData();
    }
  }, [reduxIngredients]);

  // 레시피 데이터 로드
  const loadRecipeData = async () => {
    try {
      setLoading(true);
      const response = await recipeService.getRecipeById(id);
      setRecipe(response.data);
      
      try {
        await recipeService.addToRecentViewed(id);
      } catch (viewError) {
        console.warn('조회 기록 실패:', viewError);
      }
    } catch (error) {
      console.error('레시피 로드 실패:', error);
      Alert.alert('오류', '레시피를 불러오는 중 오류가 발생했습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 인벤토리 데이터 로드
  const loadInventoryData = async () => {
    try {
      const response = await inventoryService.getInventory();
      setInventory(response.data?.items || []);
    } catch (error) {
      console.error('인벤토리 로드 실패:', error);
    }
  };

  // 평점 데이터 로드
  const loadRatingData = async () => {
    try {
      const [myScoreResponse, averageResponse] = await Promise.all([
        recipeService.getMyScore(id).catch(() => ({ data: 0 })), // 내가 매긴 평점이 없으면 0
        recipeService.getScoreAverage(id).catch(() => ({ data: 0 })) // 평균 평점이 없으면 0
      ]);
      
      setMyRating(myScoreResponse.data);
      setAverageRating(averageResponse.data);
      setTempRating(myScoreResponse.data); // 모달 초기값 설정
    } catch (error) {
      console.error('평점 데이터 로드 실패:', error);
    }
  };

  // 북마크 상태 로드
  const loadBookmarkStatus = async () => {
    try {
      const isSaved = await recipeService.checkIfSaved(id);
      setBookmarked(isSaved);
    } catch (error) {
      console.error('북마크 상태 로드 실패:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRecipeData(), loadInventoryData(), loadRatingData(), loadBookmarkStatus()]);
    setRefreshing(false);
  };

  // 북마크 토글
  const handleBookmark = async () => {
    if (!recipe) return;
    
    try {
      const previousState = bookmarked;
      
      // 낙관적 업데이트 (UI 즉시 반영)
      setBookmarked(!previousState);
      
      if (previousState) {
        await recipeService.unsaveRecipe(recipe.id);
      } else {
        await recipeService.saveRecipe(recipe.id);
      }
    } catch (error) {
      console.error('북마크 토글 실패:', error);
      // 실패 시 원래 상태로 복원
      setBookmarked(bookmarked);
      Alert.alert('오류', '북마크 처리 중 오류가 발생했습니다.');
    }
  };

  // 부족 재료를 장바구니에 일괄 추가
  const handleAddToCart = async () => {
    try {
      const items = missingIngredients.map((ingredient) => ({
        ingredient: {
          ingredientId: ingredient.ingredientId ?? 0,
          ingredientName: ingredient.ingredientName ?? '알 수 없음',
          amount: ingredient.amount ?? 1,
          unit: ingredient.unit ?? '개',
        },
        quantity: Math.ceil(ingredient.amount ?? 1),
        unit: ingredient.unit ?? '개',
        purchased: false,
      }));

      await cartService.addToCartBatch(items);
      setShowCartModal(false);
      Alert.alert('완료', '부족한 재료가 장바구니에 추가되었습니다.');
    } catch (error) {
      console.error('장바구니 일괄 추가 실패:', error);
      Alert.alert('오류', '장바구니 추가 중 오류가 발생했습니다.');
    }
  };

  // 레시피·인벤토리 변경 시 부족 재료 계산
  useEffect(() => {
    if (!recipe) return;

    const getTotalQuantity = (targetName: string) =>
      inventory
        .filter(item => item.ingredient?.name?.toLowerCase()?.includes(targetName) || false)
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

    const missing = recipe.ingredients.filter(ing => {
      const name = ing.ingredientName.toLowerCase();
      const totalQty = getTotalQuantity(name);
      return totalQty < ing.amount;
    });

        setMissingIngredients(missing);
  }, [recipe, inventory]);

  // 요리 시작하기 - 재료 사용 확인
  const handleStartCooking = () => {
    if (!recipe) return;

    const getTotalQuantity = (targetName: string) =>
      inventory
        .filter(item => item.ingredient?.name?.toLowerCase()?.includes(targetName) || false)
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

    const available = recipe.ingredients.filter(ing => {
      const totalQty = getTotalQuantity(ing.ingredientName.toLowerCase());
      return totalQty >= ing.amount;
    });

    const missing = recipe.ingredients.filter(ing => {
      const totalQty = getTotalQuantity(ing.ingredientName.toLowerCase());
      return totalQty < ing.amount;
    });

    // 모든 재료가 충분한 경우 - 바로 요리 시작
    if (missing.length === 0) {
      if (available.length > 0) {
        // 사용할 재료가 있으면 모달 표시
        setConsumable(available);
        setShowConsumeModal(true);
      } else {
        // 사용할 재료가 없으면 바로 요리 시작
        navigation.navigate('CookingSteps', { steps: recipe.steps, recipeId: recipe.id });
      }
      return;
    }

    // 부족하거나 없는 재료가 있는 경우 - 확인 알림
    const missingNames = missing.map(ing => `${ing.ingredientName} (${ing.amount}${ing.unit})`).join(', ');
    
    Alert.alert(
      '재료 부족',
      `다음 재료가 부족하거나 없습니다:\n${missingNames}\n\n그래도 계속 진행하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '계속 진행',
          onPress: () => {
            if (available.length > 0) {
              // 사용할 수 있는 재료가 있으면 모달 표시
              setConsumable(available);
              setShowConsumeModal(true);
            } else {
              // 사용할 수 있는 재료가 없으면 바로 요리 시작
              navigation.navigate('CookingSteps', { steps: recipe.steps, recipeId: recipe.id });
            }
          }
        }
      ]
    );
  };

  const startCooking = async () => {
    if (!recipe) return;
    
    try {
      setConsumingIngredients(true);
      
      // 사용할 재료가 있으면 인벤토리에서 차감
      if (consumable.length > 0) {
        const consumeRequests = consumable.map(ingredient => ({
          ingredient: {
            id: ingredient.ingredientId ?? 0,
            name: ingredient.ingredientName,
            unit: ingredient.unit ?? '개'
          },
          quantity: ingredient.amount,
          purchaseDate: new Date().toISOString().slice(0, 10),
          expiryDate: new Date().toISOString().slice(0, 10),
          price: 0
        }));

        await inventoryService.consumeItemsBatch(consumeRequests);
        
        // 인벤토리 데이터 다시 로드
        await loadInventoryData();
      }
      
      setShowConsumeModal(false);
      setConsumingIngredients(false);
      navigation.navigate('CookingSteps', { 
        steps: recipe.steps,
        recipeId: recipe.id
      });
    } catch (error) {
      console.error('재료 소비 처리 실패:', error);
      setConsumingIngredients(false);
      Alert.alert('오류', '재료 사용 처리 중 오류가 발생했습니다. 그래도 요리를 시작하시겠습니까?', [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '계속 진행',
          onPress: () => {
            setShowConsumeModal(false);
            navigation.navigate('CookingSteps', { 
              steps: recipe.steps,
              recipeId: recipe.id
            });
          }
        }
      ]);
    }
  };

  // 평점 제출
  const handleRating = async () => {
    if (tempRating === 0) {
      Alert.alert('알림', '평점을 선택해주세요.');
      return;
    }

    try {
      // 평점 등록과 요리 완료 기록을 동시에 처리
      await Promise.all([
        recipeService.addScore({
          recipeId: id,
          rating: tempRating
        }),
        recipeService.recordCook(id)
      ]);
      
      setMyRating(tempRating);
      setShowRatingModal(false);
      
      // 평균 평점 다시 로드
      const averageResponse = await recipeService.getScoreAverage(id);
      setAverageRating(averageResponse.data);
      
      Alert.alert('완료', '평점이 등록되었습니다.');
    } catch (error) {
      console.error('평점 등록 실패:', error);
      Alert.alert('오류', '평점 등록 중 오류가 발생했습니다.');
    }
  };

  // 별점 렌더링 (5개 별, 1~10점 스케일)
  const renderStars = (rating: number, onPress?: (value: number) => void, interactive: boolean = false) => {
    // rating은 1~10 점수, 표시는 5개 별로 (rating / 2 = 별 개수)
    const starRating = rating / 2; // 1~5점 범위로 변환
    const fullStars = Math.floor(starRating);
    const hasHalfStar = starRating % 1 !== 0;

    if (interactive && onPress) {
      // 인터랙티브 모드 (평점 주기) - 각 별을 클릭하여 1~10점 선택
      return (
        <View style={styles.starsContainer}>
          {Array.from({ length: 5 }, (_, starIndex) => {
            const halfValue = (starIndex + 1) * 2 - 1; // 1, 3, 5, 7, 9 (반별)
            const fullValue = (starIndex + 1) * 2;     // 2, 4, 6, 8, 10 (완전별)
            
            return (
              <View key={starIndex} style={styles.starContainer}>
                <TouchableOpacity
                  onPress={() => {
                    // 현재 별이 이미 완전히 선택되어 있으면 반별로, 아니면 완전별로
                    if (rating >= fullValue) {
                      onPress(halfValue);
                    } else {
                      onPress(fullValue);
                    }
                  }}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={
                      rating >= fullValue 
                        ? "star" 
                        : rating >= halfValue 
                          ? "star-half" 
                          : "star-outline"
                    }
                    size={32}
                    color={
                      rating >= halfValue 
                        ? theme.colors.accent 
                        : theme.colors.textLight
                    }
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      );
    } else {
      // 표시 전용 모드 - 5개 별로 표시
      return (
        <View style={styles.starsContainer}>
          {Array.from({ length: 5 }, (_, index) => {
            let iconName = "star-outline";
            if (index < fullStars) {
              iconName = "star";
            } else if (index === fullStars && hasHalfStar) {
              iconName = "star-half";
            }
            
            return (
              <Ionicons
                key={index}
                name={iconName as any}
                size={16}
                color={theme.colors.accent}
              />
            );
          })}
        </View>
      );
    }
  };

  // 재료 상태 체크
  const getIngredientStatus = (ingredient: IngredientDto) => {
    const inventoryItems = inventory.filter(item => 
      item.ingredient?.name?.toLowerCase()?.includes(ingredient.ingredientName.toLowerCase())
    );
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    if (totalQuantity >= ingredient.amount) {
      return { status: 'available', color: theme.colors.success };
    } else if (totalQuantity > 0) {
      return { status: 'partial', color: theme.colors.warning };
    } else {
      return { status: 'missing', color: theme.colors.error };
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorTitle}>레시피를 찾을 수 없습니다</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 헤더 */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={styles.headerGradient}
        >
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleBookmark}>
            <Ionicons 
              name={bookmarked ? "heart" : "heart-outline"} 
              size={24} 
              color={bookmarked ? theme.colors.primary : theme.colors.white} 
            />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* 이미지 헤더 */}
        <View style={styles.imageHeader}>
          <Animated.View 
            style={[
              styles.imageContainer,
              {
                transform: [
                  { scale: imageScale },
                  { translateY: imageTranslateY }
                ]
              }
            ]}
          >
            <AppImage
              source={recipe.imageUrl ? { uri: recipe.imageUrl } : require('../../assets/image-placeholder.png')}
              style={styles.recipeImage}
              rounded={false}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
          </Animated.View>
          
          {/* 플로팅 액션 버튼들 */}
          <View style={styles.floatingActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
              <Ionicons 
                name={bookmarked ? "heart" : "heart-outline"} 
                size={24} 
                color={bookmarked ? theme.colors.primary : theme.colors.white} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 레시피 정보 카드 */}
        <View style={styles.contentContainer}>
          <View style={styles.recipeInfoCard}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
            
            {/* 레시피 스탯 */}
            <View style={styles.recipeStats}>
              <View style={styles.statItem}>
                <Ionicons name="time" size={20} color={theme.colors.primary} />
                <Text style={styles.statText}>{recipe.cookingTime || 30}분</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={20} color={theme.colors.accent} />
                <Text style={styles.statText}>
                  {averageRating > 0 ? `${averageRating.toFixed(1)}점` : '평점 없음'}
                </Text>
              </View>
              {myRating > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={20} color={theme.colors.error} />
                  <Text style={styles.statText}>내 평점: {myRating}점</Text>
                </View>
              )}
            </View>
          </View>

          {/* 재료 카드 */}
          <View style={styles.ingredientsCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="leaf" size={20} color={theme.colors.secondary} />
                <Text style={styles.cardTitle}>재료 ({recipe.ingredients.length}개)</Text>
              </View>
              {missingIngredients.length > 0 && (
                <TouchableOpacity 
                  style={styles.cartButton}
                  onPress={() => setShowCartModal(true)}
                >
                  <Ionicons name="cart" size={16} color={theme.colors.white} />
                  <Text style={styles.cartButtonText}>담기</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => {
                const status = getIngredientStatus(ingredient);
                return (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.ingredientInfo}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={styles.ingredientName}>{ingredient.ingredientName}</Text>
                    </View>
                    <Text style={styles.ingredientAmount}>
                      {ingredient.amount} {ingredient.unit}
                    </Text>
                  </View>
                );
              })}
            </View>
            
            {/* 재료 상태 설명 */}
            <View style={styles.statusLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.legendText}>충분</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
                <Text style={styles.legendText}>부족</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
                <Text style={styles.legendText}>없음</Text>
              </View>
            </View>
          </View>

          {/* 요리 방법 카드 */}
          {recipe.steps && recipe.steps.length > 0 && (
            <View style={styles.stepsCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="list" size={20} color={theme.colors.accent} />
                  <Text style={styles.cardTitle}>요리 방법 ({recipe.steps.length}단계)</Text>
                </View>
              </View>
              
              <View style={styles.stepsList}>
                {(showAllSteps ? recipe.steps : recipe.steps.slice(0, 3)).map((step, index) => (
                  <View key={index} style={styles.stepPreview}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText} numberOfLines={showAllSteps ? undefined : 2}>
                      {step.description}
                    </Text>
                  </View>
                ))}
                {recipe.steps.length > 3 && (
                  <TouchableOpacity 
                    style={styles.moreStepsButton}
                    onPress={() => setShowAllSteps(!showAllSteps)}
                  >
                    <Text style={styles.moreStepsText}>
                      {showAllSteps 
                        ? '접기' 
                        : `+${recipe.steps.length - 3}개 단계 더보기`
                      }
                    </Text>
                    <Ionicons 
                      name={showAllSteps ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={theme.colors.primary} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* 액션 버튼들 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.primaryButton, styles.cookButton]}
              onPress={handleStartCooking}
            >
              <LinearGradient
                colors={theme.colors.gradientPrimary as any}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="play" size={20} color={theme.colors.white} />
                <Text style={styles.buttonText}>요리 시작하기</Text>
              </LinearGradient>
            </TouchableOpacity>
            

          </View>
        </View>
      </ScrollView>

      {/* 장바구니 모달 */}
      <Modal
        visible={showCartModal}
        onClose={() => setShowCartModal(false)}
        title="부족한 재료"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            다음 재료들이 부족합니다. 장바구니에 추가하시겠습니까?
          </Text>
          <View style={styles.missingIngredientsList}>
            {missingIngredients.map((ingredient, index) => (
              <View key={index} style={styles.missingIngredientItem}>
                <Text style={styles.missingIngredientName}>{ingredient.ingredientName}</Text>
                <Text style={styles.missingIngredientAmount}>
                  {ingredient.amount} {ingredient.unit}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowCartModal(false)}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalConfirmButton}
              onPress={handleAddToCart}
            >
              <Text style={styles.modalConfirmText}>장바구니에 추가</Text>
            </TouchableOpacity>
          </View>
        </View>
              </Modal>

        {/* 재료 소비 모달 */}
        <Modal
          visible={showConsumeModal}
          onClose={() => setShowConsumeModal(false)}
          title="재료 사용"
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              다음 재료들을 인벤토리에서 사용하시겠습니까?
            </Text>
            <View style={styles.consumableList}>
              {consumable.map((ingredient, index) => (
                <View key={index} style={styles.consumableItem}>
                  <Text style={styles.consumableIngredientName}>{ingredient.ingredientName}</Text>
                  <Text style={styles.consumableIngredientAmount}>
                    {ingredient.amount} {ingredient.unit}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowConsumeModal(false)}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
                          <TouchableOpacity 
              style={[styles.modalConfirmButton, consumingIngredients && styles.modalConfirmButtonDisabled]}
              onPress={startCooking}
              disabled={consumingIngredients}
            >
              {consumingIngredients ? (
                <LoadingIndicator />
              ) : (
                <Text style={styles.modalConfirmText}>요리 시작</Text>
              )}
            </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 평점 모달 */}
      <Modal
        visible={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setTempRating(myRating); // 모달 닫을 때 원래 평점으로 복원
        }}
        title="레시피 평점"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            이 레시피는 어떠셨나요?
          </Text>
          <Text style={styles.ratingLabel}>
            {tempRating > 0 ? `${tempRating}점` : '평점을 선택해주세요 (1~10점)'}
          </Text>
          <View style={styles.ratingStars}>
            {renderStars(tempRating, setTempRating, true)}
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => {
                setShowRatingModal(false);
                setTempRating(myRating);
              }}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalConfirmButton}
              onPress={handleRating}
            >
              <Text style={styles.modalConfirmText}>저장하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
  },
  headerGradient: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  imageHeader: {
    position: 'relative',
    height: 300,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  floatingActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.base,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    marginTop: -30,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },
  recipeInfoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.base,
  },
  recipeTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.extraBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.xxl,
  },
  recipeDescription: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.medium,
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  ingredientsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  cartButtonText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
  },
  ingredientsList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  ingredientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
  },
  ingredientName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  ingredientAmount: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  statusLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
  },
  legendText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
  },
  stepsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.base,
  },
  stepsList: {
    gap: theme.spacing.md,
  },
  stepPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeight.base * theme.typography.fontSize.medium,
  },
  moreStepsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.xs,
  },
  moreStepsText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  actionButtons: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
  },
  cookButton: {
    marginBottom: theme.spacing.sm,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  modalDescription: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.medium,
  },
  missingIngredientsList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  missingIngredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  missingIngredientName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  missingIngredientAmount: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.error,
  },
  consumableList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  consumableItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  consumableIngredientName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  consumableIngredientAmount: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.success,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: theme.colors.textLight,
  },
  modalConfirmText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  ratingLabel: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    alignSelf: 'center',
  },
  starButton: {
    padding: theme.spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  starContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecipeDetailScreen; 