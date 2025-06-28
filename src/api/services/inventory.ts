import apiClient from '../axios';
import { 
  InventoryResponse,
  OCRResultRequest
} from '../../types/inventory';

import { InventoryRequest } from '../../types/recipe';

const BASE_PATH = '/inventory';

export const inventoryService = {
  /**
   * 인벤토리 전체 조회
   * GET /api/inventory
   */
  getInventory: () => 
    apiClient.get<InventoryResponse>(BASE_PATH),

  /**
   * 인벤토리 아이템 추가
   * POST /api/inventory
   */
  addItem: (item: InventoryRequest) => 
    apiClient.post<InventoryResponse>(BASE_PATH, item),

  /**
   * 인벤토리 아이템 수정
   * PUT /api/inventory
   */
  updateItem: (updateData: InventoryRequest) => 
    apiClient.put<InventoryResponse>(BASE_PATH, updateData),

  /**
   * 인벤토리 아이템(들) 삭제
   * DELETE /api/inventory
   * RequestBody: InventoryRequest[]
   */
  deleteItems: (requests: InventoryRequest[]) =>
    apiClient.delete<void>(BASE_PATH, { data: requests }),

  /**
   * OCR 결과 저장
   * POST /api/inventory/ocr/save
   */
  saveOcrResult: (ocrData: OCRResultRequest) => 
    apiClient.post<InventoryResponse>(`${BASE_PATH}/ocr/save`, ocrData),

  /**
   * 유통기한 임박 아이템 조회
   * GET /api/inventory/expiring
   */
  getExpiringItems: () => 
    apiClient.get<InventoryResponse>(`${BASE_PATH}/expiring`),

  /**
   * 재고 아이템 일괄 추가
   * POST /api/inventory/batch
   */
  addItemsBatch: (items: InventoryRequest[]) =>
    apiClient.post<InventoryResponse>(`${BASE_PATH}/batch`, items),

  /**
   * 재고 아이템 일괄 소비 처리
   * POST /api/inventory/consume
   */
  consumeItemsBatch: (requests: InventoryRequest[]) =>
    apiClient.post<void>(`${BASE_PATH}/consume`, requests),
}; 