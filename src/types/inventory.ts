/**
 * UUID 타입 정의
 */
export type UUID = number;

/**
 * 재료 정보 (Swagger Ingredient 스펙)
 */
export interface Ingredient {
  id: number;
  name: string;
  unit: string;
}

/**
 * 인벤토리 아이템 (Swagger InventoryDto 스펙)
 */
export interface InventoryDto {
  id: number;
  ingredient: Ingredient;
  quantity: number;
  purchaseDate: string; // date format
  expiryDate: string;   // date format
  isConsumed: boolean;
  createdAt: string;    // date format
  updatedAt: string;    // date format
}

/**
 * 인벤토리 응답 (Swagger InventoryResponse 스펙)
 */
export interface InventoryResponse {
  message: string;
  items: InventoryDto[];
}

/**
 * OCR 아이템 (Swagger OCRItem 스펙)
 */
export interface OCRItem {
  itemName: string;
  quantity: number;
  unit: string;
  price: number; // int32 in swagger
}

/**
 * OCR 결과 요청 (Swagger OCRResultRequest 스펙)
 */
export interface OCRResultRequest {
  items: OCRItem[];
  purchaseDate: string;
} 