import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Alert, RefreshControl, TouchableOpacity, ScrollView, NativeSyntheticEvent, TextInputChangeEventData } from 'react-native';
import { Button, Dialog, Portal, IconButton, Checkbox, Menu, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme/theme';
import { cartService } from '../../api/services/cart';
import { purchaseService } from '../../api/services/purchase';
import { inventoryService } from '../../api/services/inventory';
import { CartItemDto, AddToCartRequest, UpdateCartItemRequest } from '../../types/cart';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import Empty from '../../components/common/Empty';
import Header from '../../components/common/Header';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '../../store/hooks';
import { Ingredient } from '../../types/ingredient';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WebSocketState, OcrResultData } from '../../types/websocket';
import { uploadToS3, UploadProgress } from '../../utils/s3Upload';
import S3UploadImage from '../../components/common/S3UploadImage';
import { useAuth } from '../../hooks/useAuth';

// OCR 텍스트에서 식재료 정보 추출하는 함수
function parseOcrText(ocrResult: any, reduxIngredients: Ingredient[]): Array<{
  name: string; 
  quantity: number; 
  unit: string;
  price: number; 
  ingredientId?: string | number;
}> {
  const ingredients: Array<{
    name: string; 
    quantity: number; 
    unit: string;
    price: number; 
    ingredientId?: string | number;
  }> = [];

  try {
    // 인식된 텍스트에서 식재료명과 가격 정보 추출
    const text = ocrResult.text || '';
    const regions = ocrResult.regions || [];

    // regions에서 식재료명과 가격 정보를 추출
    const foundIngredients = new Map<string, any>();
    
    regions.forEach((region: any, index: number) => {
      const regionText = region.text?.trim();
      if (!regionText) return;

      // 식재료명 찾기 (Redux ingredient와 매칭)
      const matchedIngredient = reduxIngredients.find(ingredient => 
        regionText.includes(ingredient.name) || ingredient.name.includes(regionText) ||
        regionText.toLowerCase().includes(ingredient.name.toLowerCase()) ||
        ingredient.name.toLowerCase().includes(regionText.toLowerCase())
      );
      
      if (matchedIngredient) {
        if (!foundIngredients.has(matchedIngredient.name)) {
          foundIngredients.set(matchedIngredient.name, {
            name: matchedIngredient.name,
            quantity: 1,
            unit: matchedIngredient.unit || '개',
            price: 0,
            regionIndex: index,
            ingredientId: matchedIngredient.id
          });
        }
      }
    });

    // 각 식재료에 대해 주변 숫자들을 찾아서 가격/수량 정보 추출
    foundIngredients.forEach((ingredient, ingredientName) => {
      const ingredientRegionIndex = ingredient.regionIndex;
      
      // 해당 식재료 주변 5개 region에서 숫자 정보 찾기
      for (let i = Math.max(0, ingredientRegionIndex - 2); i < Math.min(regions.length, ingredientRegionIndex + 3); i++) {
        const region = regions[i];
        if (!region?.text) continue;
        
        const regionText = region.text.trim();
        
        // 가격 정보 찾기 (1000원 이상인 경우)
        const priceMatch = regionText.match(/[\d,]+/);
        if (priceMatch) {
          const priceStr = priceMatch[0].replace(/,/g, '');
          const price = parseInt(priceStr);
          if (price >= 1000 && price <= 50000) { // 합리적인 가격 범위
            ingredient.price = price;
          } else if (price > 10 && price < 1000 && ingredient.price === 0) {
            // 작은 숫자는 수량으로 추정
            ingredient.quantity = price;
          }
        }
      }
      
      ingredients.push({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        price: ingredient.price,
        ingredientId: ingredient.ingredientId
      });
    });

    // 전체 텍스트에서 추가로 찾기 (regions에서 놓친 것들)
    if (ingredients.length === 0) {
      reduxIngredients.forEach(ingredient => {
        if (text.includes(ingredient.name) || text.toLowerCase().includes(ingredient.name.toLowerCase())) {
          // 해당 재료 주변의 숫자들을 찾아서 가격으로 추정
          const regex = new RegExp(`${ingredient.name}[\\s\\S]{0,50}([\\d,]+)`, 'g');
          const match = regex.exec(text);
          let price = 0;
          if (match && match[1]) {
            price = parseInt(match[1].replace(/,/g, '')) || 0;
          }
          
          ingredients.push({
            name: ingredient.name,
            quantity: 1,
            unit: ingredient.unit || '개',
            price: price,
            ingredientId: ingredient.id
          });
        }
      });
    }

    console.log('추출된 식재료:', ingredients);
    return ingredients;
    
  } catch (error) {
    console.error('OCR 텍스트 파싱 오류:', error);
    return [];
  }
}

const CartScreen = () => {
  const navigation = useNavigation<any>();

  // 인증 상태 가져오기
  const { userId, token, isAuthenticated } = useAuth();

  // Redux에서 ingredient 데이터 가져오기
  const ingredients = useAppSelector(state => state.ingredient.ingredients);

  // WebSocket 연결 (실제 사용자 정보)
  const webSocket = useWebSocket({
    userId: userId || 'anonymous',
    token: token || '',
    baseUrl:'wss://makefood-api.store',
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  // 기존 상태 관리
  const [cart, setCart] = useState<CartItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('1');
  const [editUnit, setEditUnit] = useState('개');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [purchaseList, setPurchaseList] = useState<CartItemDto[]>([]);
  const [priceMap, setPriceMap] = useState<Record<string, string>>({});
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredientList, setFilteredIngredientList] = useState<Ingredient[]>([]);

  // OCR 관련 상태
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResults, setOcrResults] = useState<Array<{
    name: string; 
    quantity: number; 
    unit: string;
    price: number; 
    ingredientId?: string | number;
  }>>([]);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // OCR 결과 선택용 상태
  const [selectedOcrItems, setSelectedOcrItems] = useState<number[]>([]);
  
  // OCR 결과에서 식재료명 선택을 위한 상태들
  const [showOcrIngredientMenus, setShowOcrIngredientMenus] = useState<Record<number, boolean>>({});
  const [ocrIngredientSearches, setOcrIngredientSearches] = useState<Record<number, string>>({});

  const lastValidTextRef = useRef<string>('');

  const [searchInputValue, setSearchInputValue] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);

  // 검색어 변경 시 필터링
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!searchInputValue.trim()) {
      setFilteredIngredients([]);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      const query = searchInputValue.trim().toLowerCase();
      const results = ingredients
        .filter(item => item.name.toLowerCase().includes(query))
        .slice(0, 5);
      setFilteredIngredients(results);
    }, 500);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchInputValue, ingredients]);

  // 검색어 입력 처리
  const handleSearchInput = useCallback((text: string) => {
    setIngredientSearchQuery(text);
    setIsSearching(true);
    
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
  }, []);

  // 검색 실행
  useEffect(() => {
    if (!isSearching) return;

    searchDebounceRef.current = setTimeout(() => {
      const normalizedQuery = ingredientSearchQuery.trim().toLowerCase();
      
      if (normalizedQuery) {
        // 검색 로직을 별도의 함수로 분리
        const results = allIngredients
          .filter(ingredient => {
            const normalizedName = ingredient.name.toLowerCase();
            return normalizedName.includes(normalizedQuery);
          })
          .slice(0, 5);

        setIngredientSearchQuery(ingredientSearchQuery);
        setFilteredIngredientList(results);
      } else {
        setIngredientSearchQuery('');
        setFilteredIngredientList([]);
      }
      setIsSearching(false);
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
    }, [ingredientSearchQuery, isSearching, allIngredients]);

  // 재료 선택 시 상태 업데이트 추적
  const handleIngredientSelect = useCallback((ingredient: Ingredient) => {
    console.log('Ingredient selected:', ingredient.name); // 디버깅용
    setSelectedIngredient(ingredient);
    setNewName(ingredient.name);
    setNewUnit(ingredient.unit || '개');
    setIngredientSearchQuery('');
    setFilteredIngredientList([]);
    setShowIngredientPicker(false);
  }, []);

  // 화면 포커스 효과 모니터링
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, loading cart data'); // 디버깅용
      loadCartData();
    }, [])
  );

  // 초기 데이터 로드 모니터링
  useEffect(() => {
    console.log('Initial ingredients loaded:', ingredients.length); // 디버깅용
    setAllIngredients(ingredients);
  }, [ingredients]);

  // 초기 데이터 로드
  useEffect(() => {
    loadCartData();
  }, []);

  // 장바구니 데이터 로드
  const loadCartData = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response || []);
      // 추가/삭제 후 선택 초기화
      setSelectedKeys([]);
    } catch (error) {
      console.error('장바구니 로드 실패:', error);
      Alert.alert('오류', '장바구니를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCartData();
    setRefreshing(false);
  };

  // 재료 추가
  const handleAdd = async () => {
    if (!newName.trim() || !newQty || isNaN(Number(newQty)) || Number(newQty) < 1) {
      Alert.alert('입력 오류', '재료명과 올바른 수량을 입력해주세요.');
      return;
    }

    // Redux에 등록된 재료인지 확인
    const selectedIng: Ingredient | undefined = ingredients.find(ing => ing.name === newName.trim());
    const ingredientExists = !!selectedIng;
    if (!ingredientExists) {
      Alert.alert('재료 오류', '등록되지 않은 재료입니다. 검색창에서 제안되는 재료만 추가할 수 있습니다.');
      return;
    }

    try {
      const newItem: AddToCartRequest = {
        ingredient: {
          ingredientId: Number(selectedIng!.id),
          ingredientName: selectedIng!.name,
          amount: Number(newQty),
          unit: selectedIng!.unit || '개',
        },
        quantity: Number(newQty),
        unit: selectedIng!.unit || '개',
        purchased: false,
      };

      await cartService.addToCartBatch([newItem]);

      // 서버에서 빈 문자열을 반환하므로 다시 로드
      await loadCartData();
      
      // 입력 필드 초기화 및 선택 초기화
      setNewName('');
      setNewQty('1');
      setNewUnit('');
      setAddDialog(false);
      setSelectedKeys([]);
      
      Alert.alert('완료', '재료가 장바구니에 추가되었습니다.');
    } catch (error) {
      console.error('재료 추가 실패:', error);
      Alert.alert('오류', '재료 추가 중 오류가 발생했습니다.');
    }
  };

  // 재료 삭제
  const handleDelete = async (idx: number) => {
    const item = cart[idx];
    if (!item) return;

    Alert.alert(
      '삭제 확인',
      `"${item.ingredient.ingredientName}"을(를) 장바구니에서 제거하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await cartService.removeFromCart(item.ingredient.ingredientId);
              
              // 로컬 상태 업데이트
              setCart(prevCart => prevCart.filter((_, i) => i !== idx));
              
              Alert.alert('완료', '재료가 장바구니에서 제거되었습니다.');
            } catch (error) {
              console.error('재료 삭제 실패:', error);
              Alert.alert('오류', '재료 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 수정 모달 열기
  const openEdit = (idx: number) => {
    const item = cart[idx];
    if (!item) return;

    setEditIdx(idx);
    setEditQty(item.quantity.toString());
    setEditUnit(item.unit);
    setEditDialog(true);
  };

  // 수량/단위 수정
  const handleEdit = async () => {
    if (editIdx === null || !editQty || isNaN(Number(editQty)) || Number(editQty) < 1) {
      Alert.alert('입력 오류', '올바른 수량을 입력해주세요.');
      return;
    }

    const item = cart[editIdx];
    if (!item) return;

    try {
      const updateData: UpdateCartItemRequest = {
        ingredient: {
          ingredientId: item.ingredient.ingredientId,
          ingredientName: item.ingredient.ingredientName,
          amount: Number(editQty),
          unit: editUnit,
        },
        quantity: Number(editQty),
        unit: editUnit,
        purchased: false,
      };

      await cartService.updateQuantity(updateData);

      await loadCartData();
      
      setEditDialog(false);
      setEditIdx(null);
      
      Alert.alert('완료', '재료 정보가 수정되었습니다.');
    } catch (error) {
      console.error('재료 수정 실패:', error);
      Alert.alert('오류', '재료 수정 중 오류가 발생했습니다.');
    }
  };

  // 구매 대상 토글 (서버 요청 X, 로컬 상태만 변경)
  const toggleSelected = (idx: number) => {
    const ingredientIdStr = String(cart[idx].ingredient.ingredientId);
    setSelectedKeys(prev =>
      prev.includes(ingredientIdStr) ? prev.filter(x => x !== ingredientIdStr) : [...prev, ingredientIdStr]
    );
  };

  // 장바구니 전체 비우기
  const handleClearCart = () => {
    if (cart.length === 0) {
      Alert.alert('알림', '장바구니가 이미 비어있습니다.');
      return;
    }

    Alert.alert(
      '전체 삭제',
      '장바구니의 모든 재료를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await cartService.clearCart();
              setCart([]);
              Alert.alert('완료', '장바구니가 비워졌습니다.');
            } catch (error) {
              console.error('장바구니 비우기 실패:', error);
              Alert.alert('오류', '장바구니 비우기 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 구매 확인 다이얼로그 열기
  const openPurchaseDialog = () => {
    const toPurchase = cart.filter(item => selectedKeys.includes(String(item.ingredient.ingredientId)));
    if (toPurchase.length === 0) {
      Alert.alert('알림', '구매할 재료를 선택해주세요.');
      return;
    }
    const init: Record<string, string> = {};
    toPurchase.forEach(item => {
      const key = String(item.ingredient.ingredientId);
      init[key] = '0';
    });
    setPriceMap(init);
    setPurchaseList(toPurchase);
    setPurchaseDialog(true);
  };

  const handlePriceChange = (key: string, value: string) => {
    setPriceMap(prev => ({ ...prev, [key]: value }));
  };

  // 구매 처리
  const handleConfirmPurchase = async () => {
    if (selectedKeys.length === 0) {
      Alert.alert('알림', '구매할 재료를 선택해주세요.');
      return;
    }

    try {
      setPurchasing(true);
      
      const toPurchase = purchaseList;

      // 1) 구매 기록 저장 (purchaseService)
      const purchaseItems = toPurchase.map(it => {
        const key = String(it.ingredient.ingredientId);
        const reduxIngredient = ingredients.find(ing => Number(ing.id) === it.ingredient.ingredientId);
        return {
          ingredient: {
            id: it.ingredient.ingredientId,
            name: reduxIngredient?.name || it.ingredient.ingredientName,
            unit: reduxIngredient?.unit || it.unit || '개',
          },
          quantity: it.quantity,
          price: Number(priceMap[key]) || 0,
        };
      });

      await purchaseService.savePurchases(purchaseItems.map(item => ({
        ingredient: {
          ingredientId: item.ingredient.id,
          ingredientName: item.ingredient.name,
          amount: item.quantity,
          unit: item.ingredient.unit,
        },
        quantity: item.quantity,
        price: item.price,
        items: [{
          ingredient: {
            ingredientId: item.ingredient.id,
            ingredientName: item.ingredient.name,
            amount: item.quantity,
            unit: item.ingredient.unit,
          },
          quantity: item.quantity,
          price: item.price,
        }]
      })));

      // 2) 인벤토리에 구매한 재료 추가
      const inventoryItems = toPurchase.map(it => {
        const key = String(it.ingredient.ingredientId);
        const reduxIngredient = ingredients.find(ing => Number(ing.id) === it.ingredient.ingredientId);
        return {
          ingredient: {
            ingredientId: it.ingredient.ingredientId,
            ingredientName: reduxIngredient?.name || it.ingredient.ingredientName,
            unit: reduxIngredient?.unit || it.unit || '개',
          },
          quantity: it.quantity,
          purchaseDate: new Date().toISOString().slice(0, 10),
          expiryDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10), // 7일 후
          price: Number(priceMap[key]) || 0,
        };
      });
      
      await inventoryService.addItemsBatch(inventoryItems.map(item => {
        const reduxIngredient = ingredients.find(ing => Number(ing.id) === item.ingredient.ingredientId);
        return {
          ingredient: {
            id: item.ingredient.ingredientId,
            name: reduxIngredient?.name || item.ingredient.ingredientName,
            unit: reduxIngredient?.unit || item.ingredient.unit || '개',
          },
          quantity: item.quantity,
          purchaseDate: item.purchaseDate,
          expiryDate: item.expiryDate,
          price: item.price,
        };
      }));

      // 3) 장바구니에서 아이템 삭제
      await Promise.all(
        toPurchase.map(item => cartService.removeFromCart(item.ingredient.ingredientId))
      );

      // 최신 장바구니 로드
      await loadCartData();

      Alert.alert('완료', '선택한 재료가 구매 처리되었습니다.');
      setSelectedKeys([]);
      setPurchaseDialog(false);
    } catch (error) {
      console.error('구매 처리 실패:', error);
      Alert.alert('오류', '구매 처리 중 오류가 발생했습니다.');
    } finally {
      setPurchasing(false);
    }
  };

  // OCR 관련 useEffect들
  // OCR 결과 처리
  useEffect(() => {
    if (webSocket.ocrResult) {
      setIsProcessingOCR(false);
      
      // OCR 결과를 우리 형식으로 변환
      let formattedResults: Array<{
        name: string; 
        quantity: number; 
        unit: string;
        price: number; 
        ingredientId?: string | number;
      }> = [];

      // 기존 구조 (ingredients 배열이 있는 경우)
      if (webSocket.ocrResult.ingredients && webSocket.ocrResult.ingredients.length > 0) {
        formattedResults = webSocket.ocrResult.ingredients.map((ingredient) => {
          // Redux ingredient와 매칭 찾기
          const match = ingredients.find(ing => 
            ing.name === ingredient.itemName ||
            ing.name.toLowerCase() === ingredient.itemName.toLowerCase()
          );
          
          return {
            name: match ? match.name : ingredient.itemName,
            quantity: ingredient.quantity || 1,
            unit: match ? match.unit : (ingredient.unit || '개'),
            price: ingredient.price || 0,
            ingredientId: match ? match.id : undefined,
          };
        });
      } 
      // 새로운 OCR 결과 구조 처리 (실제 받은 메시지 형태)
      else if (webSocket.ocrResult.text || webSocket.ocrResult.regions) {
        // OCR 텍스트에서 식재료 정보 추출 (Redux ingredient 데이터 활용)
        const extractedIngredients = parseOcrText(webSocket.ocrResult, ingredients);
        formattedResults = extractedIngredients;
      }

      setOcrResults(formattedResults);
      
      if (formattedResults.length > 0) {
        // 모든 OCR 결과를 기본으로 선택
        setSelectedOcrItems(formattedResults.map((_, index) => index));
        // 영수증 등록 모달 닫고 OCR 결과 확인 다이얼로그 열기
        setReceiptDialog(false);
        setConfirmDialog(true);
      } else {
        // OCR 결과가 없는 경우 안내 메시지
        Alert.alert('OCR 결과', '인식된 식재료가 없습니다. 다시 시도해주세요.');
        setReceiptDialog(false);
      }
    }
  }, [webSocket.ocrResult]);

  // OCR 에러 처리
  useEffect(() => {
    if (webSocket.ocrError) {
      setIsProcessingOCR(false);
      setUploadProgress(null);
      
      // OCR 요청 제한 에러인지 확인
      const isRateLimitError = webSocket.ocrError.includes('10분에 한 번만 가능') ||
                               webSocket.ocrError.includes('요청 제한') ||
                               webSocket.ocrError.includes('rate limit');
      
      if (isRateLimitError) {
        Alert.alert(
          '⏰ OCR 요청 제한',
          '영수증 인식은 10분에 한 번만 사용할 수 있습니다.\n\n잠시 후 다시 시도해주세요.\n\n💡 팁: 직접 장바구니에 재료를 추가할 수도 있습니다!',
          [
            {
              text: '확인',
              onPress: () => {
                webSocket.clearOcrData();
                setCurrentImage(null);
                setReceiptDialog(false); // 모달 닫기
                console.log('OCR 요청 제한으로 인한 모달 닫기');
              },
            },
          ]
        );
      } else {
        Alert.alert('OCR 처리 오류', webSocket.ocrError, [
          {
            text: '확인',
            onPress: () => {
              webSocket.clearOcrData();
              setCurrentImage(null);
              // 일반 에러는 영수증 등록 모달은 열어둔 채로 유지
            },
          },
        ]);
      }
    }
  }, [webSocket.ocrError]);

  // OCR 진행 상황 처리
  useEffect(() => {
    if (webSocket.ocrProgress) {
      setIsProcessingOCR(true);
    }
  }, [webSocket.ocrProgress]);

  // WebSocket 연결 상태 변화 감지 (OCR 요청 제한으로 인한 연결 해제 감지)
  useEffect(() => {
    if (webSocket.state === WebSocketState.DISCONNECTED && 
        (isProcessingOCR || receiptDialog)) {
      console.log('WebSocket 연결 해제 감지 - OCR 처리 중단');
      setIsProcessingOCR(false);
      setUploadProgress(null);
    }
  }, [webSocket.state, isProcessingOCR, receiptDialog]);

  // 영수증 등록 시작 - WebSocket 연결
  const startReceiptProcess = async () => {
    try {
      // WebSocket 연결
      if (!webSocket.isConnected) {
        await webSocket.connect();
      }
      // 다이얼로그 열 때 이미지 초기화
      setCurrentImage(null);
      setReceiptDialog(true);
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      console.log('OCR 서버 연결 실패, 조용히 처리');
    }
  };

  // 영수증 사진 선택/촬영
  const pickReceipt = async (fromCamera: boolean) => {
    if (!webSocket.isConnected) {
      console.log('WebSocket 연결되지 않음, OCR 기능 사용 불가');
      return;
    }

    let result;
    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        quality: 0.7,
      });
    }
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setCurrentImage(asset.uri);
      // 모달을 닫지 않고 진행 상황을 모달 내에서 표시
      setIsProcessingOCR(true);
      
      try {
        // 1단계: S3에 이미지 직접 업로드 (진행률 추적)
        const s3Url = await uploadToS3(asset.uri, 'receipt', (progress) => {
          setUploadProgress(progress);
        });
        
        // 업로드 완료 후 진행률 초기화
        setUploadProgress(null);
        
        // 2단계: S3 URL을 WebSocket으로 전송하여 OCR 요청
        webSocket.requestOcr(s3Url);
      } catch (error) {
        setIsProcessingOCR(false);
        setUploadProgress(null);
        Alert.alert('업로드 실패', error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  // OCR 결과 확인 및 바로 구매 처리
  const confirmOCRResults = async () => {
    try {
      // 선택된 OCR 결과들만 필터링 (체크된 것들만)
      const selectedItems = ocrResults.filter((_, index) => 
        !selectedOcrItems || selectedOcrItems.length === 0 || selectedOcrItems.includes(index)
      );

      if (selectedItems.length === 0) {
        Alert.alert('알림', '구매할 재료를 선택해주세요.');
        return;
      }

      // 현재 장바구니 로드 (중복 체크용)
      await loadCartData();

      // 장바구니 중복 항목 정리 및 구매 처리
      const itemsToRemoveFromCart: number[] = [];
      const purchaseItems = selectedItems.map(item => {
        // Redux ingredient에서 정확한 매칭 찾기
        const match = ingredients.find(ing => 
          ing.id === item.ingredientId || ing.name === item.name
        );
        
        const finalIngredientId = match ? Number(match.id) : 0;
        
        // 장바구니에 같은 ingredientId가 있는지 확인
        const existingCartItem = cart.find(cartItem => 
          cartItem.ingredient.ingredientId === finalIngredientId
        );
        
        if (existingCartItem) {
          // 같은 재료가 장바구니에 있으면 제거 목록에 추가
          itemsToRemoveFromCart.push(finalIngredientId);
          console.log(`장바구니에서 중복 제거: ${existingCartItem.ingredient.ingredientName}`);
        }
        
        console.log('OCR 구매 처리 매칭 결과:', {
          itemName: item.name,
          itemIngredientId: item.ingredientId,
          matchFound: !!match,
          matchId: match?.id,
          matchName: match?.name,
          finalIngredientId: finalIngredientId,
          existingInCart: !!existingCartItem
        });
        
        return {
          ingredient: {
            id: finalIngredientId,
            name: match ? match.name : item.name,
            unit: match ? match.unit : item.unit,
          },
          quantity: item.quantity,
          price: item.price,
        };
      });

      // 1) 장바구니에서 중복 항목들 제거
      if (itemsToRemoveFromCart.length > 0) {
        await Promise.all(
          itemsToRemoveFromCart.map(ingredientId => 
            cartService.removeFromCart(ingredientId)
          )
        );
        console.log(`장바구니에서 ${itemsToRemoveFromCart.length}개 중복 항목 제거됨`);
      }

      // 2) 구매 기록 저장 (purchaseService)
      await purchaseService.savePurchases(purchaseItems.map(item => ({
        ingredient: {
          ingredientId: item.ingredient.id,
          ingredientName: item.ingredient.name,
          amount: item.quantity,
          unit: item.ingredient.unit,
        },
        quantity: item.quantity,
        price: item.price,
        items: [{
          ingredient: {
            ingredientId: item.ingredient.id,
            ingredientName: item.ingredient.name,
            amount: item.quantity,
            unit: item.ingredient.unit,
          },
          quantity: item.quantity,
          price: item.price,
        }]
      })));

      // 3) 인벤토리에 구매한 재료 추가
      const inventoryItems = purchaseItems.map(item => ({
        ingredient: {
          id: item.ingredient.id,
          name: item.ingredient.name,
          unit: item.ingredient.unit,
        },
        quantity: item.quantity,
        purchaseDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 10), // 7일 후
        price: item.price,
      }));
      
      await inventoryService.addItemsBatch(inventoryItems);

      // 장바구니 다시 로드 (중복 제거 반영)
      await loadCartData();
      
      setConfirmDialog(false);
      setOcrResults([]);
      setCurrentImage(null);
      setSelectedOcrItems([]);
      setShowOcrIngredientMenus({});
      setOcrIngredientSearches({});
      webSocket.clearOcrData();
      
      // OCR 완료 후 웹소켓 연결 해제
      if (webSocket.isConnected) {
        webSocket.disconnect();
      }
      
      Alert.alert('완료', 
        `${selectedItems.length}개의 재료가 구매 처리되어 인벤토리에 추가되었습니다.` + 
        (itemsToRemoveFromCart.length > 0 ? `\n(장바구니에서 ${itemsToRemoveFromCart.length}개 중복 항목 제거됨)` : '')
      );
    } catch (error) {
      console.error('구매 처리 실패:', error);
      Alert.alert('오류', '구매 처리 중 오류가 발생했습니다.');
    }
  };

  // OCR 결과 취소
  const cancelOCRResults = () => {
    setConfirmDialog(false);
    setOcrResults([]);
    setCurrentImage(null);
    setSelectedOcrItems([]);
    setShowOcrIngredientMenus({});
    setOcrIngredientSearches({});
    webSocket.clearOcrData();
    
    // OCR 취소 시에도 웹소켓 연결 해제
    if (webSocket.isConnected) {
      webSocket.disconnect();
    }
  };

  const getConnectionStatusColor = () => {
    switch (webSocket.state) {
      case WebSocketState.CONNECTED: return '#4CAF50';
      case WebSocketState.CONNECTING: 
      case WebSocketState.RECONNECTING: return '#FF9800';
      case WebSocketState.ERROR: return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getConnectionStatusText = () => {
    switch (webSocket.state) {
      case WebSocketState.CONNECTED: return '실시간 OCR 사용 가능';
      case WebSocketState.CONNECTING: return '연결 중...';
      case WebSocketState.RECONNECTING: return '재연결 중...';
      case WebSocketState.ERROR: return '';
      default: return '';
    }
  };

  const [composingText, setComposingText] = useState(false);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      {/* OCR 진행 상황 - 영수증 등록 모달이 닫혀있을 때만 표시 */}
      {!receiptDialog && (webSocket.ocrProgress || uploadProgress || isProcessingOCR) && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {webSocket.ocrProgress?.stepDescription || 
             (uploadProgress ? 'S3에 이미지 업로드 중...' : 'OCR 처리 준비 중...')}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${webSocket.ocrProgress?.percentage || uploadProgress?.percentage || 10}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressPercent}>
            {webSocket.ocrProgress?.percentage || uploadProgress?.percentage || 10}%
          </Text>
          {uploadProgress && (
            <Text style={styles.uploadDetails}>
              {Math.round(uploadProgress.loaded / 1024)}KB / {Math.round(uploadProgress.total / 1024)}KB
            </Text>
          )}
        </View>
      )}

      <Header
        title={`장바구니 (${cart.length})`}
        subtitle={getConnectionStatusText()}
        actions={[
          {
            icon: 'receipt-outline',
            onPress: startReceiptProcess,
            color: webSocket.isConnected ? theme.colors.warning : "#bdbdbd",
            disabled: isProcessingOCR,
          },
          {
            icon: 'trash-outline',
            onPress: handleClearCart,
            color: theme.colors.error,
            disabled: cart.length === 0,
          },
          // 장바구니에 아이템이 있을 때만 플러스 버튼 표시
          ...(cart.length > 0 ? [{
            icon: 'add-circle' as keyof typeof Ionicons.glyphMap,
            onPress: () => setAddDialog(true),
            color: theme.colors.primary,
          }] : []),
        ]}
      />

      {cart.length === 0 ? (
        <Empty 
          message="장바구니가 비어 있습니다"
          subMessage="필요한 재료를 추가하여 쇼핑 리스트를 만들어보세요!"
          iconName="basket-outline"
          iconColor={theme.colors.primary}
          iconSize={80}
          showAction={true}
          actionText="재료 추가하기"
          onAction={() => setAddDialog(true)}
        />
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item, index) => `cart-${item.ingredient.ingredientId ?? index}`}
          renderItem={({ item, index }) => {
            console.log('Cart item:', item); // 디버깅용
            return (
              <TouchableOpacity
                style={[
                  styles.cartCard,
                  index % 2 === 0 ? styles.cartCardLeft : styles.cartCardRight,
                  selectedKeys.includes(String(item.ingredient.ingredientId)) && styles.cartCardSelected
                ]}
                onPress={() => toggleSelected(index)}
                activeOpacity={0.8}
              >
                {/* 선택 체크박스 */}
                <View style={styles.selectionCheckbox}>
                  <Ionicons
                    name={selectedKeys.includes(String(item.ingredient.ingredientId)) ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={selectedKeys.includes(String(item.ingredient.ingredientId)) ? theme.colors.primary : theme.colors.textLight}
                  />
                </View>

                {/* 재료 정보 */}
                <View style={styles.itemContent}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.ingredient.ingredientName}
                  </Text>
                  
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <Text style={styles.unit}>{item.ingredient.unit || '개'}</Text>
                  </View>
                </View>

                {/* 액션 버튼 */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEdit(index)}
                  >
                    <Ionicons name="pencil" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(index)}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ffb74d']}
            />
          }
        />
      )}

      {/* 장바구니에 아이템이 있을 때만 구매하기 버튼 표시 */}
      {cart.length > 0 && (
        <Button 
          mode="contained" 
          style={styles.btn} 
          onPress={openPurchaseDialog} 
          buttonColor={theme.colors.primary}
          disabled={selectedKeys.length === 0 || purchasing}
          loading={purchasing}
        >
          {purchasing ? '처리 중...' : selectedKeys.length > 0 ? `${selectedKeys.length}개 구매하기` : '구매하기'}
        </Button>
      )}

      {/* 재료 추가 다이얼로그 */}
      <Portal>
        <Dialog visible={addDialog} onDismiss={() => setAddDialog(false)} style={styles.dialog}>
          <Dialog.Content style={styles.modernModalContent}>
            {/* 컴팩트 헤더 */}
            <View style={styles.compactHeader}>
              <Ionicons name="basket" size={20} color={theme.colors.primary} />
              <Text style={styles.compactTitle}>재료 추가</Text>
            </View>

            {/* 재료 선택 섹션 */}
            <View style={styles.compactSection}>
              <Text style={styles.compactLabel}>
                <Ionicons name="restaurant" size={14} color={theme.colors.primary} /> 재료 선택
              </Text>
              
              {/* 선택된 재료 표시 또는 검색바 */}
              {newName ? (
                <View style={styles.selectedIngredientContainer}>
                  <View style={styles.selectedIngredientInfo}>
                    <View style={styles.selectedIngredientIcon}>
                      <Ionicons name="restaurant" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={styles.selectedIngredientText}>
                      <Text style={styles.selectedIngredientName}>{newName}</Text>
                      <Text style={styles.selectedIngredientUnit}>단위: {newUnit}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.changeIngredientButton}
                    onPress={() => {
                      setNewName('');
                      setIngredientSearchQuery('');
                    }}
                  >
                    <Text style={styles.changeIngredientText}>변경</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ingredientSearchSection}>
                  <TextInput
                    placeholder="재료명을 검색하세요"
                    onChangeText={(text) => {
                      setSearchInputValue(text);
                      setIngredientSearchQuery(text);
                      setIsSearching(true);
                      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
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
                      if (filteredIngredients.length > 0) {
                        handleIngredientSelect(filteredIngredients[0]);
                      }
                    }}
                  />
                  
                  {searchInputValue.trim().length > 0 && (
                    <View style={styles.ingredientListContainer}>
                      <FlatList
                        data={filteredIngredients}
                        keyExtractor={item => String(item.id)}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.ingredientListItem}
                            onPress={() => {
                              handleIngredientSelect(item);
                              setNewName(item.name);
                              setNewUnit(item.unit || '개');
                              setIngredientSearchQuery('');
                              setFilteredIngredientList([]);
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
                    const current = Number(newQty);
                    if (current > 1) {
                      setNewQty(String(current - 1));
                    }
                  }}
                  disabled={Number(newQty) <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={Number(newQty) <= 1 ? theme.colors.textLight : theme.colors.primary} 
                  />
                </TouchableOpacity>
                
                <View style={styles.compactQuantityDisplay}>
                  <TextInput
                    value={newQty}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '');
                      setNewQty(numericText);
                    }}
                    keyboardType="number-pad"
                    style={styles.quantityInput}
                  />
                  <Text style={styles.compactQuantityUnit}>{newUnit}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.compactQuantityButton}
                  onPress={() => {
                    const current = Number(newQty);
                    setNewQty(String(current + 1));
                  }}
                >
                  <Ionicons name="add" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 액션 버튼들 */}
            <View style={styles.compactButtons}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => {
                  setAddDialog(false);
                  setNewName('');
                  setNewQty('1');
                  setNewUnit('');
                  setIngredientSearchQuery('');
                }}
              >
                <Text style={styles.compactCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.compactConfirmButton, !newName && styles.compactConfirmButtonDisabled]}
                onPress={handleAdd}
                disabled={!newName}
              >
                <Text style={styles.compactConfirmText}>추가하기</Text>
              </TouchableOpacity>
            </View>
          </Dialog.Content>
        </Dialog>

        {/* 수량 수정 다이얼로그 (단위 변경 불가) */}
        <Dialog visible={editDialog} onDismiss={() => setEditDialog(false)} style={styles.dialog}>
          <Dialog.Content style={styles.modernModalContent}>
            {/* 컴팩트 헤더 */}
            <View style={styles.compactHeader}>
              <Ionicons name="create" size={20} color={theme.colors.primary} />
              <Text style={styles.compactTitle}>수량 수정</Text>
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
                    const current = Number(editQty);
                    if (current > 1) {
                      setEditQty(String(current - 1));
                    }
                  }}
                  disabled={Number(editQty) <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={16} 
                    color={Number(editQty) <= 1 ? theme.colors.textLight : theme.colors.primary} 
                  />
                </TouchableOpacity>
                <View style={styles.compactQuantityDisplay}>
                  <TextInput
                    value={editQty}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '');
                      setEditQty(numericText);
                    }}
                    keyboardType="number-pad"
                    style={styles.quantityInput}
                  />
                  <Text style={styles.compactQuantityUnit}>{editUnit}</Text>
                </View>
                <TouchableOpacity
                  style={styles.compactQuantityButton}
                  onPress={() => {
                    const current = Number(editQty);
                    setEditQty(String(current + 1));
                  }}
                >
                  <Ionicons name="add" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 액션 버튼 */}
            <View style={styles.compactButtons}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => setEditDialog(false)}
              >
                <Text style={styles.compactCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compactConfirmButton}
                onPress={handleEdit}
              >
                <Text style={styles.compactConfirmText}>저장</Text>
              </TouchableOpacity>
            </View>
          </Dialog.Content>
        </Dialog>

        {/* 구매 확인 모달 */}
        <Modal
          visible={purchaseDialog}
          onClose={() => setPurchaseDialog(false)}
          title="구매 정보 입력"
        >
          <View style={styles.modernModalContent}>
            {/* 컴팩트 헤더 */}
            <View style={styles.compactHeader}>
              <Ionicons name="card" size={20} color={theme.colors.primary} />
              <Text style={styles.compactTitle}>구매 정보 입력</Text>
            </View>

            <Text style={styles.modalDescription}>
              각 재료의 구매 가격을 입력하세요
            </Text>
            
            <ScrollView style={styles.purchaseScrollView}>
              {purchaseList.map((item, idx) => {
                const key = String(item.ingredient.ingredientId);
                return (
                  <View key={`pl-${item.ingredient.ingredientId}`} style={styles.modernPurchaseItem}>
                    <View style={styles.purchaseItemInfo}>
                      <View style={styles.purchaseItemIcon}>
                        <Ionicons name="restaurant-outline" size={16} color={theme.colors.primary} />
                      </View>
                      <View style={styles.purchaseItemDetails}>
                        <Text style={styles.purchaseItemName}>{item.ingredient.ingredientName}</Text>
                        <Text style={styles.purchaseItemQuantity}>
                          {item.quantity} {item.unit}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.modernPriceInputContainer}>
                      <Ionicons name="cash-outline" size={16} color={theme.colors.primary} />
                      <TextInput
                        style={styles.modernPriceInput}
                        placeholder="가격"
                        value={priceMap[key] || ''}
                        onChangeText={(text) => handlePriceChange(key, text)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.priceUnit}>원</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            
            <View style={styles.compactButtons}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => setPurchaseDialog(false)}
              >
                <Text style={styles.compactCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.compactConfirmButton, purchasing && styles.compactConfirmButtonDisabled]}
                onPress={handleConfirmPurchase}
                disabled={purchasing}
              >
                <View style={styles.compactConfirmContent}>
                  {purchasing ? (
                    <LoadingIndicator />
                  ) : (
                    <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                  )}
                  <Text style={styles.compactConfirmText}>
                    {purchasing ? '처리중...' : '구매하기'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 영수증 등록 다이얼로그 */}
        <Dialog visible={receiptDialog} onDismiss={() => setReceiptDialog(false)} style={styles.dialog}>
          <Dialog.Title>영수증 등록</Dialog.Title>
          <Dialog.Content>
            {/* OCR 진행 상황 표시 (모달 내부) */}
            {(webSocket.ocrProgress || uploadProgress || isProcessingOCR) && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {webSocket.ocrProgress?.stepDescription || 
                   (uploadProgress ? 'S3에 이미지 업로드 중...' : 'OCR 처리 준비 중...')}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${webSocket.ocrProgress?.percentage || uploadProgress?.percentage || 10}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercent}>
                  {webSocket.ocrProgress?.percentage || uploadProgress?.percentage || 10}%
                </Text>
                {uploadProgress && (
                  <Text style={styles.uploadDetails}>
                    {Math.round(uploadProgress.loaded / 1024)}KB / {Math.round(uploadProgress.total / 1024)}KB
                  </Text>
                )}
              </View>
            )}

            {/* 영수증 이미지 표시 */}
            <View style={styles.receiptImageContainer}>
              <S3UploadImage
                imageUri={currentImage ? currentImage : undefined}
                uploadProgress={uploadProgress}
                style={styles.receiptImg}
                containerStyle={styles.receiptImageStyle}
              />
            </View>

            {/* 버튼들 */}
            <View style={styles.receiptButtonContainer}>
              <Button 
                mode="outlined" 
                onPress={() => pickReceipt(true)} 
                style={[styles.photoBtn, { flex: 1, marginRight: theme.spacing.sm }]} 
                textColor="#ff9800"
                disabled={!webSocket.isConnected || isProcessingOCR}
              >
                사진 촬영
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => pickReceipt(false)} 
                style={[styles.photoBtn, { flex: 1 }]} 
                textColor="#ff9800"
                disabled={!webSocket.isConnected || isProcessingOCR}
              >
                앨범에서 선택
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setReceiptDialog(false)} 
              textColor="#bdbdbd"
              disabled={isProcessingOCR}
            >
              {isProcessingOCR ? 'OCR 진행 중...' : '닫기'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* OCR 결과 확인 다이얼로그 */}
        <Dialog visible={confirmDialog} onDismiss={cancelOCRResults} style={styles.dialog}>
          <Dialog.Title>OCR 결과 확인</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.confirmText}>
              식재료를 선택하고 정보를 확인한 후 바로 구매 처리하세요
            </Text>
            
            {/* 전체 선택/해제 버튼 */}
            {ocrResults.length > 0 && (
              <View style={styles.selectAllContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    if (selectedOcrItems.length === ocrResults.length) {
                      setSelectedOcrItems([]);
                    } else {
                      setSelectedOcrItems(ocrResults.map((_, index) => index));
                    }
                  }}
                  style={styles.selectAllButton}
                  textColor="#ffb74d"
                >
                  {selectedOcrItems.length === ocrResults.length ? '전체 해제' : '전체 선택'}
                </Button>
                <Text style={styles.selectedCountText}>
                  {selectedOcrItems.length}/{ocrResults.length}개 선택됨
                </Text>
              </View>
            )}
            
            <ScrollView style={styles.ocrResultList}>
              {ocrResults.map((item, index) => (
                <View key={index} style={[
                  styles.ocrResultItem,
                  selectedOcrItems.includes(index) && styles.selectedOcrItem
                ]}>
                  <View style={styles.ocrItemHeader}>
                    <View style={styles.ocrItemHeaderLeft}>
                      <IconButton
                        icon={selectedOcrItems.includes(index) ? 'check-circle' : 'check-circle-outline'}
                        size={20}
                        iconColor={selectedOcrItems.includes(index) ? '#4caf50' : '#bdbdbd'}
                        onPress={() => {
                          if (selectedOcrItems.includes(index)) {
                            setSelectedOcrItems(prev => prev.filter(i => i !== index));
                          } else {
                            setSelectedOcrItems(prev => [...prev, index]);
                          }
                        }}
                      />
                      <Text style={styles.ocrItemName}>{item.name}</Text>
                    </View>
                    <IconButton 
                      icon="delete" 
                      size={16} 
                      iconColor="#d32f2f" 
                      onPress={() => {
                        const newResults = ocrResults.filter((_, i) => i !== index);
                        setOcrResults(newResults);
                        // 선택 상태도 업데이트
                        setSelectedOcrItems(prev => 
                          prev.map(i => i > index ? i - 1 : i).filter(i => i !== index)
                        );
                      }}
                    />
                  </View>
                  <View style={styles.ocrItemDetails}>
                    {/* 식재료명 선택 */}
                    <View style={styles.ocrDetailRow}>
                      <Text style={styles.ocrDetailLabel}>식재료:</Text>
                      <Menu
                        visible={showOcrIngredientMenus[index] || false}
                        onDismiss={() => {
                          const newMenus = { ...showOcrIngredientMenus };
                          newMenus[index] = false;
                          setShowOcrIngredientMenus(newMenus);
                        }}
                        anchor={
                          <Button
                            mode="outlined"
                            onPress={() => {
                              const newMenus = { ...showOcrIngredientMenus };
                              newMenus[index] = true;
                              setShowOcrIngredientMenus(newMenus);
                            }}
                            style={styles.ocrIngredientSelectButton}
                            contentStyle={styles.ocrIngredientSelectContent}
                          >
                            {item.name}
                          </Button>
                        }
                      >
                        <View style={styles.searchContainer}>
                          <TextInput
                            placeholder="식재료 검색..."
                            onChangeText={(text) => {
                              const newSearches = { ...ocrIngredientSearches };
                              newSearches[index] = text;
                              setOcrIngredientSearches(newSearches);
                            }}
                            defaultValue={ocrIngredientSearches[index] || ''}
                            style={styles.searchInput}
                          />
                        </View>
                        <Divider />
                        <ScrollView style={styles.ingredientMenuList}>
                          {ingredients
                            .filter(ing => ing.name.toLowerCase().includes((ocrIngredientSearches[index] || '').toLowerCase()))
                            .map((ingredient) => (
                              <Menu.Item
                                key={ingredient.id}
                                onPress={() => {
                                  const newResults = [...ocrResults];
                                  newResults[index] = {
                                    ...newResults[index],
                                    name: ingredient.name,
                                    unit: ingredient.unit || newResults[index].unit,
                                    ingredientId: ingredient.id
                                  };
                                  setOcrResults(newResults);
                                  
                                  const newMenus = { ...showOcrIngredientMenus };
                                  newMenus[index] = false;
                                  setShowOcrIngredientMenus(newMenus);
                                  
                                  const newSearches = { ...ocrIngredientSearches };
                                  newSearches[index] = '';
                                  setOcrIngredientSearches(newSearches);
                                }}
                                title={ingredient.name}
                                style={styles.ingredientMenuItem}
                              />
                            ))}
                        </ScrollView>
                        {ingredients.filter(ing => 
                          ing.name.toLowerCase().includes((ocrIngredientSearches[index] || '').toLowerCase())
                        ).length === 0 && ocrIngredientSearches[index] && (
                          <Menu.Item
                            onPress={() => {
                              const newResults = [...ocrResults];
                              newResults[index] = {
                                ...newResults[index],
                                name: ocrIngredientSearches[index] || item.name,
                                ingredientId: undefined // 새로운 식재료는 ID 없음
                              };
                              setOcrResults(newResults);
                              
                              const newMenus = { ...showOcrIngredientMenus };
                              newMenus[index] = false;
                              setShowOcrIngredientMenus(newMenus);
                              
                              const newSearches = { ...ocrIngredientSearches };
                              newSearches[index] = '';
                              setOcrIngredientSearches(newSearches);
                            }}
                            title={`"${ocrIngredientSearches[index]}" 직접 입력`}
                            style={styles.ingredientMenuItem}
                          />
                        )}
                      </Menu>
                    </View>
                    
                    <View style={styles.ocrDetailRow}>
                      <Text style={styles.ocrDetailLabel}>수량:</Text>
                      <TextInput
                        value={String(item.quantity)}
                        onChangeText={(text) => {
                          const newResults = [...ocrResults];
                          newResults[index].quantity = parseInt(text) || 1;
                          setOcrResults(newResults);
                        }}
                        style={styles.ocrQuantityInput}
                        keyboardType="numeric"
                      />
                      <Text style={styles.ocrDetailLabel}>단위:</Text>
                      <TextInput
                        value={item.unit}
                        onChangeText={(text) => {
                          const newResults = [...ocrResults];
                          newResults[index].unit = text;
                          setOcrResults(newResults);
                        }}
                        style={styles.ocrUnitInput}
                      />
                    </View>
                    <View style={styles.ocrDetailRow}>
                      <Text style={styles.ocrDetailLabel}>가격:</Text>
                      <TextInput
                        value={String(item.price)}
                        onChangeText={(text) => {
                          const newResults = [...ocrResults];
                          newResults[index].price = parseInt(text) || 0;
                          setOcrResults(newResults);
                        }}
                        style={styles.ocrPriceInput}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                      <Text style={styles.ocrDetailLabel}>원</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            {ocrResults.length === 0 && (
              <Text style={styles.emptyOcrText}>추가할 재료가 없습니다.</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelOCRResults} textColor="#bdbdbd">취소</Button>
            <Button 
              onPress={confirmOCRResults} 
              buttonColor="#ffb74d" 
              textColor="#fff" 
              style={{ borderRadius: 12, marginLeft: 8 }}
              disabled={selectedOcrItems.length === 0}
            >
              선택한 {selectedOcrItems.length}개 구매하기
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
    padding: theme.spacing.xl,
  },


  cartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartCardLeft: {
    marginRight: theme.spacing.xs,
  },
  cartCardRight: {
    marginLeft: theme.spacing.xs,
  },
  cartCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  selectionCheckbox: {
    marginRight: theme.spacing.sm,
  },
  itemContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemName: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.semiBold,
    marginBottom: theme.spacing.xs,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
    marginRight: theme.spacing.xs,
  },
  unit: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deleteButton: {
    borderColor: theme.colors.error,
  },
  btn: {
    marginTop: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
  },
  dialog: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background,
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
  inputFont: {
    fontSize: theme.typography.fontSize.medium,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  ingredientSelectButton: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.md,
    minHeight: 44,
  },
  ingredientSelectLabel: {
    fontSize: theme.typography.fontSize.medium,
  },
  ingredientSelectContent: {
    padding: 0,
  },
  searchContainer: {
    padding: theme.spacing.md,
  },
  searchInput: {
    padding: 0,
    fontSize: theme.typography.fontSize.medium,
  },
  ingredientMenuList: {
    maxHeight: 200,
  },
  ingredientMenuItem: {
    padding: theme.spacing.md,
    minHeight: 44,
    paddingVertical: theme.spacing.sm,
  },
  ingredientMenuItemText: {
    fontSize: theme.typography.fontSize.medium,
    lineHeight: theme.typography.fontSize.medium + 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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
  unitInput: {
    flex: 1,
  },
  // OCR 관련 스타일들
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    fontFamily: theme.typography.fontFamily.regular,
  },
  // 진행 상황 관련 스타일
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
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  progressPercent: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    textAlign: 'right',
    fontFamily: theme.typography.fontFamily.regular,
  },
  uploadDetails: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  // OCR 결과 관련 스타일
  confirmText: {
    fontSize: theme.typography.fontSize.medium,
        marginBottom: theme.spacing.md,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
  },
  ocrResultList: {
    maxHeight: 200,
  },
  ocrResultItem: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  selectedOcrItem: {
    borderColor: '#4caf50',
    borderWidth: 2,
    backgroundColor: '#f1f8e9',
  },
  ocrItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ocrItemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ocrItemName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  ocrItemDetails: {
    marginTop: theme.spacing.sm,
  },
  ocrDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ocrDetailLabel: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    marginRight: theme.spacing.sm,
    minWidth: 50,
    fontFamily: theme.typography.fontFamily.regular,
  },
  ocrIngredientSelectButton: {
    borderWidth: 1,
    borderColor: '#ffb74d',
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  ocrIngredientSelectContent: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  ocrQuantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    fontSize: theme.typography.fontSize.small,
  },
  ocrUnitInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.small,
  },
  ocrPriceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    fontSize: theme.typography.fontSize.small,
  },
  emptyOcrText: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.regular,
  },
  // OCR 결과 선택 관련 스타일
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  selectAllButton: {
    borderColor: '#ffb74d',
  },
  selectedCountText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
    fontFamily: theme.typography.fontFamily.regular,
  },
  receiptImageContainer: {
    marginVertical: theme.spacing.md,
    alignItems: 'center',
  },
  receiptImageStyle: {
    alignSelf: 'center',
    width: 300,
    height: 450,
    marginBottom: theme.spacing.md,
  },
  receiptImg: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  receiptButtonContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  photoBtn: {
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.primary,
  },
  // 컴팩트 모달 스타일들
  modernModalContent: {
    padding: theme.spacing.lg,
  },
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
    width: '100%',
    marginBottom: 8,
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
  ingredientSelectText: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  // 구매 모달 스타일들
  purchaseScrollView: {
    maxHeight: 300,
    marginBottom: theme.spacing.md,
  },
  modernPurchaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  purchaseItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  purchaseItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseItemDetails: {
    flex: 1,
  },
  purchaseItemName: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  purchaseItemQuantity: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  modernPriceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
    minWidth: 100,
  },
  modernPriceInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    textAlign: 'center',
    minHeight: 20,
  },
  compactConfirmButtonDisabled: {
    opacity: 0.5,
  },
  compactConfirmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  // 공통 모달 스타일들
  modalDescription: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  priceUnit: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },

  searchResults: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchResultText: {
    fontSize: 16,
    color: theme.colors.text,
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
  }
});

export default CartScreen; 