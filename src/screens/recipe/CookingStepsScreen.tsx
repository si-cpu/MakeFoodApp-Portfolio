import React from 'react';
import { View, StyleSheet, Alert, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CookingSteps from '../../components/recipe/CookingSteps';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RecipeStepDto } from '../../types/recipe';
import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme/theme';
import { recipeService } from '../../api/services/recipe';

const { width, height } = Dimensions.get('window');

// 네비게이션 파라미터 타입 정의
interface CookingStepsScreenParams {
  steps: RecipeStepDto[];
  recipeId: number;
}

type Route = RouteProp<{ params: CookingStepsScreenParams }, 'params'>;

const CookingStepsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { steps, recipeId } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* 플로팅 뒤로가기 버튼 */}
        <View style={[styles.floatingBackButton, { top: insets.top + 8 }]}>
      <IconButton
        icon="arrow-left"
        size={24}
            iconColor={theme.colors.white}
            style={styles.backButton}
        onPress={() => navigation.goBack()}
      />
        </View>

        {/* 요리 단계 컴포넌트 */}
        <View style={styles.stepsContainer}>
      <CookingSteps
        steps={steps}
        isActive={true}
            recipeId={recipeId}
            onComplete={async (rating?: number) => {
              try {
                await recipeService.recordCook(recipeId);
              } catch (error) {
                console.error('요리 완료 기록 실패:', error);
              }

              if (rating) {
                // 평점이 있을 때
                Alert.alert(
                  '🎉 평점 등록 완료!', 
                  `${rating}점으로 평점이 등록되었습니다.\n맛있는 요리가 완성되었습니다!`, 
                  [
                    { 
                      text: '확인', 
                      onPress: () => navigation.goBack(),
                      style: 'default'
                    }
                  ],
                  { 
                    cancelable: false 
                  }
                );
          } else {
                // 완료만 했을 때
                Alert.alert(
                  '🎉 조리 완료!', 
                  '맛있는 요리가 완성되었습니다!', 
                  [
                    { 
                      text: '확인', 
                      onPress: () => navigation.goBack(),
                      style: 'default'
                    }
                  ],
                  { 
                    cancelable: false 
                  }
                );
          }
        }}
      />
    </View>

        {/* 하단 그라데이션 오버레이 */}
        <LinearGradient
          colors={['transparent', theme.colors.primary + '20']}
          style={styles.bottomOverlay}
          pointerEvents="none"
        />
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  floatingBackButton: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 100,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.lg,
  },
  stepsContainer: {
    flex: 1,
    marginTop: 60, // 뒤로가기 버튼 공간 확보
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    pointerEvents: 'none',
  },
});

export default CookingStepsScreen; 