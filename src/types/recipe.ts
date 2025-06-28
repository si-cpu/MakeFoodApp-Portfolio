/**
 * UUID 타입 정의
 */
export type UUID = number;

/**
 * API 응답 기본 타입
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * 사용자 정보
 */
export interface UserDto {
  id: UUID;
  name: string;
  age: number;
  gender: string;
  householdSize: number;
}

/**
 * 영양 정보
 */
export interface NutritionDto {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
}

/**
 * 재료 정보
 */
export interface IngredientDto {
  /** 백엔드 변경: 이름 필드가 포함될 수 있음 */
  ingredientName: string;
  ingredientId?: UUID; // 일부 응답에서는 id 없이 이름만 올 수 있음
  amount: number;
  unit: string;
}

/**
 * 레시피 단계 정보
 */
export interface RecipeStepDto {
  stepNumber: number;
  description: string;
  imageUrl?: string;
  tip?: string;
}

/**
 * 레시피 상세 정보
 */
export interface RecipeDetailDto {
  id: UUID;
  title: string;
  description: string;
  imageUrl: string;
  difficulty: string;
  category: string;
  cookingMethod: string;
  cookingTime: number;
  nutrition: NutritionDto;
  ingredients: IngredientDto[];
  toolNames: string[];
  steps: RecipeStepDto[];
  author: UserDto;
}

/**
 * 레시피 요약 정보
 */
export interface RecipeSummaryDto {
  id: UUID;
  title: string;
  description: string;
  category: 'KOREAN' | 'JAPANESE' | 'CHINESE' | 'WESTERN' | 'DESSERT' | 'HEALTHY' | 'VEGETARIAN' | 'FUSION' | 'OTHER';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  cookingTime: number;
  servings: number;
  imageUrl: string;
  author: UserDto;
}

/**
 * 레시피 생성 요청
 */
export interface RecipeCreateDto {
  title: string;
  description: string;
  imageUrl?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: 'KOREAN' | 'JAPANESE' | 'CHINESE' | 'WESTERN' | 'DESSERT' | 'HEALTHY' | 'VEGETARIAN' | 'FUSION' | 'OTHER';
  cookingMethod: 'BOILING' | 'STEAMING' | 'FRYING' | 'STIR_FRYING' | 'GRILLING' | 'BAKING' | 'BLANCHING' | 'BRAISING' | 'SIMMERING' | 'RAW' | 'OTHER';
  estimatedTimeMinutes: number;
  servings: number;
  ingredients: IngredientDto[];
  tools: string[];
  steps: RecipeStepDto[];
}

/**
 * 레시피 목록 조회 파라미터
 */
export interface RecipeListParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

/**
 * 페이지네이션된 레시피 목록 응답
 */
export interface PageRecipeSummaryDto {
  totalPages: number;
  totalElements: number;
  size: number;
  content: RecipeSummaryDto[];
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
  };
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * 토글 응답
 */
export interface ToggleResponse {
  isActive: boolean;
  count: number;
}

/**
 * 정렬 정보
 */
export interface SortObject {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

/**
 * 페이지네이션 정보
 */
export interface PageableObject {
  offset: number;
  sort: SortObject;
  paged: boolean;
  pageNumber: number;
  pageSize: number;
  unpaged: boolean;
}

// 레시피 기본 정보
export interface Recipe {
  id: UUID;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  cookingTime: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  imageUrl: string;
  category: string;
  servings: number;
  calories?: number;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  isAvailable?: boolean; // 재료 보유 여부
}

// 재료 정보
export interface Ingredient {
  id: UUID;
  name: string;
  amount: number;
  unit: string;
  isAvailable?: boolean; // 인벤토리에서 보유 여부
  category?: string;
  price?: number;
}

// 조리 단계
export interface Step {
  id: UUID;
  description: string;
  imageUrl?: string;
  order: number;
  time?: number; // 예상 소요 시간
}

// 레시피 목록 응답
export interface RecipeListResponse {
  content: Recipe[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  isFirst: boolean;
  isLast: boolean;
}

// 레시피 수정 요청
export interface UpdateRecipeRequest extends Partial<RecipeCreateDto> {
  id: UUID;
}

// 재료 체크 응답
export interface IngredientCheckResponse {
  recipeId: UUID;
  ingredients: {
    id: UUID;
    name: string;
    amount: number;
    unit: string;
    isAvailable: boolean;
    availableAmount?: number;
  }[];
  isAvailable: boolean;
  missingIngredients: number;
}

/**
 * 레시피 검색 파라미터
 */
export interface RecipeSearchParams extends RecipeListParams {
  query: string;
  category?: 'KOREAN' | 'JAPANESE' | 'CHINESE' | 'WESTERN' | 'DESSERT' | 'HEALTHY' | 'VEGETARIAN' | 'FUSION' | 'OTHER';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  cookingMethod?: 'BOILING' | 'STEAMING' | 'FRYING' | 'STIR_FRYING' | 'GRILLING' | 'BAKING' | 'BLANCHING' | 'BRAISING' | 'SIMMERING' | 'RAW' | 'OTHER';
  minTime?: number;
  maxTime?: number;
  ingredients?: string[];
  tools?: string[];
}

/**
 * 레시피 필터링 파라미터
 */
export interface RecipeFilterParams extends RecipeListParams {
  ingredients: string[];
  excludeIngredients?: string[];
  tools?: string[];
  maxTime?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  category?: 'KOREAN' | 'JAPANESE' | 'CHINESE' | 'WESTERN' | 'DESSERT' | 'HEALTHY' | 'VEGETARIAN' | 'FUSION' | 'OTHER';
}

/**
 * 레시피 요약 정보 (상태 포함)
 */
export interface RecipeSummaryWithStatusDto {
  id: number;
  title: string;
  description: string;
  category: RecipeCategory;
  difficulty: string;
  cookingTime: number;
  servings: number;
  imageUrl: string;
  author: UserDto;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

/**
 * 레시피 조리 기록
 */
export interface CookRecordDto {
  recipeId: UUID;
  cookedAt: string;
  rating?: number;
  feedback?: string;
  photos?: string[];
}

/**
 * 장바구니 추가 요청
 */
export interface AddToCartRequest {
  recipeId: UUID;
  servings: number;
  ingredients: {
    ingredientId: UUID;
    amount: number;
    unit: string;
  }[];
}

/**
 * 장바구니 응답
 */
export interface CartResponse {
  recipeId: UUID;
  recipeTitle: string;
  servings: number;
  ingredients: {
    ingredientId: UUID;

    amount: number;
    unit: string;
    price: number;
  }[];
  totalPrice: number;
}

/**
 * 레시피 피드백
 */
export interface RecipeFeedbackDto {
  rating: number;
  comment?: string;
  photos?: string[];
}

/**
 * 영양 선호도
 */
export interface NutritionPreference {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

/**
 * 사용자 정보
 */
export interface UserInfoDto {
  gender: string;
  age: number;
  householdSize: number;
  tools: string[];
  preferences: string[];
  dislikes: string[];
  allergies: string[];
  nutritionPreference: NutritionPreference;
}

/**
 * 장바구니 아이템
 */
export interface CartItemDto {
  id: UUID;
  itemName: string;
  quantity: number;
  unit: string;
  purchased: boolean;
}

/**
 * 재고 요청 (Swagger InventoryRequest 스펙에 맞게 수정)
 */
export interface InventoryRequest {
  ingredient: {
    id: number;
    name: string;
    unit: string;
  };
  quantity: number;
  purchaseDate: string; // date format
  expiryDate: string;   // date format
  price: number;        // double
  id?: number;          // optional for updates
}

/**
 * 재고 정보
 */
export interface InventoryDto {
  id: UUID;
  itemName: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  isConsumed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 재고 응답
 */
export interface InventoryResponse {
  message: string;
  items: InventoryDto[];
}

/**
 * 아이템 정보
 */
export interface Item {
  itemName: string;
  quantity: number;
  unit: string;
}

/**
 * OCR 진행 상태
 */
export interface Progress {
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  percentage: number;
}

/**
 * OCR 결과
 */
export interface OCRResult {
  items: Item[];
  totalPrice: number;
  storeName: string;
  purchaseDate: string;
}

/**
 * OCR 응답
 */
export interface OCRResponse {
  userId: string;
  status: string;
  progress: Progress;
  result: OCRResult;
}

/**
 * 토큰 갱신 요청
 */
export interface RefreshRequestDto {
  refreshToken: string;
}

/**
 * 인증 응답
 */
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  userId: UUID;
  onboarded: boolean;
  newUser: boolean;
}

/**
 * 액세스 토큰
 */
export interface AccessTokenDto {
  accessToken: string;
}

/**
 * 기본 통계
 */
export interface BasicStats {
  createdRecipes: number;
  likedRecipes: number;
  savedRecipes: number;
  totalCookCount: number;
  cookedUniqueRecipes: number;
}

/**
 * 선호도 분석
 */
export interface PreferenceAnalysis {
  favoriteDifficulty: string;
  averageCookingTime: number;
  topIngredients: string[];
  topTools: string[];
}

/**
 * 최근 활동
 */
export interface RecentActivity {
  recentCooked: RecipeSummaryDto[];
  recentLiked: RecipeSummaryDto[];
  recentSaved: RecipeSummaryDto[];
}

/**
 * 사용자 통계
 */
export interface UserStatsDto {
  basicStats: BasicStats;
  recentActivity: RecentActivity;
  preferenceAnalysis: PreferenceAnalysis;
  monthlyStats: Record<string, number>;
}

/**
 * 계절 식재료
 */
export interface SeasonalIngredient {
  id: UUID;
  name: string;
  month: 'JANUARY' | 'FEBRUARY' | 'MARCH' | 'APRIL' | 'MAY' | 'JUNE' | 'JULY' | 'AUGUST' | 'SEPTEMBER' | 'OCTOBER' | 'NOVEMBER' | 'DECEMBER';
  season: string;
  description: string;
  seasonStartMonth: number;
  seasonEndMonth: number;
  imageUrl: string;
  priceIndex: number;
  freshnessIndex: number;
}

/**
 * 댓글 정보
 */
export interface CommentDto {
  id: UUID;
  stepId: UUID;
  content: string;
}

/**
 * 웹소켓 메시지
 */
export interface WebSocketMessage {
  userId: string;
  destination: string;
  payload: object;
}

export enum RecipeCategory {
  KOREAN = 'KOREAN',      // 한식
  JAPANESE = 'JAPANESE',  // 일식
  CHINESE = 'CHINESE',    // 중식
  WESTERN = 'WESTERN',    // 양식
  DESSERT = 'DESSERT',    // 디저트
  HEALTHY = 'HEALTHY',    // 건강식
  VEGETARIAN = 'VEGETARIAN', // 채식
  FUSION = 'FUSION',      // 퓨전
  OTHER = 'OTHER',        // 기타
} 