import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Image, TouchableOpacity, Alert, StatusBar, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Dialog, Portal, IconButton, Chip, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme/theme';
import { ingredientService } from '../../api/services/ingredient';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setIngredients as setReduxIngredients } from '../../store/slices/ingredientSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inventoryService } from '../../api/services/inventory';
import { InventoryDto } from '../../types/inventory';
import { recipeService } from '../../api/services/recipe';
import { uploadToS3, UploadProgress } from '../../utils/s3Upload';
import S3UploadImage from '../../components/common/S3UploadImage';
import Header from '../../components/common/Header';

// 레시피 생성 관련 타입들
interface RecipeIngredient {
  ingredientId: number;
  amount: number;
  unit: string;
  name?: string; // 표시용
}

interface RecipeStep {
  stepNumber: number;
  description: string;
  imageUrl?: string;
}

// 임시저장 데이터 타입
interface DraftData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  difficulty: Difficulty;
  category: RecipeCategory;
  cookingTime: number;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  savedAt: string;
}

enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

enum RecipeCategory {
  KOREAN = 'KOREAN',
  WESTERN = 'WESTERN',
  CHINESE = 'CHINESE',
  JAPANESE = 'JAPANESE',
  DESSERT = 'DESSERT',
  OTHER = 'OTHER',
  HEALTHY = 'HEALTHY',
  VEGETARIAN = 'VEGETARIAN',
  FUSION = 'FUSION'
}

const MyRecipeEditScreen = ({ navigation }: any) => {
  // 기본 정보
  const [imageUrl, setImageUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [category, setCategory] = useState<RecipeCategory>(RecipeCategory.KOREAN);
  const [cookingTime, setCookingTime] = useState<number>(30);
  const [servings, setServings] = useState<number>(2);
  
  // 재료, 단계
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [steps, setSteps] = useState<RecipeStep[]>([{ stepNumber: 1, description: '', imageUrl: '' }]);
  
  // 모달 및 UI 상태
  const [ingredientModal, setIngredientModal] = useState(false);
  const [editIngredientModal, setEditIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RecipeIngredient | null>(null);
  const [draftModal, setDraftModal] = useState(false);
  const [ingredientAmount, setIngredientAmount] = useState('1');
  const [ingredientUnit, setIngredientUnit] = useState('개');
  const [savedDrafts, setSavedDrafts] = useState<DraftData[]>([]);
  
  // S3 업로드 관련 상태
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [stepUploadProgress, setStepUploadProgress] = useState<Record<number, UploadProgress>>({});
  
  const dispatch = useAppDispatch();
  const reduxIngredients = useAppSelector(state => state.ingredient.ingredients);
  const [allIngredients, setAllIngredients] = useState(reduxIngredients);
  const [newIngredient, setNewIngredient] = useState('');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [ingredientTab, setIngredientTab] = useState<'inventory' | 'all'>('inventory');
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<any>(null);

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
  }, []);

  // Load inventory items once
  useEffect(() => {
    (async () => {
      try {
        const res = await inventoryService.getInventory();
        setInventoryItems(res.data?.items || []);
      } catch (_) {}
    })();
  }, []);

  // 임시저장 목록 로드
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const draftsJson = await AsyncStorage.getItem('myRecipeDrafts');
      if (draftsJson) {
        const drafts: DraftData[] = JSON.parse(draftsJson);
        setSavedDrafts(drafts.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
      }
    } catch (error) {
      console.error('임시저장 목록 로드 실패:', error);
    }
  };

  // 사진 선택/촬영
  const pickImage = async (fromCamera: boolean) => {
    let result;
    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    }
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      try {
        // S3에 이미지 업로드 (메인 레시피 이미지)
        const s3Url = await uploadToS3(asset.uri, 'recipe', (progress) => {
          setUploadProgress(progress);
        });
        
        setImageUrl(s3Url);
        setUploadProgress(null);
        Alert.alert('완료', '이미지가 업로드되었습니다.');
      } catch (error) {
        setUploadProgress(null);
        console.error('이미지 업로드 실패:', error);
        Alert.alert('업로드 실패', '이미지 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  // 재료 추가
  const handleAddIngredient = (ing: any) => {
    const amount = parseFloat(ingredientAmount) || 1;
    // Redux에서 해당 재료의 정보 찾기
    const ingredientInfo = reduxIngredients.find(item => Number(item.id) === ing.id);
    const unit = ingredientInfo?.unit || '개';
    
    if (!ingredients.some(i => i.ingredientId === ing.id)) {
      const newIngredient: RecipeIngredient = {
        ingredientId: ing.id,
        amount: amount,
        unit: unit,
        name: ing.name
      };
      setIngredients([...ingredients, newIngredient]);
    }
    setIngredientModal(false);
    setIngredientAmount('1');
    setIngredientUnit(unit);
  };

  // 재료 삭제
  const handleRemoveIngredient = (ingredientId: number) => {
    setIngredients(ingredients.filter(ing => ing.ingredientId !== ingredientId));
  };

  // 재료 수정
  const handleEditIngredient = (ingredientId: number, newAmount: number, newUnit: string) => {
    // Redux에서 해당 재료의 정보 찾기
    const ingredientInfo = reduxIngredients.find(item => Number(item.id) === ingredientId);
    const unit = ingredientInfo?.unit || newUnit || '개';
    
    setIngredients(ingredients.map(ing => 
      ing.ingredientId === ingredientId 
        ? { ...ing, amount: newAmount, unit: unit }
        : ing
    ));
  };

  // 단계 텍스트 변경
  const handleStepChange = (idx: number, text: string) => {
    const arr = [...steps];
    arr[idx].description = text;
    setSteps(arr);
  };

  // 단계 이미지 선택
  const pickStepImage = async (idx: number, fromCamera: boolean) => {
    let result;
    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    }
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      try {
        // S3에 이미지 업로드 (단계별 이미지)
        const s3Url = await uploadToS3(asset.uri, 'step', (progress) => {
          setStepUploadProgress(prev => ({ ...prev, [idx]: progress }));
        });
        
        const arr = [...steps];
        arr[idx].imageUrl = s3Url;
        setSteps(arr);
        
        // 업로드 완료 후 진행률 초기화
        setStepUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[idx];
          return newProgress;
        });
        
        Alert.alert('완료', '단계 이미지가 업로드되었습니다.');
      } catch (error) {
        // 업로드 실패 시 진행률 초기화
        setStepUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[idx];
          return newProgress;
        });
        
        console.error('단계 이미지 업로드 실패:', error);
        Alert.alert('업로드 실패', '이미지 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  const handleAddStep = () => {
    const newStep: RecipeStep = {
      stepNumber: steps.length + 1,
      description: '',
      imageUrl: ''
    };
    setSteps([...steps, newStep]);
  };

  // 단계 삭제
  const handleRemoveStep = (idx: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== idx);
      // 단계 번호 재정렬
      const reorderedSteps = newSteps.map((step, index) => ({
        ...step,
        stepNumber: index + 1
      }));
      setSteps(reorderedSteps);
    }
  };

  // 관리자 승인 요청(저장 요청)
  const handleRequestApproval = async () => {
    if (!title.trim() || !description.trim() || ingredients.length === 0 || 
        steps.some(s => !s.description.trim())) {
      Alert.alert('입력 확인', '모든 필수 항목을 입력해 주세요.');
      return;
    }

    try {
      // RecipeCreateDto 구조에 맞게 payload 생성
      const payload = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl || undefined,
        difficulty,
        category,
        cookingTime,
        servings,
        ingredients: ingredients.map(ing => ({
          ingredientId: ing.ingredientId,
          amount: ing.amount,
          unit: ing.unit
        })),
        steps: steps.map(step => ({
          stepNumber: step.stepNumber,
          description: step.description,
          imageUrl: step.imageUrl || undefined
        })),
        nutrition: undefined, // 추후 구현
        status: 'PENDING', // 관리자 승인 대기
        cookingMethod: 'OTHER' as const, // 기본값
        estimatedTimeMinutes: cookingTime // cookingTime과 동일
      };

      await recipeService.createRecipe(payload as any);

      Alert.alert('저장 요청 완료', '관리자 검토 후 등록됩니다.', [
        { text: '확인', onPress: () => navigation.navigate('MainTabs') }
      ]);
    } catch (error) {
      console.error('저장 요청 실패', error);
      Alert.alert('오류', '저장 요청 중 오류가 발생했습니다.');
    }
  };

  const handleTempSave = async () => {
    try {
      const now = new Date();
      const draftId = `draft_${now.getTime()}`;
      const draftTitle = title.trim() || `임시저장 ${now.toLocaleString('ko-KR')}`;
      
      const newDraft: DraftData = {
        id: draftId,
        title: draftTitle,
        description,
        imageUrl,
        difficulty,
        category,
        cookingTime,
        servings,
        ingredients,
        steps,
        savedAt: now.toISOString()
      };

      // 기존 임시저장 목록 가져오기
      const draftsJson = await AsyncStorage.getItem('myRecipeDrafts');
      let drafts: DraftData[] = draftsJson ? JSON.parse(draftsJson) : [];
      
      // 새 임시저장 추가
      drafts.unshift(newDraft);
      
      // 최대 5개로 제한
      if (drafts.length > 5) {
        drafts = drafts.slice(0, 5);
      }
      
      // 저장
      await AsyncStorage.setItem('myRecipeDrafts', JSON.stringify(drafts));
      setSavedDrafts(drafts);
      
      Alert.alert('임시저장', '초안이 저장되었습니다.', [
        { text: '확인', onPress: () => navigation.navigate('MainTabs') }
      ]);
    } catch (e) {
      Alert.alert('저장 실패', '임시저장에 실패했습니다.');
    }
  };

  // 임시저장 불러오기
  const handleLoadDraft = (draft: DraftData) => {
    Alert.alert(
      '임시저장 불러오기',
      '현재 작성 중인 내용이 있다면 사라집니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '불러오기',
          onPress: () => {
            setTitle(draft.title);
            setDescription(draft.description);
            setImageUrl(draft.imageUrl);
            setDifficulty(draft.difficulty);
            setCategory(draft.category);
            setCookingTime(draft.cookingTime);
            setServings(draft.servings);
            setIngredients(draft.ingredients);
            setSteps(draft.steps);
            setDraftModal(false);
            Alert.alert('완료', '임시저장된 내용을 불러왔습니다.');
          }
        }
      ]
    );
  };

  // 임시저장 삭제
  const handleDeleteDraft = async (draftId: string) => {
    Alert.alert(
      '임시저장 삭제',
      '선택한 임시저장을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
              await AsyncStorage.setItem('myRecipeDrafts', JSON.stringify(updatedDrafts));
              setSavedDrafts(updatedDrafts);
              Alert.alert('완료', '임시저장이 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Header
        title="나만의 레시피"
        showBackButton
        onBackPress={() => navigation.goBack()}
        titleStyle={styles.headerTitle}
        actions={[
          {
            icon: 'folder-open-outline',
            onPress: () => setDraftModal(true),
          }
        ]}
      />
      
      <ScrollView contentContainerStyle={styles.container}>
      {/* 사진 */}
      <View style={styles.imageBox}>
        <S3UploadImage
          imageUri={imageUrl}
          uploadProgress={uploadProgress}
          style={styles.image}
        />
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <Button 
            mode="outlined" 
            onPress={() => pickImage(true)} 
            style={styles.photoBtn} 
            textColor="#ff9800"
            disabled={!!uploadProgress}
          >
            사진 촬영
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => pickImage(false)} 
            style={styles.photoBtn} 
            textColor="#ff9800"
            disabled={!!uploadProgress}
          >
            앨범에서 선택
          </Button>
        </View>
      </View>

      {/* 기본 정보 카드 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>기본 정보</Text>
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="레시피 제목 *"
            style={styles.modernInput}
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="레시피 설명 *"
            style={[styles.modernInput, { height: 80 }]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Card.Content>
      </Card>

      {/* 레시피 설정 카드 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>레시피 설정</Text>
          </View>
          
          <Text style={styles.sectionTitle}>난이도 *</Text>
          <View style={styles.optionRow}>
            {Object.values(Difficulty).map(diff => (
              <TouchableOpacity
                key={diff}
                style={[styles.modernOptionChip, difficulty === diff && styles.modernOptionChipSelected]}
                onPress={() => setDifficulty(diff)}
              >
                <Text style={[styles.modernOptionText, difficulty === diff && styles.modernOptionTextSelected]}>
                  {diff === 'EASY' ? '쉬움' : diff === 'MEDIUM' ? '보통' : '어려움'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>카테고리 *</Text>
          <View style={styles.optionRow}>
            {Object.values(RecipeCategory).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.modernOptionChip, category === cat && styles.modernOptionChipSelected]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.modernOptionText, category === cat && styles.modernOptionTextSelected]}>
                  {cat === 'KOREAN' ? '한식' : cat === 'WESTERN' ? '양식' : 
                   cat === 'CHINESE' ? '중식' : cat === 'JAPANESE' ? '일식' :
                   cat === 'DESSERT' ? '디저트' : cat === 'OTHER' ? '기타' :
                   cat === 'HEALTHY' ? '건강식' : cat === 'VEGETARIAN' ? '채식' : '퓨전'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inlineRow}>
            <View style={styles.inlineItem}>
              <Text style={styles.sectionTitle}>조리시간 *</Text>
              <TextInput
                value={cookingTime.toString()}
                onChangeText={(text) => setCookingTime(parseInt(text) || 0)}
                placeholder="30"
                style={styles.modernInput}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inlineItem}>
              <Text style={styles.sectionTitle}>인분 *</Text>
              <TextInput
                value={servings.toString()}
                onChangeText={(text) => setServings(parseInt(text) || 0)}
                placeholder="2"
                style={styles.modernInput}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card.Content>
      </Card>
      {/* 재료 */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>재료 *</Text>
        <Button mode="text" onPress={() => setIngredientModal(true)} textColor="#ff9800">재료 추가</Button>
      </View>
      <View style={styles.ingredientList}>
        {ingredients.map(ing => (
          <View key={ing.ingredientId} style={styles.ingredientItem}>
            <View style={styles.ingredientInfo}>
              <Text style={styles.ingredientName}>{ing.name}</Text>
              <Text style={styles.ingredientAmount}>{ing.amount}{ing.unit}</Text>
            </View>
            <View style={styles.ingredientActions}>
              <IconButton
                icon="pencil-outline"
                size={20}
                onPress={() => {
                  setEditingIngredient(ing);
                  setEditIngredientModal(true);
                }}
              />
              <IconButton
                icon="trash-can-outline"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => handleRemoveIngredient(ing.ingredientId)}
              />
            </View>
          </View>
        ))}
      </View>

      {/* 단계 */}
      <Text style={styles.sectionTitle}>만드는 순서 *</Text>
      {steps.map((step, idx) => (
        <View key={idx} style={styles.stepRow}>
          <Text style={styles.stepNum}>{step.stepNumber}</Text>
          <S3UploadImage
            imageUri={step.imageUrl}
            uploadProgress={stepUploadProgress[idx]}
            style={styles.stepPreview}
            containerStyle={{ marginRight: 8 }}
          />
          <View style={{ flex: 1 }}>
            <TextInput
              value={step.description}
              onChangeText={text => handleStepChange(idx, text)}
              placeholder={`단계 ${step.stepNumber} 설명`}
              style={styles.stepInput}
              multiline
            />
            <View style={styles.stepActionRow}>
              <IconButton 
                icon="camera" 
                size={20} 
                onPress={() => pickStepImage(idx, true)}
                disabled={!!stepUploadProgress[idx]}
              />
              <IconButton 
                icon="image" 
                size={20} 
                onPress={() => pickStepImage(idx, false)}
                disabled={!!stepUploadProgress[idx]}
              />
              <Button mode="text" onPress={() => handleRemoveStep(idx)} textColor="#d32f2f">삭제</Button>
            </View>
          </View>
        </View>
      ))}
      <Button mode="outlined" onPress={handleAddStep} style={styles.addStepBtn} textColor="#ff9800">단계 추가</Button>
      {/* 저장 버튼 */}
      <View style={styles.btnRow}>
        <Button mode="outlined" onPress={handleTempSave} style={styles.tempBtn} textColor="#ff9800">임시저장</Button>
        <Button mode="contained" onPress={handleRequestApproval} style={styles.saveBtn} buttonColor="#ffb74d" labelStyle={{ fontWeight: 'bold', fontSize: 16 }}>관리자에게 요청하기</Button>
      </View>

      {/* 재료 선택 모달 */}
      <Portal>
        <Dialog visible={ingredientModal} onDismiss={() => setIngredientModal(false)} style={styles.dialog}>
          <Dialog.Content style={styles.modernModalContent}>
            {/* 컴팩트 헤더 */}
            <View style={styles.compactHeader}>
              <Ionicons name="restaurant" size={20} color={theme.colors.primary} />
              <Text style={styles.compactTitle}>재료 선택</Text>
            </View>

            {/* 재료 선택 섹션 */}
            <View style={styles.compactSection}>
              <Text style={styles.compactLabel}>
                <Ionicons name="restaurant" size={14} color={theme.colors.primary} /> 재료 선택
              </Text>

              {/* 탭 선택 */}
              <View style={styles.tabRow}>
                <Chip selected={ingredientTab==='inventory'} onPress={()=>setIngredientTab('inventory')} style={styles.tabChip}>내 인벤토리</Chip>
                <Chip selected={ingredientTab==='all'} onPress={()=>setIngredientTab('all')} style={styles.tabChip}>전체 재료</Chip>
              </View>

              {ingredientTab==='all' && (
                <TextInput
                  placeholder="재료명을 검색하세요"
                  onChangeText={(text) => {
                    setSearchInputValue(text);
                    setNewIngredient(text);
                    setIsSearching(true);
                    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                    searchDebounceRef.current = setTimeout(() => {
                      setIsSearching(false);
                    }, 300);
                  }}
                  style={[
                    styles.ingredientSearchBar,
                    {
                      fontSize: 16,
                      color: theme.colors.text,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: theme.colors.white,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }
                  ]}
                  placeholderTextColor={theme.colors.textLight}
                  autoComplete="off"
                  autoCorrect={false}
                  spellCheck={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                  returnKeyType="search"
                  blurOnSubmit
                  textContentType="none"
                  keyboardType="default"
                  onSubmitEditing={() => {
                    const filteredItems = allIngredients.filter(ing => 
                      ing.name.toLowerCase().includes(newIngredient.toLowerCase())
                    );
                    if (filteredItems.length > 0) {
                      setSelectedIngredient(filteredItems[0]);
                    }
                  }}
                />
              )}

              <ScrollView style={{ maxHeight: 200 }}>
                {ingredientTab==='inventory' ? (
                  inventoryItems.map(inv => {
                    const ingredient = { id: inv.ingredient?.id || inv.id, name: inv.ingredient?.name || inv.itemName, unit: inv.ingredient.unit || inv.unit };
                    const isSelected = selectedIngredient?.id === ingredient.id;
                    return (
                      <TouchableOpacity 
                        key={`inv-${inv.id}`} 
                        onPress={() => {
                          setSelectedIngredient(ingredient);
                        }} 
                        style={[
                          styles.ingredientSelectRow, 
                          { backgroundColor: isSelected ? '#e8f5e9' : '#f1f8e9'}
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                          <Text style={{ fontSize: 16 }}>{inv.ingredient?.name || inv.itemName} ({inv.quantity}{inv.ingredient?.unit || inv.unit})</Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  allIngredients.filter(ing => ing.name.toLowerCase().includes(newIngredient.toLowerCase())).map(ing => {
                    const isSelected = selectedIngredient?.id === ing.id;
                    return (
                      <TouchableOpacity 
                        key={ing.id} 
                        onPress={() => {
                          setSelectedIngredient(ing);
                        }} 
                        style={[
                          styles.ingredientSelectRow,
                          { backgroundColor: isSelected ? '#e8f5e9' : theme.colors.background }
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                          <Text style={{ fontSize: 16 }}>{ing.name}</Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
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
                    const current = Number(ingredientAmount);
                    if (current > 1) {
                      setIngredientAmount(String(current - 1));
                    }
                  }}
                  disabled={Number(ingredientAmount) <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={20} 
                    color={Number(ingredientAmount) <= 1 ? theme.colors.textLight : theme.colors.primary} 
                  />
                </TouchableOpacity>
                
                <View style={styles.quantityDisplay}>
                  <TextInput
                    value={ingredientAmount}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '');
                      setIngredientAmount(numericText || '1');
                    }}
                    keyboardType="number-pad"
                    style={styles.quantityInput}
                  />
                  <Text style={styles.quantityUnit}>{ingredientUnit}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const current = Number(ingredientAmount);
                    setIngredientAmount(String(current + 1));
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 버튼 */}
            <View style={styles.modernButtons}>
              <TouchableOpacity
                style={styles.modernCancelButton}
                onPress={() => {
                  setIngredientModal(false);
                  setIngredientAmount('1');
                  setIngredientUnit('개');
                }}
              >
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.modernCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modernConfirmButton]}
                onPress={() => handleAddIngredient(selectedIngredient)}
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
          </Dialog.Content>
        </Dialog>

        {/* 임시저장 목록 모달 */}
        <Dialog visible={draftModal} onDismiss={() => setDraftModal(false)} style={[styles.dialog, { maxHeight: '80%' }]}>
          <Dialog.Title style={{ paddingRight: 40 }}>임시저장 목록</Dialog.Title>
          <IconButton icon="close" size={20} onPress={() => setDraftModal(false)} style={styles.dialogCloseBtn} />
          <Dialog.Content>
            {savedDrafts.length === 0 ? (
              <View style={styles.emptyDraftContainer}>
                <Text style={styles.emptyDraftText}>임시저장된 레시피가 없습니다.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {savedDrafts.map((draft) => (
                  <View key={draft.id} style={styles.draftItem}>
                    <TouchableOpacity 
                      style={styles.draftContent} 
                      onPress={() => handleLoadDraft(draft)}
                    >
                      <Text style={styles.draftTitle} numberOfLines={1}>
                        {draft.title}
                      </Text>
                      <Text style={styles.draftDescription} numberOfLines={2}>
                        {draft.description || '설명 없음'}
                      </Text>
                      <Text style={styles.draftDate}>
                        {new Date(draft.savedAt).toLocaleString('ko-KR')}
                      </Text>
                      <View style={styles.draftMeta}>
                        <Text style={styles.draftMetaText}>
                          재료 {draft.ingredients.length}개 • 단계 {draft.steps.length}개
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <IconButton 
                      icon="delete" 
                      size={20} 
                      onPress={() => handleDeleteDraft(draft.id)}
                      iconColor="#d32f2f"
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </Dialog.Content>
        </Dialog>

        {/* 재료 수정 모달 */}
        <Modal
          visible={editIngredientModal}
          onDismiss={() => setEditIngredientModal(false)}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>수량</Text>
            <View style={styles.amountContainer}>
              <IconButton
                icon="minus"
                onPress={() => {
                  if (editingIngredient) {
                    const newAmount = Math.max(1, (editingIngredient.amount || 1) - 1);
                    setEditingIngredient({ ...editingIngredient, amount: newAmount });
                  }
                }}
              />
              <TextInput
                style={styles.amountInput}
                value={editingIngredient?.amount?.toString() || '1'}
                onChangeText={(text) => {
                  if (editingIngredient) {
                    const newAmount = parseFloat(text) || 0;
                    setEditingIngredient({ ...editingIngredient, amount: newAmount });
                  }
                }}
                keyboardType="numeric"
              />
              <IconButton
                icon="plus"
                onPress={() => {
                  if (editingIngredient) {
                    const newAmount = (editingIngredient.amount || 1) + 1;
                    setEditingIngredient({ ...editingIngredient, amount: newAmount });
                  }
                }}
              />
              <Text style={styles.unitText}>
                {editingIngredient ? reduxIngredients.find(item => Number(item.id) === editingIngredient.ingredientId)?.unit || '개' : '개'}
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setEditIngredientModal(false)}>
                취소
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  if (editingIngredient) {
                    const ingredientInfo = reduxIngredients.find(item => Number(item.id) === editingIngredient.ingredientId);
                    handleEditIngredient(
                      editingIngredient.ingredientId,
                      editingIngredient.amount || 1,
                      ingredientInfo?.unit || '개'
                    );
                    setEditIngredientModal(false);
                  }
                }}
              >
                수정하기
              </Button>
            </View>
          </View>
        </Modal>

      </Portal>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  imageBox: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.border,
  },
  imagePlaceholder: {
    width: 180,
    height: 180,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtn: {
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.primary,
  },
  card: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  modernInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.medium,
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    fontFamily: theme.typography.fontFamily.regular,
  },
  modernOptionChip: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  modernOptionChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modernOptionText: {
    color: theme.colors.textLight,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.medium,
  },
  modernOptionTextSelected: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.bold,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.medium,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: theme.typography.fontFamily.regular,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.extraBold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  ingredientList: {
    marginBottom: theme.spacing.lg,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  ingredientInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  ingredientName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  ingredientAmount: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.primary,
  },
  ingredientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    color: theme.colors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.medium,
    marginRight: theme.spacing.sm,
  },
  stepInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.medium,
    minHeight: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: theme.typography.fontFamily.regular,
  },
  addStepBtn: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.primary,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  tempBtn: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    borderColor: theme.colors.primary,
  },
  saveBtn: {
    flex: 2,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    backgroundColor: theme.colors.primary,
  },
  dialog: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background,
  },
  ingredientSelectRow: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  newIngredientInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: theme.typography.fontSize.medium,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: theme.typography.fontFamily.regular,
  },
  screenTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.extraBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tabRow: {
    flexDirection:'row',
    justifyContent:'center',
    marginBottom: theme.spacing.sm,
  },
  tabChip:{
    marginHorizontal: theme.spacing.xs,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dialogCloseBtn:{
    position:'absolute',
    right:4,
    top:4,
    zIndex:1,
  },
  stepPreview: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  stepActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  optionChip: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  optionChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    color: theme.colors.textLight,
    fontFamily: theme.typography.fontFamily.medium,
  },
  optionTextSelected: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.bold,
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  inlineItem: {
    flex: 0.48,
  },
  amountRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  draftBtn: {
    borderRadius: theme.borderRadius.md,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  draftContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  draftTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  draftDescription: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  draftDate: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  draftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  draftMetaText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  emptyDraftContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyDraftText: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  // S3 업로드 진행률 스타일
  progressContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  progressText: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  progressPercent: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    textAlign: 'right',
    fontFamily: theme.typography.fontFamily.regular,
  },
  stepProgressContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepProgressText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.regular,
  },
  modernModalContent: {
    padding: theme.spacing.lg,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  compactTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  compactSection: {
    marginBottom: theme.spacing.lg,
  },
  compactLabel: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  compactQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
  },
  quantityButton: {
    padding: theme.spacing.sm,
  },
  quantityDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    fontSize: theme.typography.fontSize.large,
    textAlign: 'center',
    minWidth: 40,
  },
  quantityUnit: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  modernButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.lg,
  },
  modernCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  modernCancelText: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  modernConfirmButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  modernConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modernConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  modernConfirmText: {
    color: theme.colors.white,
    marginLeft: theme.spacing.xs,
  },
  headerTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.bold,
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  modalLabel: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.large,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.lg,
  },
  unitText: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.sm,
  },
  ingredientSearchBar: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default MyRecipeEditScreen; 