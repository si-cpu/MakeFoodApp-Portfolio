import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RecipeCategory } from '../../types/recipe';
import { theme } from '../../theme/theme';
import { recipeService } from '../../api/services/recipe';
import { useAuth } from '../../hooks/useAuth';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setIngredients } from '../../store/slices/ingredientSlice';
import { ingredientService } from '../../api/services/ingredient';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import Loading from '../../components/common/Loading';
import AIBadge from '../../components/common/AIBadge';
import AppImage from '../../components/common/AppImage';
import SearchBar from '../../components/common/SearchBar';

const SEARCH_MODES = [
  { key: 'title', label: '메뉴명', icon: 'restaurant' },
  { key: 'ingredient', label: '재료', icon: 'leaf' }
];

type SearchMode = 'ingredient' | 'title';

const RecipeScreen = ({ navigation }: any) => {
  const { token } = useAuth();
  const [searchMode, setSearchMode] = useState<SearchMode>('title');
  const [search, setSearch] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchResult, setIsSearchResult] = useState(false); // 검색 결과 상태인지 확인
  
  const dispatch = useAppDispatch();
  const ingredients = useAppSelector(state => state.ingredient.ingredients);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        console.log('토큰 없음, 로그인 필요');
        return;
      }

      // 재료 데이터 로드 (항상 시도)
        try {
          const ingRes = await ingredientService.getAllIngredients();
        const ingredientData = (ingRes.data || []).map(i => ({ 
            id: i.id, 
            name: i.name,
            unit: i.unit 
        }));
        console.log('재료 API 응답:', ingredientData.length, '개');
        dispatch(setIngredients(ingredientData));
        } catch (ingErr) {
          console.error('재료 로드 실패:', ingErr);
      }

      const recipesRes = await recipeService.getRecipes();
      setRecipes(recipesRes.data?.content || []);
      setIsSearchResult(false); // 초기 데이터 로드 시 검색 결과 상태 해제
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // 검색 실행
  const handleSearch = async (query?: string) => {
    try {
      setSearchLoading(true);
      const searchQuery = query !== undefined ? query : search;

      if (searchMode === 'title') {
        if (!searchQuery.trim()) {
          await loadInitialData();
          return;
        }
        const response = await recipeService.searchRecipes(searchQuery.trim());
        setRecipes(response.data?.content || []);
        setIsSearchResult(true);
      } else {
        if (selectedIngredients.length === 0) {
          return;
        }
        const response = await recipeService.filterRecipesByIngredients(selectedIngredients);
        setRecipes(response.data || []);
        setIsSearchResult(true);
      }
    } catch (error) {
      console.error('레시피 검색 실패:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // 다시 검색 (재료 선택 상태로 돌아가기)
  const handleResetSearch = () => {
    setIsSearchResult(false);
    // 재료 선택 상태는 유지하고 검색 결과만 초기화
  };

  // 재료 선택/해제
  const toggleIngredient = (id: number) => {
    setSelectedIngredients(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      return next;
    });
  };

  const clearIngredient = (id: number) => {
    setSelectedIngredients(prev => prev.filter(x => x !== id));
  };

  const clearAllIngredients = () => {
    setSelectedIngredients([]);
  };

  // 레시피 카드 렌더링
  const renderRecipe = ({ item, index }: { item: any; index: number }) => {
    const isEven = index % 2 === 0;
    
    return (
      <TouchableOpacity 
        style={[styles.recipeCard, isEven ? styles.recipeCardLeft : styles.recipeCardRight]}
        onPress={() => navigation?.navigate?.('RecipeDetail', { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.recipeImageContainer}>
          <AppImage
            source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/image-placeholder.png')}
            style={styles.recipeImage}
            rounded={false}
          />
        </View>
        
        <View style={styles.recipeContent}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title || item.name}
          </Text>
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {item.description || '맛있는 레시피입니다'}
          </Text>
          
        {/* 재료 표시 */}
          {item.ingredients && item.ingredients.length > 0 && (
            <View style={styles.ingredientsContainer}>
        <View style={styles.ingredientRow}>
                {item.ingredients.slice(0, 3).map((ing: any, idx: number) => (
                  <View key={ing.id || idx} style={styles.ingredientChip}>
                    <Text style={styles.ingredientText}>{ing.name}</Text>
                  </View>
                ))}
                {item.ingredients.length > 3 && (
                  <View style={styles.moreChip}>
                    <Text style={styles.moreText}>+{item.ingredients.length - 3}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* 레시피 정보 */}
          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <Ionicons name="time" size={14} color={theme.colors.textLight} />
              <Text style={styles.statText}>{item.cookingTime || 30}분</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people" size={14} color={theme.colors.textLight} />
              <Text style={styles.statText}>{item.servings || 2}인분</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 재료 필터 렌더링
  const renderIngredientFilter = () => {
    const filteredIngredients = ingredients.filter(i => 
      i.name.toLowerCase().includes(ingredientQuery.toLowerCase())
    );

    console.log('전체 재료 개수:', ingredients.length);
    console.log('필터된 재료 개수:', filteredIngredients.length);
    console.log('재료 샘플:', ingredients.slice(0, 3));

    return (
      <View style={styles.ingredientFilterContainer}>
        <SearchBar
          placeholder="재료명 검색..."
          value={ingredientQuery}
          onChangeText={setIngredientQuery}
          style={styles.ingredientSearchBar}
        />
        
        {/* 선택된 재료들 */}
        {selectedIngredients.length > 0 && (
          <View style={styles.selectedIngredientsContainer}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedTitle}>
                선택된 재료 ({selectedIngredients.length})
              </Text>
              <TouchableOpacity onPress={clearAllIngredients} style={styles.clearAllButton}>
                <Text style={styles.clearAllText}>전체 삭제</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.selectedChipsContainer}>
              {selectedIngredients.map(id => {
                const ingredient = ingredients.find(i => i.id === id);
                if (!ingredient) return null;
                
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.selectedChip}
                    onPress={() => clearIngredient(id)}
                  >
                    <Text style={styles.selectedChipText}>{ingredient.name}</Text>
                    <Ionicons name="close" size={16} color={theme.colors.white} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        
        {/* 재료 목록 */}
        <View style={styles.ingredientListContainer}>
          {filteredIngredients.length === 0 ? (
            <View style={styles.emptyIngredientsContainer}>
              <Text style={styles.emptyIngredientsText}>
                {ingredients.length === 0 
                  ? '재료 데이터를 불러오는 중...' 
                  : ingredientQuery 
                    ? '검색된 재료가 없습니다' 
                    : '재료가 없습니다'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredIngredients}
              keyExtractor={item => String(item.id)}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.ingredientGrid}
              style={styles.ingredientFlatList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.ingredientButton,
                    selectedIngredients.includes(item.id) && styles.ingredientButtonActive
                  ]}
                  onPress={() => toggleIngredient(item.id)}
                >
                  <Text style={[
                    styles.ingredientButtonText,
                    selectedIngredients.includes(item.id) && styles.ingredientButtonTextActive
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
        
        {/* 검색/다시검색 버튼 */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            !isSearchResult && selectedIngredients.length === 0 && styles.searchButtonDisabled
          ]}
          onPress={() => {
            if (isSearchResult) {
              handleResetSearch();
            } else {
              handleSearch();
            }
          }}
          disabled={!isSearchResult && selectedIngredients.length === 0 || searchLoading}
        >
          <LinearGradient
            colors={
              isSearchResult || selectedIngredients.length > 0 
                ? theme.colors.gradientPrimary 
                : ['#E0E0E0', '#BDBDBD'] as any
            }
            style={styles.searchButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {searchLoading ? (
              <LoadingIndicator/> 
            ) : (
              <>
                <Ionicons 
                  name={isSearchResult ? "refresh" : "search"} 
                  size={20} 
                  color={theme.colors.white} 
                />
                <Text style={styles.searchButtonText}>
                  {isSearchResult 
                    ? "다시 검색" 
                    : `레시피 검색 (${selectedIngredients.length})`
                  }
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>레시피</Text>
        <TouchableOpacity 
          style={styles.addButton}
        onPress={() => navigation?.navigate?.('MyRecipeEdit')}
        >
          <LinearGradient
            colors={theme.colors.gradientAccent as any}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={20} color={theme.colors.white} />
            <Text style={styles.addButtonText}>추가</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 검색 모드 탭 */}
      <View style={styles.searchModeTabs}>
        {SEARCH_MODES.map(mode => (
          <TouchableOpacity
            key={mode.key}
            style={[
              styles.searchModeTab,
              searchMode === mode.key && styles.searchModeTabActive
            ]}
            onPress={() => setSearchMode(mode.key as SearchMode)}
          >
            <Ionicons 
              name={mode.icon as any} 
              size={18} 
              color={searchMode === mode.key ? theme.colors.white : theme.colors.textLight} 
            />
            <Text style={[
              styles.searchModeText,
              searchMode === mode.key && styles.searchModeTextActive
            ]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 검색 영역 */}
      {searchMode === 'title' ? (
        <View style={styles.titleSearchContainer}>
          <SearchBar
            placeholder="메뉴명으로 검색..."
            value={search}
            onChangeText={setSearch}
            onSearch={handleSearch}
            loading={searchLoading}
          />
        </View>
      ) : (
        <>
          {/* 재료 모드에서 검색 결과가 아닐 때만 재료 필터 표시 */}
          {!isSearchResult && renderIngredientFilter()}
          
          {/* 재료 모드에서 검색 결과일 때 다시 검색 버튼 표시 */}
          {isSearchResult && (
            <View style={styles.resetSearchContainer}>
              <TouchableOpacity
                style={styles.resetSearchButton}
                onPress={handleResetSearch}
              >
                <Ionicons name="refresh" size={20} color={theme.colors.white} />
                <Text style={styles.resetSearchText}>다시 검색</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* 레시피 목록 */}
      {searchMode === 'ingredient' && !isSearchResult ? (
        // 재료 모드에서 검색 전에는 빈 화면 표시하지 않음
        null
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          {searchMode === 'ingredient' && selectedIngredients.length === 0 ? (
            <>
              <Ionicons name="leaf-outline" size={48} color={theme.colors.textLight} />
              <Text style={styles.emptyTitle}>재료를 선택해주세요</Text>
              <Text style={styles.emptyDescription}>
                원하는 재료를 선택하면 관련 레시피를 찾아드려요
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="search-outline" size={48} color={theme.colors.textLight} />
              <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
              <Text style={styles.emptyDescription}>
                다른 검색어를 시도해보세요
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={item => String(item.id)}
          renderItem={renderRecipe}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.recipeList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.extraBold,
    color: theme.colors.text,
  },
  addButton: {
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.base,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.xs,
  },
  addButtonText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  searchModeTabs: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xs,
  },
  searchModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  searchModeTabActive: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  searchModeText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
  },
  searchModeTextActive: {
    color: theme.colors.white,
  },

  resetSearchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  resetSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
    ...theme.shadows.base,
  },
  resetSearchText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  titleSearchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  ingredientFilterContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  ingredientSearchBar: {
    marginBottom: theme.spacing.md,
  },

  selectedIngredientsContainer: {
    marginBottom: theme.spacing.md,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  selectedTitle: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  clearAllButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  clearAllText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.error,
  },
  selectedChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  selectedChipText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
  },
  ingredientListContainer: {
    marginBottom: theme.spacing.md,
    minHeight: 120,
  },
  ingredientFlatList: {
    maxHeight: 250,
  },
  ingredientGrid: {
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  emptyIngredientsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIngredientsText: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.medium,
  },
  ingredientButton: {
    flex: 0.48,
    backgroundColor: theme.colors.surface,
    marginHorizontal: '1%',
    marginBottom: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: 36,
  },
  ingredientButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  ingredientButtonText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
  ingredientButtonTextActive: {
    color: theme.colors.white,
  },
  searchButton: {
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.base,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
  },
  searchButtonText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  recipeList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },
  recipeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.base,
    overflow: 'hidden',
  },
  recipeCardLeft: {
    marginRight: theme.spacing.sm,
    flex: 0.48,
  },
  recipeCardRight: {
    marginLeft: theme.spacing.sm,
    flex: 0.48,
  },
  recipeImageContainer: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 120,
  },
  recipeContent: {
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
  ingredientsContainer: {
    marginBottom: theme.spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  ingredientChip: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  ingredientText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  moreChip: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  moreText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.medium,
  },
});

export default RecipeScreen; 