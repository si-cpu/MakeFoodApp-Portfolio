import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, LayoutAnimation, Platform, UIManager, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ingredientService } from '../../api/services/ingredient';
import { userService } from '../../api/services/user';
import { RadioButton, Chip, SegmentedButtons, ProgressBar, Card, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeCategory } from '../../types/recipe';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setUser } from '../../store/slices/authSlice';
import { setIngredients as setIngredientsRedux } from '../../store/slices/ingredientSlice';
import Header from '../../components/common/Header';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';

const { width } = Dimensions.get('window');

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

const OnboardingScreen = ({ navigation }: any) => {
  console.log('🚀 OnboardingScreen 리렌더링 발생!');
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth.user);
  
  // 단계 관리
  const [step, setStep] = useState(1); // 1~5
  
  // 개별 상태 관리
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [age, setAge] = useState('');
  const [householdSize, setHouseholdSize] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<RecipeCategory[]>([]);
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbohydrates, setCarbohydrates] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  
  // 기타 상태
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [preferenceSearch, setPreferenceSearch] = useState('');
  const [dislikeSearch, setDislikeSearch] = useState('');
  const [allergySearch, setAllergySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [presetIdx, setPresetIdx] = useState<number | null>(null);
  const [isNameChecked, setIsNameChecked] = useState(false);
  const isNameCheckedRef = useRef(false);
  
  // 닉네임 입력용 ref
  const nicknameInputRef = useRef<TextInput>(null);
  
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
    console.log('🎯 handleNicknameChange 호출됨, 닉네임 입력:', v);
    setName(v);
    if (isNameCheckedRef.current) {
      console.log('🎯 중복확인 상태 초기화');
      setIsNameChecked(false);
    }
  }, []);

  const handleHouseholdChange = useCallback((v: string) => {
    console.log('🏠 가구원 수 변경:', v);
    setHouseholdSize(v);
  }, []);

  const handleAgeChange = useCallback((v: string) => {
    console.log('👶 나이 변경:', v);
    setAge(v);
  }, []);

  const handleGenderChange = useCallback((value: 'MALE' | 'FEMALE' | 'OTHER') => {
    setGender(value);
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

  // 온보딩 상태 복원
  useEffect(() => {
    (async () => {
      const savedStep = await AsyncStorage.getItem('onboardingStep');
      const savedForm = await AsyncStorage.getItem('onboardingFormData');
      if (savedStep) setStep(Number(savedStep));
      if (savedForm) {
        const parsed = JSON.parse(savedForm);
        
        // 개별 상태로 복원
        setName(parsed.name || '');
        setGender(parsed.gender || 'MALE');
        setAge(parsed.age || '');
        setHouseholdSize(parsed.householdSize || '');
        setPreferences(parsed.preferences || []);
        setDislikes(parsed.dislikes || []);
        setAllergies(parsed.allergies || []);
        setPreferredCategories(parsed.preferredCategories || []);
        setCalories(parsed.nutrition?.calories || '2000');
        setProtein(parsed.nutrition?.protein || '');
        setFat(parsed.nutrition?.fat || '');
        setCarbohydrates(parsed.nutrition?.carbohydrates || '');
        setMarketingConsent(parsed.marketingConsent || false);
        setTermsAgreed(parsed.termsAgreed || false);
        setPrivacyAgreed(parsed.privacyAgreed || false);
        
        // 중복확인 상태 복원
        if (parsed.name && parsed.isNameChecked) {
          setIsNameChecked(true);
        }
      }
    })();
  }, []);

  const handleMarketingConsentChange = useCallback((value: boolean) => {
    setMarketingConsent(value);
  }, []);

  const handleTermsAgreedChange = useCallback((value: boolean) => {
    setTermsAgreed(value);
  }, []);

  const handlePrivacyAgreedChange = useCallback((value: boolean) => {
    setPrivacyAgreed(value);
  }, []);

  const handleCheckName = useCallback(async (nickname: string) => {
    console.log('중복확인 버튼 클릭됨!');
    const trimmedName = nickname?.trim() ?? '';
    console.log('검사할 닉네임:', trimmedName);
    
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

    console.log('API 호출 시작...');
    try {
      const res = await userService.checkName(trimmedName);
      console.log('API 응답:', res);
      if (!res.data) {
        Alert.alert('사용 가능', '사용 가능한 닉네임입니다.');
        setIsNameChecked(true);
        
        // 중복확인 성공 시 name 상태 업데이트
        console.log('중복확인 성공 - name 업데이트:', trimmedName);
        setName(trimmedName);
      } else {
        Alert.alert('사용 불가', '이미 사용 중인 닉네임입니다.');
        setIsNameChecked(false);
      }
    } catch (e) {
      console.error('닉네임 중복 확인 실패:', e);
      Alert.alert('오류', '중복 확인 중 오류가 발생했습니다.');
    }
  }, []);

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
        name,
        gender,
        age: Number(age),
        householdSize: Number(householdSize),
        onboarded: true,
        newUser: false,
        tools: [], // tools 제거
        preferences: mapNames(preferences),
        dislikes: mapNames(dislikes),
        allergies: mapNames(allergies),
        preferredCategories,
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
          onboarded: true,
          newUser: false,
        } as any));
      }
      
      // 온보딩 완료 후 임시 저장 데이터 삭제
      await AsyncStorage.removeItem('onboardingFormData');
      await AsyncStorage.removeItem('onboardingStep');
      
      Alert.alert('가입 완료', '온보딩이 완료되었습니다!', [
        { text: '확인', onPress: () => {
          // 온보딩 완료 후에는 메인 화면으로 이동
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }},
      ]);
    } catch (e) {
      Alert.alert('저장 실패', '정보 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 단계별 유효성 검사
  const isStep1Valid = name.trim().length >= 3 && isNameChecked && termsAgreed && privacyAgreed;
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

  const renderStep = () => {
    switch (step) {
      case 1:
  return (
          <Step1
            name={name}
            marketingConsent={marketingConsent}
            termsAgreed={termsAgreed}
            privacyAgreed={privacyAgreed}
            isNameChecked={isNameChecked}
            onNicknameChange={handleNicknameChange}
            onCheckName={handleCheckName}
            onMarketingConsentChange={handleMarketingConsentChange}
            onTermsAgreedChange={handleTermsAgreedChange}
            onPrivacyAgreedChange={handlePrivacyAgreedChange}
            navigation={navigation}
          />
        );
      case 2:
        return (
          <Step2
            householdSize={householdSize}
            age={age}
            onHouseholdChange={handleHouseholdChange}
            onAgeChange={handleAgeChange}
          />
        );
      case 3:
        return (
          <Step3
            gender={gender}
            onGenderChange={handleGenderChange}
          />
        );
      case 4:
        return (
          <Step4
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
          <Step5
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

  return (
      <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <Header
          title="회원가입"
          showBackButton={step > 1}
          onBackPress={() => {
            // 2단계 이상에서만 호출됨 (step > 1일 때만 버튼이 보임)
            setStep(step - 1);
          }}
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
                  title="완료"
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

// 스타일을 UserProfileEditScreen과 동일하게 수정
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

// why-did-you-render 추적 활성화
OnboardingScreen.whyDidYouRender = true;

export default OnboardingScreen; 