/**
 * UUID 타입 정의
 */
export type UUID = number;

/**
 * 재료 정보 (Swagger IngredientDto 스펙)
 */
export interface IngredientDto {
  ingredientId: number;
  ingredientName: string;
  amount: number;
  unit: string;
}

/**
 * 장바구니 아이템 (Swagger CartItemDto 스펙)
 */
export interface CartItemDto {
  ingredient: IngredientDto;
  quantity: number;
  unit: string;
  purchased: boolean;
}

/**
 * 장바구니 아이템 수정 요청
 */
export type UpdateCartItemRequest = CartItemDto;

/**
 * 장바구니 아이템 추가 요청
 */
export type AddToCartRequest = CartItemDto; 