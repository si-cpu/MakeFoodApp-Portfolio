import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Platform, StatusBar, Dimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ProgressBar, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Button from '../../components/common/Button';
import { userService } from '../../api/services/user';
import { ingredientService } from '../../api/services/ingredient';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setUser } from '../../store/slices/authSlice';
import { setIngredients as setIngredientsRedux } from '../../store/slices/ingredientSlice';
import Header from '../../components/common/Header';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import UserStep1 from './UserStep1';
import UserStep2 from './UserStep2';
import UserStep3 from './UserStep3';
import UserStep4 from './UserStep4';
import UserStep5 from './UserStep5';
import { RecipeCategory } from '../../types/recipe';

const { width } = Dimensions.get('window');

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

const UserProfileEditScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth.user);
  
  // 단계 관리
  const [step, setStep] = useState(1); // 1~5
  
  // 개별 상태 관리
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [age, setAge] = useState('');
  const [householdSize, setHouseholdSize] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<RecipeCategory[]>([]);
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbohydrates, setCarbohydrates] = useState('');
  
  // 기타 상태
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [preferenceSearch, setPreferenceSearch] = useState('');
  const [dislikeSearch, setDislikeSearch] = useState('');
  const [allergySearch, setAllergySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [presetIdx, setPresetIdx] = useState<number | null>(null);
  const [isNameChecked, setIsNameChecked] = useState(true);
  const isNameCheckedRef = useRef(true);
  
  // isNameChecked 상태와 ref 동기화
  useEffect(() => {
    isNameCheckedRef.current = isNameChecked;
  }, [isNameChecked]);
  
  // 재료 목록 로드
  useEffect(() => {
    loadIngredients();
  }, []);
  
  const loadIngredients = async () => {
    try {
      const response = await ingredientService.getAllIngredients();
      if (response.data) {
        setIngredients(response.data.map(ingredient => ({
          id: ingredient.id.toString(),
          name: ingredient.name,
          unit: ingredient.unit,
        })));
        dispatch(setIngredientsRedux(response.data.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
        }))));
      }
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    }
  };
  
  // 콜백 함수들을 메모이제이션
  const handleNicknameChange = useCallback((v: string) => {
    setName(v);
    
    // 기존 닉네임과 다르면 중복확인 필요
    if (v !== originalName) {
      setIsNameChecked(false);
    } else {
      setIsNameChecked(true);
    }
  }, [originalName]);

  const handleHouseholdChange = useCallback((v: string) => {
    setHouseholdSize(v);
  }, []);

  const handleAgeChange = useCallback((v: string) => {
    setAge(v);
  }, []);

  const handleGenderChange = useCallback((v: 'MALE' | 'FEMALE' | 'OTHER') => {
    setGender(v);
  }, []);

  const handleToolsChange = useCallback((v: string[]) => {
    setTools(v);
  }, []);

  const handlePreferencesChange = useCallback((v: string[]) => {
    setPreferences(v);
  }, []);

  const handleDislikesChange = useCallback((v: string[]) => {
    setDislikes(v);
  }, []);

  const handleAllergiesChange = useCallback((v: string[]) => {
    setAllergies(v);
  }, []);

  const handlePreferredCategoriesChange = useCallback((v: RecipeCategory[]) => {
    setPreferredCategories(v);
  }, []);

  const handleCaloriesChange = useCallback((v: string) => {
    setCalories(v);
  }, []);

  const handleProteinChange = useCallback((v: string) => {
    setProtein(v);
  }, []);

  const handleFatChange = useCallback((v: string) => {
    setFat(v);
  }, []);

  const handleCarbohydratesChange = useCallback((v: string) => {
    setCarbohydrates(v);
  }, []);

  const handlePresetSelect = useCallback((idx: number) => {
    setPresetIdx(idx);
    const nutritionPresets = [
      { carbohydrates: 50, protein: 20, fat: 30 },
      { carbohydrates: 30, protein: 40, fat: 30 },
      { carbohydrates: 50, protein: 35, fat: 15 },
      { carbohydrates: 10, protein: 20, fat: 70 },
    ];
    const preset = nutritionPresets[idx];
    if (preset) {
      setCarbohydrates(preset.carbohydrates.toString());
      setProtein(preset.protein.toString());
      setFat(preset.fat.toString());
    }
  }, []);

  // 사용자 정보 로드
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const userResponse = await userService.getMyInfo();
      const userInfo = userResponse.data;
      if (userInfo) {
        setName(userInfo.name || '');
        setOriginalName(userInfo.name || '');
        setGender((userInfo.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE');
        setAge(userInfo.age?.toString() || '');
        setHouseholdSize(userInfo.householdSize?.toString() || '');
        setPreferences(userInfo.preferences.map(p => p.name) || []);
        setDislikes(userInfo.dislikes.map((d: any) => d.name) || []);
        setAllergies(userInfo.allergies.map((a: any) => a.name) || []);
        setPreferredCategories(userInfo.preferredCategories.map((c: any) => c.name) || []);
        setCalories(userInfo.nutritionPreference?.calories?.toString() || '2000');
        setProtein(userInfo.nutritionPreference?.protein?.toString() || '');
        setFat(userInfo.nutritionPreference?.fat?.toString() || '');
        setCarbohydrates(userInfo.nutritionPreference?.carbohydrates?.toString() || '');
        setIsNameChecked(true);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      Alert.alert('오류', '사용자 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckName = async (nickname?: string) => {
    const trimmedName = (nickname || name)?.trim() ?? '';
    
    console.log('🔍 중복확인 시작:', { nickname, name, trimmedName });
    
    // 한글 자모 분리 여부 체크
    const hasIncompleteChar = /[\u1100-\u11FF\u3130-\u318F]/.test(trimmedName);
    if (hasIncompleteChar) {
      Alert.alert('입력 오류', '한글 입력을 완성해 주세요.');
      return;
    }
    
    if (trimmedName.length < 3) {
      Alert.alert('입력 오류', '닉네임은 3글자 이상 입력해주세요.');
      return;
    }

    // 특수문자 검사 (한글, 영문, 숫자만 허용)
    const validCharRegex = /^[가-힣a-zA-Z0-9\s]+$/;
    if (!validCharRegex.test(trimmedName)) {
      Alert.alert('입력 오류', '닉네임은 한글, 영문, 숫자만 사용 가능합니다.');
      return;
    }

    try {
      console.log('🌐 API 호출:', trimmedName);
      const res = await userService.checkName(trimmedName);
      console.log('📡 API 응답:', res.data);
      
      if (!res.data) {
        Alert.alert('사용 가능', '사용 가능한 닉네임입니다.');
        setIsNameChecked(true);
        // 전달받은 닉네임이 있으면 그것으로 업데이트
        if (nickname && name !== trimmedName) {
          setName(trimmedName);
        }
      } else {
        Alert.alert('사용 불가', '이미 사용 중인 닉네임입니다.');
        setIsNameChecked(false);
      }
    } catch (e) {
      console.error('닉네임 중복 확인 실패:', e);
      Alert.alert('오류', '중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleNext = useCallback(() => {
    if (step < 5) {
      setStep(step + 1);
    }
  }, [step]);

  const handlePrevious = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const handleSave = async () => {
    if (!householdSize || !age) {
      Alert.alert('입력 오류', '가구원 수와 나이를 입력해주세요.');
      return;
    }
    
    if (!isNameChecked) {
      Alert.alert('중복확인 필요', '닉네임 중복확인을 완료해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const mapNames = (names: string[]) =>
        names.map(n => {
          const ingredient = ingredients.find(ing => ing.name === n);
          return ingredient ? { id: ingredient.id, name: ingredient.name } : { id: '', name: n };
        });
      
      await userService.saveUserInfo({
        id: '',
        name: name,
        gender: gender,
        age: Number(age),
        householdSize: Number(householdSize),
        onboarded: true,
        newUser: false,
        tools: mapNames(tools),
        preferences: mapNames(preferences),
        dislikes: mapNames(dislikes),
        allergies: mapNames(allergies),
        preferredCategories: preferredCategories,
        nutritionPreference: {
          calories: Number(calories) || 2000,
          protein: Number(protein) || 20,
          fat: Number(fat) || 30,
          carbohydrates: Number(carbohydrates) || 50,
        },
      } as any);

      if (currentUser) {
        dispatch(setUser({
          ...currentUser,
          name: name,
        } as any));
      }
      
      Alert.alert('저장 완료', '정보가 수정되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('저장 실패', '정보 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 단계별 유효성 검사
  const isNameUnchanged = name === originalName;
  const isStep1Valid = name.trim().length >= 3 && (isNameUnchanged || isNameChecked);
  const isStep2Valid = householdSize && age;
  const isStep3Valid = true; // 성별은 기본값이 있으므로 항상 유효
  const isStep4Valid = true; // 재료 선택은 선택사항
  const isStep5Valid = calories && protein && fat && carbohydrates;

  // 각 단계에서 다음 버튼 활성화 조건
  const canProceed = () => {
    switch (step) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      case 4:
        return isStep4Valid;
      case 5:
        return isStep5Valid;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <UserStep1
            name={name}
            originalName={originalName}
            onNicknameChange={handleNicknameChange}
            onCheckName={handleCheckName}
            isNameChecked={isNameChecked}
          />
        );
      case 2:
        return (
          <UserStep2
            householdSize={householdSize}
            age={age}
            onHouseholdChange={handleHouseholdChange}
            onAgeChange={handleAgeChange}
          />
        );
      case 3:
        return (
          <UserStep3
            gender={gender}
            tools={tools}
            onGenderChange={handleGenderChange}
            onToolsChange={handleToolsChange}
            ingredients={ingredients}
          />
        );
      case 4:
        return (
          <UserStep4
            preferences={preferences}
            dislikes={dislikes}
            allergies={allergies}
            preferredCategories={preferredCategories}
            preferenceSearch={preferenceSearch}
            dislikeSearch={dislikeSearch}
            allergySearch={allergySearch}
            ingredients={ingredients}
            onPreferencesChange={handlePreferencesChange}
            onDislikesChange={handleDislikesChange}
            onAllergiesChange={handleAllergiesChange}
            onPreferredCategoriesChange={handlePreferredCategoriesChange}
            onPreferenceSearchChange={setPreferenceSearch}
            onDislikeSearchChange={setDislikeSearch}
            onAllergySearchChange={setAllergySearch}
          />
        );
      case 5:
        return (
          <UserStep5
            calories={calories}
            protein={protein}
            fat={fat}
            carbohydrates={carbohydrates}
            presetIdx={presetIdx}
            onCaloriesChange={handleCaloriesChange}
            onProteinChange={handleProteinChange}
            onFatChange={handleFatChange}
            onCarbohydratesChange={handleCarbohydratesChange}
            onPresetSelect={handlePresetSelect}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return '기본 정보';
      case 2:
        return '가구 정보';
      case 3:
        return '개인 정보';
      case 4:
        return '재료 선호도';
      case 5:
        return '영양 비율';
      default:
        return '';
    }
  };

  return (
      <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <Header
          title="프로필 수정"
          showBackButton
          onBackPress={() => navigation.goBack()}
          titleStyle={styles.headerTitle}
          style={styles.header}
        />

        {/* 진행률 표시 */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {step}단계 / 5단계
            </Text>
            <Text style={styles.progressSubtitle}>
              {getStepTitle()}
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <ProgressBar
              progress={step / 5}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <View style={styles.progressSteps}>
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <View
                  key={stepNumber}
                  style={[
                    styles.progressStep,
                    stepNumber <= step && styles.progressStepActive
                  ]}
                >
                  {stepNumber < step ? (
                    <Ionicons name="checkmark" size={12} color={theme.colors.white} />
                  ) : (
                    <Text style={[
                      styles.progressStepText,
                      stepNumber <= step && styles.progressStepTextActive
                    ]}>
                      {stepNumber}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 메인 콘텐츠 */}
        <KeyboardAwareScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      > 
        <View style={styles.contentContainer}>
          {renderStep()}
                </View>
      </KeyboardAwareScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomContainer}>
        <Card style={styles.buttonCard}>
          <Card.Content style={styles.buttonContent}>
            <View style={styles.buttonRow}>
              {step > 1 && (
                  <Button
                  title="이전"
                  onPress={handlePrevious}
                    variant="outline"
                  style={styles.previousButton}
                  textStyle={styles.previousButtonText}
                  />
              )}
              
              {step < 5 ? (
                <Button
                  title="다음"
                  onPress={handleNext}
                  variant="primary"
                  style={StyleSheet.flatten([styles.nextButton, step === 1 && styles.fullWidthButton])}
                  disabled={!canProceed()}
                />
              ) : (
                <Button
                  title="저장하기"
                  onPress={handleSave}
                  variant="primary"
                  style={styles.nextButton}
                  disabled={!canProceed()}
                />
              )}
            </View>
              </Card.Content>
            </Card>
          </View>

        {loading && (
          <LoadingIndicator />
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    backgroundColor: theme.colors.white,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    ...theme.shadows.sm,
    zIndex: 1,
  },
  header: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
  },
  progressSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  progressHeader: {
    marginBottom: theme.spacing.md,
  },
  progressTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  progressSubtitle: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  progressBarContainer: {
    position: 'relative',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: -9,
    left: 0,
    right: 0,
    paddingHorizontal: 2,
  },
  progressStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  progressStepActive: {
    backgroundColor: theme.colors.primary,
  },
  progressStepText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textSecondary,
  },
  progressStepTextActive: {
    color: theme.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  contentContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  bottomContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
  },
  buttonCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.white,
    ...theme.shadows.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  previousButton: {
    flex: 1,
    height: 52,
  },
  previousButtonText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.medium,
  },
  nextButton: {
    flex: 1,
    height: 52,
  },
  fullWidthButton: {
    flex: 2, // 이전 버튼이 없을 때 더 넓게
  },
});

// React DevTools
UserProfileEditScreen.whyDidYouRender = true;

export default UserProfileEditScreen; 