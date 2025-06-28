import api from '../axios';
import { CartItemDto, UpdateCartItemRequest, AddToCartRequest } from '../../types/cart';

const BASE_PATH = '/cart';

export const cartService = {
  /**
   * 장바구니 조회
   * GET /api/cart
   */
  getCart: async (): Promise<CartItemDto[]> => {
    const response = await api.get('/cart');
    return response.data;
  },

  /**
   * 장바구니 아이템 수량 수정
   * PUT /api/cart
   */
  updateQuantity: async (cartItem: CartItemDto): Promise<void> => {
    await api.put('/cart', cartItem);
  },

  /**
   * 장바구니에서 아이템 삭제
   * DELETE /api/cart/{itemId}
   */
  removeFromCart: (itemId: number) => 
    api.delete(`${BASE_PATH}/${itemId}`),

  /**
   * 장바구니 비우기
   * DELETE /api/cart/clear
   */
  clearCart: () => 
    api.delete(`${BASE_PATH}/clear`),

  /**
   * 장바구니 여러 항목 한번에 추가
   * POST /api/cart/batch
   */
  addToCartBatch: (items: CartItemDto[]) =>
    api.post<void>(`${BASE_PATH}/batch`, items),

  /**
   * 장바구니에 단일 아이템 추가 (임시 우회)
   * POST /api/cart/single
   */
  addSingleItem: (item: CartItemDto) =>
    api.post<void>(`${BASE_PATH}/single`, item),
}; 