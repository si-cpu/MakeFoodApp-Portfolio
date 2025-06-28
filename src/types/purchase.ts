import { IngredientDto } from './ingredient';

/**
 * UUID 타입 정의
 */
export type UUID = number;

/* eslint-disable @typescript-eslint/no-empty-interface */
// Swagger 스펙 준수를 위해 기존 정의 수정 및 신규 타입 추가

/**
 * 구매 아이템 (Swagger PurchaseDto$PurchaseItem 스펙)
 */
export interface PurchaseItem {
  id?: number; // 수정을 위해 id 추가
  ingredient: IngredientDto;
  quantity: number;
  price: number;
  purchaseDate?: string; // LocalDateTime -> ISO string 형태로 전달됨
}

/**
 * 구매 기록 (Swagger PurchaseDto 스펙)
 */
export interface PurchaseDto {
  id?: number;
  ingredient: IngredientDto;
  quantity: number;
  price: number;
  purchaseDate?: string; // 구매 날짜 추가
  items: PurchaseItem[];
}

/**
 * 구매 항목(Purchase) - PurchaseStatsDto 내부에서 사용
 * 스펙상 PurchaseItem 과 동일 구조이므로 타입 alias 처리
 */
export type Purchase = PurchaseItem;

/**
 * 구매 통계 DTO
 */
export interface PurchaseStatsDto {
  totalSpent: number;   // 총 지출 (double)
  purchases: Purchase[];
  localDate: string;    // 통계 날짜 (yyyy-MM-dd)
}

/**
 * 일/주/월별 통계 DTO (StatDto)
 */
export interface StatDto {
  totalSpent: number;       // 총 지출 (int32)
  purchases: PurchaseDto[]; // PurchaseDto 배열
  localDate: string;        // 통계 날짜 (yyyy-MM-dd)
} 