/**
 * UUID 타입 정의
 */
export type UUID = number;

/**
 * 계절별 식재료 정보 (Swagger SeasonalIngredient 스펙에 맞게 수정)
 */
export interface SeasonalIngredientDto {
  id: UUID; // string format uuid
  name: string;
  month: 'JANUARY' | 'FEBRUARY' | 'MARCH' | 'APRIL' | 'MAY' | 'JUNE' | 
        'JULY' | 'AUGUST' | 'SEPTEMBER' | 'OCTOBER' | 'NOVEMBER' | 'DECEMBER';
  season: string;
  description: string; // Swagger에서는 필수 필드
  seasonStartMonth: number;
  seasonEndMonth: number;
  imageUrl: string; // Swagger에서는 필수 필드
  // priceIndex, freshnessIndex는 Swagger에 없으므로 제거
} 