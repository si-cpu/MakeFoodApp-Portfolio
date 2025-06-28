import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { RecipeStepDto } from '../../types/recipe';
import { recipeService } from '../../api/services/recipe';
import { isIPad } from '../../utils/deviceUtils';

interface CookingStepsProps {
  steps: RecipeStepDto[];
  onComplete: (rating?: number) => void;
  isActive: boolean;
  recipeId: number;
}

const CookingSteps: React.FC<CookingStepsProps> = ({ 
  steps, 
  onComplete, 
  isActive,
  recipeId 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(new Array(steps.length).fill(false));

  const handleStepComplete = (index: number) => {
    const newCompletedSteps = [...completedSteps];
    newCompletedSteps[index] = !newCompletedSteps[index];
    setCompletedSteps(newCompletedSteps);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 마지막 단계에서는 별점 모달 표시
      setShowRatingModal(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 평점 제출
  const handleRating = async () => {
    if (tempRating === 0) {
      Alert.alert('알림', '평점을 선택해주세요.');
      return;
    }

    try {
      await recipeService.addScore({
        recipeId: recipeId,
        rating: tempRating
      });
      
      setShowRatingModal(false);
      onComplete(tempRating);
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

  if (!isActive || !steps || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <View style={styles.container}>
      {/* 재료 목록 */}
      <View style={[styles.ingredientsSection, { maxWidth: isIPad ? 600 : '100%', alignSelf: 'center' }]}>
        <Text style={styles.sectionTitle}>재료</Text>
        <View style={styles.ingredientsList}>
          {/* 재료 목록 추가 코드 */}
        </View>
      </View>

      {/* 조리 단계 */}
      <ScrollView style={styles.stepsSection}>
        <View style={[styles.stepsContainer, { maxWidth: isIPad ? 800 : '100%', alignSelf: 'center' }]}>
          <Text style={styles.sectionTitle}>조리 순서</Text>
          <View style={styles.stepItem}>
        <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>Step {currentStep + 1}</Text>
              <TouchableOpacity
                style={[styles.checkButton, completedSteps[currentStep] && styles.checkButtonCompleted]}
                onPress={() => handleStepComplete(currentStep)}
              >
                <Ionicons
                  name={completedSteps[currentStep] ? "checkmark-circle" : "checkmark-circle-outline"}
                  size={24}
                  color={completedSteps[currentStep] ? theme.colors.success : theme.colors.textLight}
                />
              </TouchableOpacity>
        </View>
            
        {step.imageUrl && (
          <View style={styles.stepImageContainer}>
                <Image 
                  source={{ uri: step.imageUrl }} 
                  style={[styles.stepImage, { width: isIPad ? '60%' : '100%' }]}
                  resizeMode="cover"
                />
            <View style={styles.aiWarningOverlay}>
              <Text style={styles.aiWarningText}>
                ⚠️ AI로 생성된 이미지이므로 참고만 해주세요!
              </Text>
            </View>
          </View>
        )}
            
        <Text style={styles.stepDescription}>
          {step.description || '설명이 없습니다.'}
        </Text>
            
            {step.tip && (
              <View style={styles.tipContainer}>
                <Ionicons name="bulb-outline" size={20} color={theme.colors.warning} />
                <Text style={styles.tipText}>{step.tip}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 이전/다음 버튼 */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
            onPress={handlePrevStep}
            disabled={currentStep === 0}
        >
          <Ionicons name="arrow-back" size={24} color={currentStep === 0 ? theme.colors.textLight : theme.colors.white} />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>이전</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
              onPress={handleNextStep}
        >
          <Text style={styles.navButtonText}>
            {currentStep === steps.length - 1 ? '완료' : '다음'}
          </Text>
          <Ionicons name="arrow-forward" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* 평점 모달 */}
      <Portal>
        <Dialog 
          visible={showRatingModal} 
          onDismiss={() => {
            setShowRatingModal(false);
            setTempRating(0);
          }}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>요리는 어떠셨나요?</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.ratingDescription}>
              이 레시피에 대한 평가를 남겨주시면 다른 사용자들에게 도움이 됩니다.
            </Text>
            <View style={styles.ratingStars}>
              {renderStars(tempRating, setTempRating, true)}
            </View>
            <Text style={styles.ratingLabel}>
              {tempRating > 0 ? `${tempRating}점` : '별점을 선택해주세요'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              mode="outlined"
              onPress={() => {
                setShowRatingModal(false);
                onComplete();
              }} 
              style={styles.skipButton}
              labelStyle={styles.skipButtonLabel}
            >
              평가 없이 완료
            </Button>
            <Button 
              mode="contained"
              onPress={() => {
                if (tempRating > 0) {
                  handleRating();
                } else {
                  Alert.alert('알림', '별점을 선택해주세요.');
                }
              }}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              disabled={tempRating === 0}
            >
              평가 완료
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  ingredientsSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    margin: theme.spacing.md,
  },
  stepsSection: {
    flex: 1,
  },
  stepsContainer: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.extraBold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  ingredientsList: {
    // 재료 목록 스타일 추가
  },
  ingredientItem: {
    // 재료 아이템 스타일 추가
  },
  ingredientName: {
    // 재료 이름 스타일 추가
  },
  ingredientAmount: {
    // 재료 양 스타일 추가
  },
  stepItem: {
    padding: theme.spacing.lg,
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  stepNumber: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  checkButton: {
    padding: 4,
  },
  checkButtonCompleted: {
    opacity: 0.5,
  },
  stepImageContainer: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  stepImage: {
    width: '100%',
    height: 240,
    backgroundColor: theme.colors.border,
  },
  aiWarningOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: theme.spacing.md,
  },
  aiWarningText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
    marginBottom: theme.spacing.xl,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tipText: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  dialogActions: {
    flexDirection: 'column',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  ratingDescription: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: 22,
  },
  ratingLabel: {
    fontSize: 18,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily.bold,
  },
  ratingStars: {
    alignItems: 'center',
  },
  skipButton: {
    width: '100%',
    borderColor: theme.colors.border,
  },
  skipButtonLabel: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
  },
  submitButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#fff',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  starContainer: {
    position: 'relative',
  },
  starButton: {
    padding: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  navButtonDisabled: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextButton: {
    backgroundColor: theme.colors.accent,
  },
  navButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },
  navButtonTextDisabled: {
    color: theme.colors.textLight,
  },
});

export default CookingSteps; 