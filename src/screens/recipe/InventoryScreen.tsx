import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
  ScrollView,
  Dimensions,
  TextInput,
  Modal as RNModal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { inventoryService } from '../../api/services/inventory';
import { purchaseService } from '../../api/services/purchase';
import { ingredientService } from '../../api/services/ingredient';
import { useSelector, useDispatch } from 'react-redux';
import { setIngredients as setReduxIngredients } from '../../store/slices/ingredientSlice';
import { Ingredient } from '../../types/ingredient';
import { useFocusEffect } from '@react-navigation/native';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import Input from '../../components/common/Input';

const { width: screenWidth } = Dimensions.get('window');

function getDefaultExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

const InventoryScreen = () => {
  const dispatch = useDispatch();
  const reduxIngredients = useSelector((state: any) => (state.ingredient?.ingredients as Ingredient[]) || []);

  // 기본 상태
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'fresh' | 'expiring' | 'expired'>('all');
  
  // 선택 관련
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  
  // 추가/수정 폼 데이터
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: '개',
    expiryDate: getDefaultExpiry(),
    price: '0'
  });
  
  // 재료 선택 관련
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // showIngredientPicker 상태 변화 감지
  useEffect(() => {
    console.log('showIngredientPicker 상태 변경:', showIngredientPicker);
  }, [showIngredientPicker]);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [consumeQuantities, setConsumeQuantities] = useState<Record<string, string>>({});
  const [allIngredients, setAllIngredients] = useState(reduxIngredients);

  // 인벤토리 로드
  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventory();
      setInventory(response.data?.items || []);
    } catch (error) {
      console.error('인벤토리 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 재료 로드
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        if (reduxIngredients.length === 0) {
          const res = await ingredientService.getAllIngredients();
          const list = (res.data || []).map(i => ({ id: i.id, name: i.name, unit: i.unit }));
          dispatch(setReduxIngredients(list));
          setAllIngredients(list);
        } else {
          setAllIngredients(reduxIngredients);
        }
      } catch (err) {
        console.error('재료 불러오기 실패', err);
      }
    };
    loadIngredients();
    loadInventory();
  }, [loadInventory]);

  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, [loadInventory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  };

  // 필터링된 인벤토리
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (selectedFilter === 'all') return true;
    
    const today = new Date();
    const expiryDate = new Date(item.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (selectedFilter) {
      case 'fresh':
        return daysUntilExpiry > 3;
      case 'expiring':
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
      case 'expired':
        return daysUntilExpiry < 0;
      default:
        return true;
    }
  });

  // 유통기한 상태 계산
  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: theme.colors.error, text: '만료됨', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 3) {
      return { status: 'expiring', color: theme.colors.warning, text: '임박', days: daysUntilExpiry };
    } else {
      return { status: 'fresh', color: theme.colors.success, text: '신선', days: daysUntilExpiry };
    }
  };

  // 아이템 선택/해제
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredInventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredInventory.map(item => String(item.id)));
    }
  };

  // 선택 모드 토글
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedItems([]);
  };

  // 재료 선택 핸들러
  const handleIngredientSelect = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setFormData(prev => ({
      ...prev,
      name: ingredient.name,
      unit: ingredient.unit || '개'
    }));
    setShowIngredientPicker(false);
    setIngredientSearchQuery('');
  };

  // 재료 추가
  const handleAddItem = async () => {
    if (!selectedIngredient || !formData.quantity || isNaN(Number(formData.quantity))) {
      Alert.alert('입력 오류', '재료를 선택하고 올바른 수량을 입력해주세요.');
      return;
    }
    
    try {
      // 장바구니와 동일한 방식으로 inventoryService.addItemsBatch 직접 사용
      const inventoryItem = {
        ingredient: {
          id: Number(selectedIngredient.id),
          name: selectedIngredient.name,
          unit: selectedIngredient.unit || formData.unit,
        },
        quantity: Number(formData.quantity),
        purchaseDate: new Date().toISOString().slice(0, 10),
        expiryDate: formData.expiryDate,
        price: Number(formData.price),
      };
      
      await inventoryService.addItemsBatch([inventoryItem]);
      
      await loadInventory();
      setShowAddModal(false);
      resetForm();
      Alert.alert('완료', '재료가 추가되었습니다.');
    } catch (error) {
      console.error('재료 추가 실패:', error);
      Alert.alert('오류', '재료 추가 중 오류가 발생했습니다.');
    }
  };

  // 재료 수정
  const handleEditItem = async () => {
    if (!editingItem || !formData.name.trim() || !formData.quantity) {
      Alert.alert('입력 오류', '올바른 값을 입력해주세요.');
      return;
    }
    
    try {
      const matchIng = allIngredients.find(ing => ing.name === formData.name.trim());
      
      await inventoryService.updateItem({
        id: Number(editingItem.id),
        ingredient: {
          id: matchIng ? Number(matchIng.id) : Number(editingItem.ingredient.id),
          name: formData.name.trim(),
          unit: formData.unit,
        },
        quantity: Number(formData.quantity),
        purchaseDate: (editingItem.purchaseDate || new Date().toISOString()).slice(0,10),
        expiryDate: formData.expiryDate,
        price: Number(formData.price),
      });
      
      await loadInventory();
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      Alert.alert('완료', '재료가 수정되었습니다.');
    } catch (error) {
      console.error('재료 수정 실패:', error);
      Alert.alert('오류', '재료 수정 중 오류가 발생했습니다.');
    }
  };

  // 선택 아이템 삭제
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    
    Alert.alert(
      '삭제 확인',
      `선택한 ${selectedItems.length}개 항목을 삭제하시겠습니까?`,
      [
      { text: '취소', style: 'cancel' },
      {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const targets = inventory.filter(item => selectedItems.includes(String(item.id)));
            const requests = targets.map(item => {
                const matchIng = allIngredients.find(ing => ing.name.toLowerCase() === item.ingredient.name.toLowerCase());
              return {
                ingredient: {
                  id: matchIng ? Number(matchIng.id) : 0,
                  name: item.ingredient.name,
                  unit: item.ingredient.unit,
                },
                quantity: item.quantity,
                purchaseDate: (item.purchaseDate || new Date().toISOString()).slice(0, 10),
                expiryDate: item.expiryDate || getDefaultExpiry(),
                  price: 0,
              };
            });

            await inventoryService.deleteItems(requests);
            await loadInventory();
              setSelectedItems([]);
              setSelectionMode(false);
              Alert.alert('완료', '선택한 항목이 삭제되었습니다.');
          } catch (error) {
              console.error('삭제 실패:', error);
            Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
          }
        }
      }
      ]
    );
  };

  // 선택 아이템 소비
  const handleConsumeSelected = () => {
    if (selectedItems.length === 0) return;
    
    const targets = inventory.filter(item => selectedItems.includes(String(item.id)));
    const initialQuantities: Record<string, string> = {};
    targets.forEach(item => {
      initialQuantities[String(item.id)] = String(item.quantity);
    });
    
    setConsumeQuantities(initialQuantities);
    setShowConsumeModal(true);
  };

  // 소비 확정
  const handleConfirmConsume = async () => {
    try {
      const targets = inventory.filter(item => selectedItems.includes(String(item.id)));
      
      for (const item of targets) {
        const qty = Number(consumeQuantities[String(item.id)]);
        if (isNaN(qty) || qty < 1 || qty > item.quantity) {
          Alert.alert('입력 오류', `${item.ingredient.name}의 사용 수량을 확인해주세요.`);
          return;
        }
      }

      const requests = targets.map(item => {
        const qty = Number(consumeQuantities[String(item.id)]);
        const matchIng = allIngredients.find(i => i.name.toLowerCase() === item.ingredient.name.toLowerCase());
        return {
          ingredient: {
            id: matchIng ? Number(matchIng.id) : 0,
            name: item.ingredient.name,
            unit: item.ingredient.unit,
          },
          quantity: qty,
          purchaseDate: (item.purchaseDate || new Date().toISOString()).slice(0,10),
          expiryDate: item.expiryDate || getDefaultExpiry(),
          price: 0,
        };
      });

      await inventoryService.consumeItemsBatch(requests);
      await loadInventory();
      setSelectedItems([]);
      setSelectionMode(false);
      setShowConsumeModal(false);
      Alert.alert('완료', '선택한 재료를 사용 처리했습니다.');
    } catch (error) {
      console.error('소비 처리 실패:', error);
      Alert.alert('오류', '사용 처리 중 오류가 발생했습니다.');
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '1',
      unit: '개',
      expiryDate: getDefaultExpiry(),
      price: '0'
    });
    setSelectedIngredient(null);
    setIngredientSearchQuery('');
    setShowIngredientPicker(false);
    setShowDatePicker(false);
  };

  // 수정 모달 열기
  const openEditModal = (item: any) => {
    const matchingIngredient = allIngredients.find(ing => 
      ing.name.toLowerCase() === item.ingredient.name.toLowerCase()
    );
    
    setEditingItem(item);
    setSelectedIngredient(matchingIngredient || {
      id: item.ingredient.id,
      name: item.ingredient.name,
      unit: item.ingredient.unit
    });
    setFormData({
      name: item.ingredient.name,
      quantity: String(item.quantity),
      unit: item.ingredient.unit,
      expiryDate: item.expiryDate || getDefaultExpiry(),
      price: '0'
    });
    setShowEditModal(true);
  };

  // 필터 버튼 렌더링
  const renderFilterButton = (filter: typeof selectedFilter, label: string, count: number) => (
    <TouchableOpacity
      style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
        {label}
      </Text>
      <View style={[styles.filterBadge, selectedFilter === filter && styles.filterBadgeActive]}>
        <Text style={[styles.filterBadgeText, selectedFilter === filter && styles.filterBadgeTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 인벤토리 아이템 렌더링
  const renderInventoryItem = ({ item, index }: { item: any; index: number }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate);
    const isSelected = selectedItems.includes(String(item.id));
    const isEven = index % 2 === 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.inventoryCard,
          isEven ? styles.inventoryCardLeft : styles.inventoryCardRight,
          isSelected && styles.inventoryCardSelected
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleItemSelection(String(item.id));
          } else {
            openEditModal(item);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleItemSelection(String(item.id));
          }
        }}
        activeOpacity={0.8}
      >
        {/* 선택 체크박스 */}
        {selectionMode && (
          <View style={styles.selectionCheckbox}>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={isSelected ? theme.colors.primary : theme.colors.textLight}
            />
          </View>
        )}
        
        {/* 유통기한 상태 배지 */}
        <View style={[styles.statusBadge, { backgroundColor: expiryStatus.color }]}>
          <Text style={styles.statusBadgeText}>{expiryStatus.text}</Text>
        </View>
        
        {/* 재료 정보 */}
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.ingredient.name}
          </Text>
          
          <View style={styles.quantityContainer}>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Text style={styles.unit}>{item.ingredient.unit}</Text>
          </View>
          
          <View style={styles.expiryContainer}>
            <Ionicons name="calendar-outline" size={12} color={expiryStatus.color} />
            <Text style={[styles.expiryText, { color: expiryStatus.color }]}>
              {expiryStatus.status === 'expired' 
                ? `${expiryStatus.days}일 전 만료`
                : `${expiryStatus.days}일 남음`
              }
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loading />;
  }

  // 필터별 개수 계산
  const filterCounts = {
    all: inventory.length,
    fresh: inventory.filter(item => getExpiryStatus(item.expiryDate).status === 'fresh').length,
    expiring: inventory.filter(item => getExpiryStatus(item.expiryDate).status === 'expiring').length,
    expired: inventory.filter(item => getExpiryStatus(item.expiryDate).status === 'expired').length,
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>내 재고</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{inventory.length}</Text>
            </View>
      </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.headerButton, selectionMode && styles.headerButtonActive]}
              onPress={toggleSelectionMode}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={selectionMode ? "close" : "checkmark-done"} 
                size={20} 
                color={selectionMode ? theme.colors.white : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 검색바 */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="재료 이름으로 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 필터 탭 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
          style={styles.filterScrollView}
        >
          {renderFilterButton('all', '전체', filterCounts.all)}
          {renderFilterButton('fresh', '신선', filterCounts.fresh)}
          {renderFilterButton('expiring', '임박', filterCounts.expiring)}
          {renderFilterButton('expired', '만료', filterCounts.expired)}
        </ScrollView>

        {/* 선택 모드 액션 바 */}
        {selectionMode && selectedItems.length > 0 && (
          <View style={styles.selectionActionBar}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={toggleSelectAll}
              activeOpacity={0.7}
            >
              <Text style={styles.selectAllText}>
                {selectedItems.length === filteredInventory.length ? '전체 해제' : '전체 선택'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.consumeButton]}
            onPress={handleConsumeSelected}
                disabled={selectedItems.length === 0}
                activeOpacity={0.8}
              >
                <Ionicons name="restaurant" size={16} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>사용</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteSelected}
                disabled={selectedItems.length === 0}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={16} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
        </View>
      )}

        {/* 인벤토리 목록 */}
        <View style={styles.content}>
          {filteredInventory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="cube-outline" size={64} color={theme.colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery 
                  ? '검색 결과가 없어요' 
                  : selectedFilter === 'expiring'
                    ? '임박한 재료가 없습니다'
                    : selectedFilter === 'expired'
                      ? '만료된 재료가 없습니다'
                      : selectedFilter === 'fresh'
                        ? '신선한 재료가 없습니다'
                        : '재고가 비어있어요'
                }
              </Text>
              <Text style={styles.emptyDescription}>
                {searchQuery 
                  ? '다른 검색어를 시도해보세요'
                  : selectedFilter === 'expiring'
                    ? '유통기한이 임박한 재료가 없어 안전합니다'
                    : selectedFilter === 'expired'
                      ? '만료된 재료가 없어 깨끗한 상태입니다'
                      : selectedFilter === 'fresh'
                        ? '신선한 재료를 추가해보세요'
                        : '새로운 재료를 추가해보세요'
                }
              </Text>
              {!searchQuery && selectedFilter === 'all' && (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryLight]}
                    style={styles.emptyActionGradient}
                  >
                    <Ionicons name="add" size={20} color={theme.colors.white} />
                    <Text style={styles.emptyActionText}>재료 추가하기</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
        </View>
      ) : (
        <FlatList
              data={filteredInventory}
          keyExtractor={item => String(item.id)}
              renderItem={renderInventoryItem}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.inventoryList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
              </View>

        {/* FAB */}
        {!selectionMode && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryLight]}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={24} color={theme.colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* 재료 추가 모달 */}
        <Modal
          visible={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          title="새 재료 추가"
        >
          <View style={styles.modernModalContent}>
            {/* 컴팩트 헤더 */}
            <View style={styles.compactHeader}>
              <Ionicons name="basket" size={20} color={theme.colors.primary} />
              <Text style={styles.compactTitle}>새 재료 추가</Text>
            </View>

            {/* 재료 선택 섹션 */}
            <View style={styles.compactSection}>
              <Text style={styles.compactLabel}>
                <Ionicons name="restaurant" size={14} color={theme.colors.primary} /> 재료 선택
              </Text>
              
              {/* 선택된 재료 표시 또는 검색바 */}
              {selectedIngredient ? (
                <View style={styles.selectedIngredientContainer}>
                  <View style={styles.selectedIngredientInfo}>
                    <View style={styles.selectedIngredientIcon}>
                      <Ionicons name="restaurant" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={styles.selectedIngredientText}>
                      <Text style={styles.selectedIngredientName}>{selectedIngredient.name}</Text>
                      <Text style={styles.selectedIngredientUnit}>단위: {selectedIngredient.unit}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.changeIngredientButton}
                    onPress={() => {
                      setSelectedIngredient(null);
                      setIngredientSearchQuery('');
                    }}
                  >
                    <Text style={styles.changeIngredientText}>변경</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ingredientSearchSection}>
                  <Input
                    placeholder="재료명을 검색하세요"
                    value={ingredientSearchQuery}
                    onChangeText={setIngredientSearchQuery}
                    style={styles.compactInput}
                  />
                  
                  {/* 재료 목록 (검색어가 있을 때만 표시) */}
                  {ingredientSearchQuery.length > 0 && (
                    <View style={styles.ingredientListContainer}>
                      <FlatList
                        data={allIngredients.filter(ingredient =>
                          ingredient.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase())
                        ).slice(0, 5)} // 최대 5개만 표시
                        keyExtractor={item => String(item.id)}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.ingredientListItem}
                            onPress={() => {
                              setSelectedIngredient(item);
                              setFormData(prev => ({
                                ...prev,
                                name: item.name,
                                unit: item.unit || '개'
                              }));
                              setIngredientSearchQuery('');
                            }}
                          >
                            <View style={styles.ingredientListItemIcon}>
                              <Ionicons name="restaurant-outline" size={16} color={theme.colors.primary} />
                            </View>
                            <View style={styles.ingredientListItemText}>
                              <Text style={styles.ingredientListItemName}>{item.name}</Text>
                              <Text style={styles.ingredientListItemUnit}>{item.unit}</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                        style={styles.ingredientList}
                        showsVerticalScrollIndicator={false}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 수량 입력 섹션 */}
            <View style={styles.compactSection}>
              <Text style={styles.compactLabel}>
                <Ionicons name="calculator" size={14} color={theme.colors.primary} /> 수량
              </Text>
              <View style={styles.compactQuantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const current = Number(formData.quantity);
                    if (current > 1) {
                      setFormData(prev => ({ ...prev, quantity: String(current - 1) }));
                    }
                  }}
                  disabled={Number(formData.quantity) <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={20} 
                    color={Number(formData.quantity) <= 1 ? theme.colors.textLight : theme.colors.primary} 
                  />
                </TouchableOpacity>
                
                <View style={styles.quantityDisplay}>
                  <TextInput
                    value={formData.quantity}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '');
                      setFormData(prev => ({ ...prev, quantity: numericText }));
                    }}
                    keyboardType="number-pad"
                    style={styles.quantityInput}
                  />
                  <Text style={styles.quantityUnit}>{formData.unit}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.quantityButton}
                        onPress={() => {
                    const current = Number(formData.quantity);
                    setFormData(prev => ({ ...prev, quantity: String(current + 1) }));
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 유통기한 섹션 */}
            <View style={styles.modernSection}>
              <Text style={styles.modernLabel}>
                <Ionicons name="calendar" size={16} color={theme.colors.primary} /> 유통기한
              </Text>
              
              {/* 선택된 날짜 표시 */}
              <TouchableOpacity
                style={styles.dateDisplay}
                onPress={() => setShowDatePicker(!showDatePicker)}
              >
                <View style={styles.dateDisplayContent}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.dateDisplayText}>
                    {new Date(formData.expiryDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <Ionicons 
                  name={showDatePicker ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {/* 인라인 달력 그리드 */}
              {showDatePicker && (
                <View style={styles.inlineCalendarContainer}>
                  <View style={styles.calendarGrid}>
                    {Array.from({ length: 30 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const isSelected = formData.expiryDate === dateString;
                      
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.inlineCalendarDay,
                            isSelected && styles.calendarDaySelected,
                            i < 3 && styles.calendarDayUrgent,
                            i >= 3 && i < 7 && styles.calendarDayWarning,
                          ]}
                    onPress={() => {
                            setFormData(prev => ({ ...prev, expiryDate: dateString }));
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={[
                            styles.inlineCalendarDayText,
                            isSelected && styles.calendarDayTextSelected,
                            i < 3 && styles.calendarDayTextUrgent,
                          ]}>
                            {date.getDate()}
                          </Text>
                          <Text style={[
                            styles.inlineCalendarDayMonth,
                            isSelected && styles.calendarDayMonthSelected,
                          ]}>
                            {date.getMonth() + 1}월
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
            </View>
            </View>
              )}
            </View>

            {/* 가격 섹션 (선택사항) */}
            <View style={styles.modernSection}>
              <Text style={styles.modernLabel}>
                <Ionicons name="pricetag" size={16} color={theme.colors.primary} /> 가격 
                <Text style={styles.optionalText}>(선택사항)</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <Ionicons name="cash-outline" size={18} color={theme.colors.primary} />
                <Input
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                keyboardType="numeric"
                  placeholder="0"
                  style={styles.priceInput}
              />
                <Text style={styles.priceUnit}>원</Text>
            </View>
            </View>

            {/* 액션 버튼들 */}
            <View style={styles.modernButtons}>
              <TouchableOpacity
                style={styles.modernCancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.modernCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modernConfirmButton, !selectedIngredient && styles.modernConfirmButtonDisabled]}
                onPress={handleAddItem}
                disabled={!selectedIngredient}
              >
                <LinearGradient
                  colors={!selectedIngredient 
                    ? [theme.colors.textLight, theme.colors.textLight]
                    : [theme.colors.primary, theme.colors.primaryLight]
                  }
                  style={styles.modernConfirmGradient}
                >
                  <Ionicons name="checkmark" size={18} color={theme.colors.white} />
                  <Text style={styles.modernConfirmText}>추가하기</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 재료 수정 모달 */}
        <Modal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
            resetForm();
          }}
          title="재료 수정"
        >
          <View style={styles.modernModalContent}>
            {/* 컴팩트 헤더 */}
            <View style={styles.compactHeader}>
              <Ionicons name="create" size={20} color={theme.colors.primary} />
              <Text style={styles.compactTitle}>재료 수정</Text>
            </View>

            {/* 재료명 섹션 */}
            <View style={styles.compactSection}>
              <Text style={styles.compactLabel}>
                <Ionicons name="restaurant" size={14} color={theme.colors.primary} /> 재료명
              </Text>
              
              {selectedIngredient ? (
                <View style={styles.selectedIngredientContainer}>
                  <View style={styles.selectedIngredientInfo}>
                    <View style={styles.selectedIngredientIcon}>
                      <Ionicons name="restaurant" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={styles.selectedIngredientText}>
                      <Text style={styles.selectedIngredientName}>{selectedIngredient.name}</Text>
                      <Text style={styles.selectedIngredientUnit}>단위: {selectedIngredient.unit}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.changeIngredientButton}
                    onPress={() => {
                      setSelectedIngredient(null);
                      setFormData(prev => ({
                        ...prev,
                        name: '',
                        unit: '개'
                      }));
                    }}
                  >
                    <Text style={styles.changeIngredientText}>변경</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ingredientSearchSection}>
                  <Input
                    placeholder="재료명을 검색하세요"
                    value={ingredientSearchQuery}
                    onChangeText={setIngredientSearchQuery}
                    style={styles.compactInput}
                  />
                  
                  {/* 재료 목록 (검색어가 있을 때만 표시) */}
                  {ingredientSearchQuery.length > 0 && (
                    <View style={styles.ingredientListContainer}>
                      <FlatList
                        data={allIngredients.filter(ingredient =>
                          ingredient.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase())
                        ).slice(0, 5)} // 최대 5개만 표시
                        keyExtractor={item => String(item.id)}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.ingredientListItem}
                            onPress={() => {
                              setSelectedIngredient(item);
                              setFormData(prev => ({
                                ...prev,
                                name: item.name,
                                unit: item.unit || '개'
                              }));
                              setIngredientSearchQuery('');
                            }}
                          >
                            <View style={styles.ingredientListItemIcon}>
                              <Ionicons name="restaurant-outline" size={16} color={theme.colors.primary} />
                            </View>
                            <View style={styles.ingredientListItemText}>
                              <Text style={styles.ingredientListItemName}>{item.name}</Text>
                              <Text style={styles.ingredientListItemUnit}>{item.unit}</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                        style={styles.ingredientList}
                        showsVerticalScrollIndicator={false}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 수량 입력 섹션 */}
            <View style={styles.compactSection}>
              <Text style={styles.compactLabel}>
                <Ionicons name="calculator" size={14} color={theme.colors.primary} /> 수량
              </Text>
              <View style={styles.compactQuantityContainer}>
                <TouchableOpacity
                  style={styles.compactQuantityButton}
                  onPress={() => {
                    const current = Number(formData.quantity);
                    if (current > 1) {
                      setFormData(prev => ({ ...prev, quantity: String(current - 1) }));
                    }
                  }}
                  disabled={Number(formData.quantity) <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={Number(formData.quantity) <= 1 ? theme.colors.textLight : theme.colors.primary} 
                  />
                </TouchableOpacity>
                
                <View style={styles.compactQuantityDisplay}>
                  <TextInput
                    value={formData.quantity}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '');
                      setFormData(prev => ({ ...prev, quantity: numericText }));
                    }}
                    keyboardType="number-pad"
                    style={styles.quantityInput}
                  />
                  <Text style={styles.compactQuantityUnit}>{formData.unit}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.compactQuantityButton}
                        onPress={() => {
                    const current = Number(formData.quantity);
                    setFormData(prev => ({ ...prev, quantity: String(current + 1) }));
                  }}
                >
                  <Ionicons name="add" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 유통기한 섹션 */}
            <View style={styles.compactSection}>
              <Text style={styles.compactLabel}>
                <Ionicons name="calendar" size={14} color={theme.colors.primary} /> 유통기한
              </Text>
              
              {/* 선택된 날짜 표시 */}
              <TouchableOpacity
                style={styles.compactDateDisplay}
                onPress={() => setShowDatePicker(!showDatePicker)}
              >
                <View style={styles.compactDateDisplayContent}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.compactDateDisplayText}>
                    {new Date(formData.expiryDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <Ionicons 
                  name={showDatePicker ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              
              {/* 인라인 달력 그리드 */}
              {showDatePicker && (
                <View style={styles.compactCalendarContainer}>
                  <View style={styles.compactCalendarGrid}>
                    {Array.from({ length: 30 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const isSelected = formData.expiryDate === dateString;
                      
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.compactCalendarDay,
                            isSelected && styles.calendarDaySelected,
                            i < 3 && styles.calendarDayUrgent,
                            i >= 3 && i < 7 && styles.calendarDayWarning,
                          ]}
                    onPress={() => {
                            setFormData(prev => ({ ...prev, expiryDate: dateString }));
                            setShowDatePicker(false);
                          }}
                        >
                          <Text style={[
                            styles.compactCalendarDayText,
                            isSelected && styles.calendarDayTextSelected,
                            i < 3 && styles.calendarDayTextUrgent,
                          ]}>
                            {date.getDate()}
                          </Text>
                          <Text style={[
                            styles.compactCalendarDayMonth,
                            isSelected && styles.calendarDayMonthSelected,
                          ]}>
                            {date.getMonth() + 1}월
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
            </View>
            </View>
              )}
            </View>

            {/* 액션 버튼들 */}
            <View style={styles.compactButtons}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                <Text style={styles.compactCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.compactConfirmButton}
                onPress={handleEditItem}
              >
                <Text style={styles.compactConfirmText}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 소비 확인 모달 */}
        <Modal
          visible={showConsumeModal}
          onClose={() => setShowConsumeModal(false)}
          title="재료 사용"
        >
          <View style={styles.modernModalContent}>
            {/* 헤더 */}
            <View style={styles.modernHeader}>
              <View style={styles.headerIconContainer}>
                <LinearGradient
                  colors={[theme.colors.secondary, theme.colors.secondaryLight]}
                  style={styles.headerIconGradient}
                >
                  <Ionicons name="fast-food" size={28} color={theme.colors.white} />
                </LinearGradient>
              </View>
              <Text style={styles.modernTitle}>재료 사용</Text>
              <Text style={styles.modernSubtitle}>사용할 수량을 입력하세요</Text>
            </View>

            {/* 사용 수량 입력 리스트 */}
            <ScrollView style={styles.consumeList}>
              {inventory
                .filter(item => selectedItems.includes(String(item.id)))
                .map(item => (
                  <View key={item.id} style={styles.consumeItem}>
                    <View style={styles.consumeItemInfo}>
                      <Text style={styles.consumeItemName}>{item.ingredient.name}</Text>
                      <Text style={styles.consumeItemStock}>
                        보유: {item.quantity} {item.ingredient.unit}
                      </Text>
                    </View>
                    <TextInput
                      value={consumeQuantities[String(item.id)] || ''}
                      onChangeText={(text) =>
                        setConsumeQuantities(prev => ({
                          ...prev,
                          [String(item.id)]: text.replace(/[^0-9]/g, '')
                        }))
                      }
                      keyboardType="number-pad"
                      style={styles.consumeQuantityInput}
                      placeholder="수량"
                    />
                  </View>
                ))}
            </ScrollView>

            {/* 버튼 */}
            <View style={styles.compactButtons}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => setShowConsumeModal(false)}
              >
                <Text style={styles.compactCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compactConfirmButton}
                onPress={handleConfirmConsume}
              >
                <Text style={styles.compactConfirmText}>사용하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.extraBold,
    color: theme.colors.text,
  },
  headerBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    maxHeight: 50,
  },
  filterScrollView: {
    maxHeight: 50,
    marginBottom: theme.spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  filterBadge: {
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textLight,
  },
  filterBadgeTextActive: {
    color: theme.colors.white,
  },
  selectionActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  selectAllButton: {
    paddingVertical: theme.spacing.sm,
  },
  selectAllText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  consumeButton: {
    backgroundColor: theme.colors.secondary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
  },
  inventoryList: {
    paddingBottom: 100, // FAB와 충분한 여백 확보
  },
  inventoryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  inventoryCardLeft: {
    marginRight: theme.spacing.sm,
    flex: 0.48,
  },
  inventoryCardRight: {
    marginLeft: theme.spacing.sm,
    flex: 0.48,
  },
  inventoryCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    zIndex: 1,
  },
  statusBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  itemContent: {
    marginTop: theme.spacing.sm,
  },
  itemName: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  quantity: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  unit: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  expiryText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  quantityButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    minWidth: 48,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    paddingVertical: 0,
    marginVertical: 0,
  },
  quantityText: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  quantityUnit: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  dateDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateDisplayText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  dateDirectInput: {
    marginBottom: theme.spacing.lg,
  },
  dateDirectLabel: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  dateInput: {
    backgroundColor: theme.colors.white,
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  pickerConfirmButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  pickerConfirmText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  modernButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  modernCancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modernCancelText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  modernConfirmButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  modernConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modernConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  modernConfirmText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
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
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyActionButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    alignSelf: 'center',
    minWidth: 160,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyActionText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
  },
  modernModalContent: {
    padding: theme.spacing.lg,
  },
  modernHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  headerIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modernTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  modernSubtitle: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  modernSection: {
    marginBottom: theme.spacing.md,
  },
  modernLabel: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  selectedIngredientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  selectedIngredientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  selectedIngredientIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIngredientText: {
    flex: 1,
  },
  selectedIngredientName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  selectedIngredientUnit: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  changeIngredientButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  changeIngredientText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
  },
  ingredientSearchSection: {
    gap: theme.spacing.sm,
  },
  ingredientSearchBar: {
    marginBottom: 0,
  },
  ingredientListContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
  },
  ingredientList: {
    maxHeight: 200,
  },
  ingredientListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
  },
  ingredientListItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientListItemText: {
    flex: 1,
  },
  ingredientListItemName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  ingredientListItemUnit: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  dateQuickOptions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  dateQuickOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  dateQuickText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  modalDescription: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  consumeList: {
    padding: theme.spacing.lg,
  },
  consumeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  consumeItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  consumeItemName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  consumeItemStock: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  consumeQuantityInput: {
    backgroundColor: theme.colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 모달 관련 추가 스타일
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
    gap: theme.spacing.sm,
  },
  priceInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 0,
    fontSize: theme.typography.fontSize.medium,
    minHeight: 24,
  },
  priceUnit: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  optionalText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  modernInput: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.medium,
    minHeight: 56,
  },
  // 컴팩트 스타일들
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  compactTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  compactSection: {
    marginBottom: theme.spacing.sm,
  },
  compactLabel: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  compactInput: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.small,
    minHeight: 40,
  },
  compactQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  compactQuantityButton: {
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactQuantityDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactQuantityText: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  compactQuantityUnit: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  compactDateButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  compactDateButton: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xs,
    alignItems: 'center',
  },
  compactDateText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  compactDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  compactDateDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.xs,
  },
  compactDateDisplayText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  compactButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  compactCancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  compactCancelText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  compactConfirmButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  compactConfirmText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  // 인라인 달력 스타일들
  inlineCalendarContainer: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  inlineCalendarDay: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.xs,
  },
  calendarDaySelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  calendarDayUrgent: {
    backgroundColor: '#FFF3E0',
    borderColor: theme.colors.warning,
  },
  calendarDayWarning: {
    backgroundColor: '#FFF8E1',
    borderColor: theme.colors.accent,
  },
  inlineCalendarDayText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  calendarDayTextSelected: {
    color: theme.colors.white,
  },
  calendarDayTextUrgent: {
    color: theme.colors.warning,
  },
  inlineCalendarDayMonth: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginTop: 1,
  },
  calendarDayMonthSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  // 컴팩트 모달용 달력 스타일들
  compactCalendarContainer: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compactCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  compactCalendarDay: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: theme.spacing.xs,
  },
  compactCalendarDayText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  compactCalendarDayMonth: {
    fontSize: 8,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginTop: 1,
  },
});

export default InventoryScreen; 