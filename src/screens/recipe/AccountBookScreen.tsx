import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { 
  Alert,
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
  Dimensions,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { purchaseService } from '../../api/services/purchase';
import { Purchase, PurchaseDto } from '../../types/purchase';
import { useFocusEffect } from '@react-navigation/native';
import Loading from '../../components/common/Loading';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import Modal from '../../components/common/Modal';  
import { useAppSelector } from '../../store/hooks';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WebSocketState, OcrResultData } from '../../types/websocket';
import { useAuth } from '../../hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');

function getMonthDays(year: number, month: number) {
  // month 는 1~12 기준
  return new Date(year, month, 0).getDate();
}

const AccountBookScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = 현재월, 1 = 이전 1개월 ... 최대 3
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'calendar' | 'stats' | 'trends'>('calendar');
  
  // 수정 모달 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPurchases, setEditingPurchases] = useState<Purchase[]>([]);
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await purchaseService.getAllPurchases();
      // res.data 는 PurchaseDto[] 형태
      // PurchaseDto의 id를 각 item에 포함시켜서 flattening
      const flattened: Purchase[] = res.data.flatMap((dto: PurchaseDto) => 
        dto.items.map(item => ({
          ...item,
          id: dto.id, // PurchaseDto의 id를 item에 포함
        }))
      );
      console.log('불러온 구매 데이터 샘플 (ID 포함):', flattened.slice(0, 2));
      setAllPurchases(flattened);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
      Alert.alert('오류', '구매 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 최초 마운트
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 화면 포커스 될 때마다 최신 데이터
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // 구매 기록 수정 모달 열기
  const openEditModal = (purchases: Purchase[]) => {
    setEditingPurchases(purchases.map(p => ({ ...p })));
    setShowEditModal(true);
  };

  // 구매 기록 수정
  const handleUpdatePurchases = async () => {
    try {
      setUpdating(true);
      
      // Purchase를 PurchaseDto 형태로 변환 (id와 purchaseDate 포함)
      const purchaseDtos: PurchaseDto[] = editingPurchases.map(purchase => ({
        id: purchase.id, // 수정을 위해 기존 id 포함
        ingredient: {
          ingredientId: purchase.ingredient.ingredientId || 0,
          ingredientName: purchase.ingredient.ingredientName,
          amount: purchase.quantity,
          unit: purchase.ingredient.unit || '개',
        },
        quantity: purchase.quantity,
        price: purchase.price || 0,
        purchaseDate: purchase.purchaseDate, // PurchaseDto 레벨에도 원본 purchaseDate 포함
        items: [{
          id: purchase.id, // items에도 id 포함
          ingredient: {
            ingredientId: purchase.ingredient.ingredientId || 0,
            ingredientName: purchase.ingredient.ingredientName,
            amount: purchase.quantity,
            unit: purchase.ingredient.unit || '개',
          },
          quantity: purchase.quantity,
          price: purchase.price || 0,
          purchaseDate: purchase.purchaseDate, // 원본 purchaseDate 유지
        }]
      }));

      console.log('수정할 구매 항목들 (ID와 날짜 확인):', editingPurchases.map(p => ({ 
        id: p.id, 
        name: p.ingredient.ingredientName, 
        price: p.price,
        purchaseDate: p.purchaseDate 
      })));
      console.log('수정 요청 데이터:', JSON.stringify(purchaseDtos, null, 2));
      
      await purchaseService.updatePurchaseBatch(purchaseDtos);
      await fetchData();
      setShowEditModal(false);
      Alert.alert('완료', '구매 기록이 수정되었습니다.');
    } catch (error) {
      console.error('구매 기록 수정 실패:', error);
      Alert.alert('오류', '구매 기록 수정 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  // 수정 중인 구매 항목 가격 업데이트
  const updateEditingPurchasePrice = (index: number, value: string) => {
    setEditingPurchases(prev => 
      prev.map((item, idx) => 
        idx === index 
          ? { ...item, price: parseFloat(value) || 0 }
          : item
      )
    );
  };

  // 구매 기록 삭제
  const handleDeletePurchase = async (purchase: Purchase) => {
    Alert.alert(
      '구매 기록 삭제',
      '이 구매 기록을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await purchaseService.deletePurchase(purchase.id);
              await fetchData(); // 즉시 데이터 새로고침
              setShowEditModal(false); // 모달 닫기
            } catch (error) {
              console.error('구매 기록 삭제 실패:', error);
              Alert.alert('오류', '구매 기록 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const baseDate = new Date();

  const viewDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - monthOffset, 1);
  const calYear = viewDate.getFullYear();
  const calMonth = viewDate.getMonth() + 1;

  const daysInMonth = getMonthDays(calYear, calMonth);
  // 해당 달 1일의 요일(0=일요일)
  const firstWeekday = new Date(calYear, calMonth - 1, 1).getDay();

  // 현재 월 데이터
  const currentMonthPurchases = useMemo(() => {
    const filtered = allPurchases.filter((p: Purchase | any) => {
      const rawDate: string | undefined = p.purchaseDate;
      if (!rawDate) return false;
      const dateOnly = rawDate.split('T')[0];
      const [y, m] = dateOnly.split('-');
      return Number(y) === calYear && Number(m) === calMonth;
    });
    
    return filtered;
  }, [allPurchases, calYear, calMonth]);

  // 이전 월 데이터 (비교용)
  const prevMonthPurchases = useMemo(() => {
    const prevDate = new Date(calYear, calMonth - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    
    return allPurchases.filter((p: Purchase | any) => {
      const rawDate: string | undefined = p.purchaseDate;
      if (!rawDate) return false;
      const dateOnly = rawDate.split('T')[0];
      const [y, m] = dateOnly.split('-');
      return Number(y) === prevYear && Number(m) === prevMonth;
    });
  }, [allPurchases, calYear, calMonth]);

  // 통계 계산
  const monthlyStats = useMemo(() => {
    const currentTotal = currentMonthPurchases.reduce((sum, p) => sum + (p.price || 0), 0);
    const prevTotal = prevMonthPurchases.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalItems = currentMonthPurchases.length;
    const avgPerItem = totalItems > 0 ? currentTotal / totalItems : 0;
    const uniqueIngredients = new Set(currentMonthPurchases.map(p => p.ingredient.ingredientName)).size;
    
    // 개선된 변화율 계산
    let changePercent = 0;
    if (prevTotal === 0 && currentTotal === 0) {
      changePercent = 0; // 둘 다 0원이면 변화 없음
    } else if (prevTotal === 0 && currentTotal > 0) {
      changePercent = 100; // 지난달 0원 → 이번달 지출 있음 = 100% 증가
    } else if (prevTotal > 0 && currentTotal === 0) {
      changePercent = -100; // 지난달 지출 있음 → 이번달 0원 = 100% 감소
    } else {
      changePercent = ((currentTotal - prevTotal) / prevTotal) * 100; // 일반적인 변화율
    }
    
    return {
      total: currentTotal,
      prevTotal,
      changePercent,
      itemCount: totalItems,
      avgPerItem,
      uniqueIngredients
    };
  }, [currentMonthPurchases, prevMonthPurchases]);

  // 주간 트렌드
  const weeklyTrend = useMemo(() => {
    const weeks = Array(4).fill(0);
    
    currentMonthPurchases.forEach(p => {
      if (!p.purchaseDate) return;
      const day = new Date(p.purchaseDate).getDate();
      const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
      weeks[weekIndex] += p.price || 0;
    });
    
    return weeks;
  }, [currentMonthPurchases]);

  // 탑 아이템
  const topItems = useMemo(() => {
    const counts: Record<string, { quantity: number; total: number }> = {};
    currentMonthPurchases.forEach((p: Purchase) => {
      const name = p.ingredient.ingredientName;
      if (!counts[name]) {
        counts[name] = { quantity: 0, total: 0 };
      }
      counts[name].quantity += p.quantity || 0;
      counts[name].total += p.price || 0;
    });
    
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [currentMonthPurchases]);

  // 선택된 날짜의 구매 내역
  const selectedDatePurchases = useMemo(() => {
    if (!selectedDate) return [];
    return currentMonthPurchases.filter(p => {
      if (!p.purchaseDate) return false;
      const dateOnly = p.purchaseDate.split('T')[0];
      return dateOnly === selectedDate;
    });
  }, [currentMonthPurchases, selectedDate]);

  // 탭 렌더링
  const renderTab = (tab: typeof selectedTab, label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tab, selectedTab === tab && styles.tabActive]}
      onPress={() => setSelectedTab(tab)}
    >
      <Ionicons 
        name={icon as any} 
        size={18} 
        color={selectedTab === tab ? theme.colors.white : theme.colors.textLight} 
      />
      <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // 통계 카드 렌더링
  const renderStatCard = (title: string, value: string, subtitle: string, icon: string, color: string, change?: number) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={20} color={theme.colors.white} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statFooter}>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
        {change !== undefined && (
          <View style={styles.statChange}>
            <Ionicons 
              name={change >= 0 ? "trending-up" : "trending-down"} 
              size={12} 
              color={change >= 0 ? theme.colors.error : theme.colors.success} 
            />
            <Text style={[styles.statChangeText, { color: change >= 0 ? theme.colors.error : theme.colors.success }]}>
              {Math.abs(change).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // 달력 렌더링
  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <Text key={day} style={[styles.calendarHeaderText, index === 0 && styles.sundayText]}>
            {day}
          </Text>
        ))}
      </View>
      
      {Array.from({ length: Math.ceil((daysInMonth + firstWeekday) / 7) }, (_, weekIdx) => (
        <View key={weekIdx} style={styles.calendarWeek}>
          {Array.from({ length: 7 }, (_, dayIdx) => {
            const cellIndex = weekIdx * 7 + dayIdx;
            const day = cellIndex - firstWeekday + 1;

            if (cellIndex < firstWeekday || day > daysInMonth) {
              return <View key={dayIdx} style={styles.calendarDay} />;
            }

            const dateStr = `${calYear}-${calMonth.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
            const dayPurchases = currentMonthPurchases.filter(p => {
              if (!p.purchaseDate) return false;
              return p.purchaseDate.split('T')[0] === dateStr;
            });
            const totalSpent = dayPurchases.reduce((sum, p) => sum + (p.price || 0), 0);
            
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <TouchableOpacity
                key={dayIdx}
                style={[
                  styles.calendarDay,
                  dayPurchases.length > 0 && styles.calendarDayWithPurchase,
                  isSelected && styles.calendarDaySelected,
                  isToday && styles.calendarDayToday
                ]}
                onPress={() => setSelectedDate(prev => prev === dateStr ? null : dateStr)}
              >
                <Text style={[
                  styles.calendarDayText,
                  dayIdx === 0 && styles.sundayText,
                  isSelected && styles.calendarDayTextSelected,
                  isToday && !isSelected && styles.calendarDayTextToday
                ]}>
                  {day}
                </Text>
                {dayPurchases.length > 0 && (
                  <View style={[styles.purchaseDot, isSelected && styles.purchaseDotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  // 수정 모달 내용 렌더링
  const renderEditModalContent = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>구매 기록 수정</Text>
      <Text style={styles.modalSubtitle}>{selectedDate}</Text>
      {editingPurchases.map((purchase, index) => (
        <View key={index} style={styles.editItemRow}>
          <View style={styles.editItemInfo}>
            <Text style={styles.editItemName}>{purchase.ingredient.ingredientName}</Text>
            <Text style={styles.editItemQuantity}>{purchase.quantity}{purchase.ingredient.unit}</Text>
          </View>
          <View style={styles.editItemActions}>
            <TextInput
              style={styles.priceInput}
              value={purchase.price?.toString() || '0'}
              onChangeText={(value) => updateEditingPurchasePrice(index, value)}
              keyboardType="numeric"
              placeholder="가격"
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePurchase(purchase)}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]} 
          onPress={() => setShowEditModal(false)}
        >
          <Text style={styles.modalButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modalButton, styles.saveButton]} 
          onPress={handleUpdatePurchases}
          disabled={updating}
        >
          {updating ? (
            <LoadingIndicator />
          ) : (
            <Text style={styles.modalButtonText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setMonthOffset(prev => Math.min(prev + 1, 11))}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {calYear}년 {calMonth}월
          </Text>
          
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setMonthOffset(prev => Math.max(prev - 1, 0))}
            disabled={monthOffset === 0}
          >
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={monthOffset === 0 ? theme.colors.textLight : theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        {renderTab('calendar', '달력', 'calendar')}
        {renderTab('stats', '통계', 'stats-chart')}
        {renderTab('trends', '트렌드', 'trending-up')}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 월간 요약 */}
        <View style={styles.summarySection}>
          <LinearGradient
            colors={theme.colors.gradientPrimary as [string, string]}
            style={styles.summaryCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>이번 달 총 지출</Text>
              <Ionicons name="wallet" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.summaryAmount}>
              {monthlyStats.total.toLocaleString()}원
            </Text>
            <View style={styles.summaryFooter}>
              <Text style={styles.summarySubtext}>
                지난 달 대비 {monthlyStats.changePercent >= 0 ? '+' : ''}{monthlyStats.changePercent.toFixed(1)}%
              </Text>
              <Ionicons 
                name={monthlyStats.changePercent >= 0 ? "trending-up" : "trending-down"} 
                size={16} 
                color={theme.colors.white} 
              />
            </View>
          </LinearGradient>
        </View>

        {/* 통계 카드들 */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            '구매 횟수',
            monthlyStats.itemCount.toString(),
            '이번 달',
            'bag',
            theme.colors.secondary
          )}
          {renderStatCard(
            '평균 단가',
            `${Math.round(monthlyStats.avgPerItem).toLocaleString()}원`,
            '건당 평균',
            'calculator',
            theme.colors.accent
          )}
          {renderStatCard(
            '구매 품목',
            monthlyStats.uniqueIngredients.toString(),
            '가지 재료',
            'leaf',
            theme.colors.success
          )}
        </View>

        {/* 탭 콘텐츠 */}
        {selectedTab === 'calendar' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>구매 달력</Text>
            {renderCalendar()}
            
            {/* 선택된 날짜 상세 */}
            {selectedDate && (
              <View style={styles.selectedDateSection}>
                <View style={styles.selectedDateHeader}>
                  <Text style={styles.selectedDateTitle}>
                    {selectedDate} 구매 내역
                  </Text>
                  {selectedDatePurchases.length > 0 && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(selectedDatePurchases)}
                    >
                      <Ionicons name="pencil" size={16} color={theme.colors.white} />
                      <Text style={styles.editButtonText}>수정</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {selectedDatePurchases.length === 0 ? (
                  <View style={styles.emptyDateContainer}>
                    <Ionicons name="calendar-outline" size={32} color={theme.colors.textLight} />
                    <Text style={styles.emptyDateText}>구매 내역이 없습니다</Text>
                  </View>
                ) : (
                  <View style={styles.dateItemsList}>
                    {selectedDatePurchases.map((item, idx) => (
                      <View key={idx} style={styles.dateItem}>
                        <View style={styles.dateItemInfo}>
                          <Text style={styles.dateItemName}>
                            {item.ingredient.ingredientName}
                          </Text>
                          <Text style={styles.dateItemQuantity}>
                            {item.quantity} {item.ingredient.unit || '개'}
                          </Text>
                        </View>
                        <Text style={styles.dateItemPrice}>
                          {(item.price || 0).toLocaleString()}원
                        </Text>
                      </View>
                    ))}
                    <View style={styles.dateTotal}>
                      <Text style={styles.dateTotalText}>
                        총 {selectedDatePurchases.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}원
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {selectedTab === 'stats' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>인기 구매 품목</Text>
            <View style={styles.topItemsList}>
              {topItems.map((item, index) => (
                <View key={item.name} style={styles.topItem}>
                  <View style={styles.topItemRank}>
                    <Text style={styles.topItemRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topItemInfo}>
                    <Text style={styles.topItemName}>{item.name}</Text>
                    <Text style={styles.topItemDetails}>
                      {item.quantity}개 구매 • {item.total.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.topItemBadge}>
                    <Ionicons name="star" size={16} color={theme.colors.accent} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'trends' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주간 지출 트렌드</Text>
            <View style={styles.trendChart}>
              {weeklyTrend.map((amount, index) => {
                const maxAmount = Math.max(...weeklyTrend);
                const height = maxAmount > 0 ? (amount / maxAmount) * 120 : 0;
                
                return (
                  <View key={index} style={styles.trendBar}>
                    <Text style={styles.trendAmount}>
                      {amount > 0 ? `${Math.round(amount / 1000)}k` : '0'}
                    </Text>
                    <View style={styles.trendBarContainer}>
                      <LinearGradient
                        colors={[theme.colors.primary, theme.colors.primaryLight]}
                        style={[styles.trendBarFill, { height }]}
                      />
                    </View>
                    <Text style={styles.trendWeek}>{index + 1}주차</Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>월별 비교</Text>
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>이번 달</Text>
                <Text style={styles.comparisonValue}>
                  {monthlyStats.total.toLocaleString()}원
                </Text>
              </View>
              <View style={styles.comparisonDivider} />
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>지난 달</Text>
                <Text style={styles.comparisonValue}>
                  {monthlyStats.prevTotal.toLocaleString()}원
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 구매 기록 수정 모달 */}
      <Modal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="구매 기록 수정"
      >
        {renderEditModalContent()}
      </Modal>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  monthButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.extraBold,
    color: theme.colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  tabText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  content: {
    flex: 1,
  },
  summarySection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
    opacity: 0.9,
  },
  summaryAmount: {
    fontSize: theme.typography.fontSize.display,
    fontFamily: theme.typography.fontFamily.extraBold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  summarySubtext: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.base,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statChangeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  calendarContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.base,
    marginBottom: theme.spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  calendarHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  sundayText: {
    color: theme.colors.error,
  },
  calendarWeek: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: theme.borderRadius.sm,
  },
  calendarDayWithPurchase: {
    backgroundColor: theme.colors.surface,
  },
  calendarDaySelected: {
    backgroundColor: theme.colors.primary,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  calendarDayText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  calendarDayTextSelected: {
    color: theme.colors.white,
  },
  calendarDayTextToday: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  purchaseDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  purchaseDotSelected: {
    backgroundColor: theme.colors.white,
  },
  selectedDateSection: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.base,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  selectedDateTitle: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  editButtonText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.white,
  },
  emptyDateContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyDateText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
  },
  dateItemsList: {
    gap: theme.spacing.sm,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  dateItemInfo: {
    flex: 1,
  },
  dateItemName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  dateItemQuantity: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  dateItemPrice: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
  },
  dateTotal: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    alignItems: 'flex-end',
  },
  dateTotalText: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  topItemsList: {
    gap: theme.spacing.sm,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.base,
    gap: theme.spacing.md,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topItemRankText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  topItemDetails: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  topItemBadge: {
    padding: theme.spacing.xs,
  },
  trendChart: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.base,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  trendAmount: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    height: 20,
  },
  trendBarContainer: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  trendWeek: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  comparisonCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.base,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  comparisonValue: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  comparisonDivider: {
    width: 1,
    backgroundColor: theme.colors.borderLight,
    marginHorizontal: theme.spacing.md,
  },
  // 수정 모달 스타일들
  modalContent: {
    padding: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  editItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  editItemInfo: {
    flex: 1,
  },
  editItemName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  editItemQuantity: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  editItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.medium,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default AccountBookScreen; 