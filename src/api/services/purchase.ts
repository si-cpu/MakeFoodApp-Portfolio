import apiClient from '../axios';
import { PurchaseDto } from '../../types/purchase';

const BASE_PATH = '/purchases';

export const purchaseService = {
  /**
   * 구매 기록 다건 저장
   * POST /api/purchases/batch
   */
  savePurchases: (purchases: PurchaseDto[]) =>
    apiClient.post(`${BASE_PATH}/batch`, purchases),

  /**
   * 전체 구매 기록 조회
   * GET /api/purchases/all
   */
  getAllPurchases: () =>
    apiClient.get<PurchaseDto[]>(`${BASE_PATH}/all`),

  /**
   * 구매 정보 수정 (단건)
   * PUT /api/purchases/modify
   */
  updatePurchase: (purchase: PurchaseDto) =>
    apiClient.put<PurchaseDto>(`${BASE_PATH}/modify`, purchase),

  /**
   * 구매 정보 배치 수정
   * PUT /api/purchases/modify
   */
  updatePurchaseBatch: (purchases: PurchaseDto[]) =>
    apiClient.put<PurchaseDto[]>(`${BASE_PATH}/modify`, purchases),

  /**
   * 구매 정보 삭제
   * DELETE /api/purchases/{id}
   */
  deletePurchase: (id: number) =>
    apiClient.delete(`${BASE_PATH}/${id}`),
}; 