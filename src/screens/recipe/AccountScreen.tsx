import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, RefreshControl, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { userService } from '../../api/services/user';
import { recipeService } from '../../api/services/recipe';
import { useAuth } from '../../hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ingredient, IngredientResponseDto } from '../../types/ingredient';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';

const AccountScreen = ({ navigation }: any) => {
  const reduxIngredients = useSelector((state: any) => (state.ingredient?.ingredients as Ingredient[]) || []);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [recentViewed, setRecentViewed] = useState<any[]>([]);
  const [myPublishedRecipes, setMyPublishedRecipes] = useState<any[]>([]);
  const [myPendingRecipes, setMyPendingRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const { logout, resetAllData } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [userResponse, statsResponse, cookedRes, savedRes, viewedRes, myRecipesRes] = await Promise.all([
        userService.getMyInfo(),
        userService.getUserStats(),
        userService.getCookedRecipes(),
        recipeService.getSavedRecipes(),
        recipeService.getRecentViewedRecipes(),
        recipeService.getMyRecipes(),
      ]);
      
      setUserInfo(userResponse.data);
      setUserStats(statsResponse.data);
      setRecent(cookedRes.data || []);
      setBookmarks(savedRes.data || []);
      setRecentViewed(viewedRes.data || []);
      
      // 내가 만든 레시피를 상태별로 분류
      const myRecipes = myRecipesRes.data || [];
      setMyPublishedRecipes(myRecipes.filter((recipe: any) => recipe.status === 'PUBLISHED'));
      setMyPendingRecipes(myRecipes.filter((recipe: any) => recipe.status === 'PENDING' || recipe.status === 'DRAFT'));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // 최초 마운트 시 데이터 로드
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 화면 포커스 될 때마다 최신 데이터 로드
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleDeleteAccount = async () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // 백엔드에 계정 삭제 요청
              await userService.deleteMyAccount();
              
              // 모든 데이터 초기화 (Redux + AsyncStorage)
              await resetAllData();
              
              // Redux 상태 변경으로 RootNavigator가 자동으로 AuthNavigator로 전환됨
            } catch (error) {
              console.error('Failed to delete account:', error);
              Alert.alert('오류', '계정 삭제에 실패했습니다.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말로 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await logout();
              // Redux 상태 변경으로 RootNavigator가 자동으로 AuthNavigator로 전환됨
            } catch (error) {
              console.error('Failed to logout:', error);
              Alert.alert('오류', '로그아웃에 실패했습니다.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderRecipeCard = (item: any, index: number, keyPrefix: string) => (
    <TouchableOpacity 
      key={`${keyPrefix}-${item.id}-${index}`} 
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.recipeDescription} numberOfLines={2}>{item.description}</Text>
        {keyPrefix.includes('published') && (
          <View style={styles.statusBadge}>
            <Text style={styles.publishedBadgeText}>게시됨</Text>
          </View>
        )}
        {keyPrefix.includes('pending') && (
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Text style={styles.pendingBadgeText}>
              {item.status === 'DRAFT' ? '임시저장' : '승인대기'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHorizontalSection = (title: string, data: any[], keyPrefix: string, emptyMessage: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{data.length}</Text>
      </View>
      {data.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {data.map((item, index) => renderRecipeCard(item, index, keyPrefix))}
        </ScrollView>
      ) : (
        <Empty
          message={emptyMessage}
          style={styles.emptyContainer}
        />
      )}
    </View>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 헤더 프로필 섹션 */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.profileSection}>
            <Avatar.Text 
              size={80} 
              label={userInfo?.name?.charAt(0) || 'U'} 
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userInfo?.name || '사용자'}</Text>
              <Text style={styles.profileDetail}>
                {userInfo?.householdSize}인 가구 • {userInfo?.age}세
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{myPublishedRecipes.length}</Text>
                  <Text style={styles.statLabel}>레시피</Text>
            </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{bookmarks.length}</Text>
                  <Text style={styles.statLabel}>북마크</Text>
          </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{recent.length}</Text>
                  <Text style={styles.statLabel}>요리완료</Text>
        </View>
      </View>
            </View>
          </View>
        </LinearGradient>

        {/* 개인정보 카드 */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.infoTitle}>개인정보</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>선호 재료</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {(userInfo?.preferences || []).map((p: any) => 
                    typeof p === 'string' ? p : p.name ?? p.ingredientName
                  ).join(', ') || '-'}
              </Text>
            </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>비선호 재료</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {(userInfo?.dislikes || []).map((p: any) => 
                    typeof p === 'string' ? p : p.name ?? p.ingredientName
                  ).join(', ') || '-'}
              </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>알레르기 재료</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {(userInfo?.allergies || []).map((p: any) => 
                    typeof p === 'string' ? p : p.name ?? p.ingredientName
                  ).join(', ') || '-'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 레시피 섹션들 */}
        {renderHorizontalSection('최근 조회한 레시피', recentViewed, 'recent-viewed', '최근 조회한 레시피가 없습니다')}
        {renderHorizontalSection('내 북마크 레시피', bookmarks, 'bookmark', '북마크한 레시피가 없습니다')}
        {renderHorizontalSection('게시된 내 레시피', myPublishedRecipes, 'published', '게시된 레시피가 없습니다')}
        {renderHorizontalSection('게시 준비중인 내 레시피', myPendingRecipes, 'pending', '게시 준비중인 레시피가 없습니다')}
        {renderHorizontalSection('최근 만든 레시피', recent, 'recent-cooked', '최근 만든 레시피가 없습니다')}

        {/* 액션 버튼들 */}
        <View style={styles.actionSection}>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('UserInfoEdit', { isEdit: true })} 
            style={styles.primaryButton}
            labelStyle={styles.buttonLabel}
            icon="pencil-outline"
          >
            정보 수정
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleLogout} 
            style={styles.outlineButton}
            labelStyle={[styles.buttonLabel, { color: theme.colors.warning }]}
            icon="logout"
          >
            로그아웃
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleDeleteAccount} 
            style={[styles.outlineButton, { borderColor: theme.colors.error }]}
            labelStyle={[styles.buttonLabel, { color: theme.colors.error }]}
            icon="account-remove"
          >
            회원탈퇴
          </Button>
        </View>
      
      {/* 약관/개인정보 버튼 */}
        <View style={styles.legalSection}>
        <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
          <Text style={styles.legalLink}>이용약관</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Text style={styles.legalLink}>개인정보처리방침</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: theme.spacing.lg,
  },
  avatarLabel: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  profileDetail: {
    fontSize: theme.typography.fontSize.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  statNumber: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.small,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: theme.spacing.sm,
  },
  infoCard: {
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  infoGrid: {
    gap: theme.spacing.md,
  },
  infoItem: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border + '30',
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  sectionCount: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    minWidth: 24,
    textAlign: 'center',
  },
  horizontalScrollContainer: {
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.lg,
  },
  recipeCard: {
    width: 160,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.border,
  },
  recipeContent: {
    padding: theme.spacing.md,
  },
  recipeTitle: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  recipeDescription: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    lineHeight: 18,
  },
  statusBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  publishedBadgeText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  pendingBadge: {
    backgroundColor: theme.colors.warning,
  },
  pendingBadgeText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
  },
  emptyContainer: {
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  actionSection: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  outlineButton: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
  },
  buttonLabel: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.bold,
    lineHeight: 22,
  },
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: theme.spacing.xxl,
  },
  legalLink: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    textDecorationLine: 'underline',
    fontFamily: theme.typography.fontFamily.medium,
  },
  separator: {
    marginHorizontal: theme.spacing.sm,
    color: theme.colors.textLight,
    fontSize: theme.typography.fontSize.small,
  },
});

export default AccountScreen; 