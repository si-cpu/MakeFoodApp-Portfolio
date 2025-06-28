export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  category?: string;
  imageUrl?: string;
  description?: string;
}

// Swagger IngredientResponseDto
export interface IngredientResponseDto {
  id: number;       // int32
  name: string;
  unit: string;
}

// Swagger IngredientDto (레시피/장바구니 내부 사용)
export interface IngredientDto {
  ingredientId: number;      // int32
  ingredientName: string;
  amount?: number;           // double (quantity/amount)
  unit?: string;
} 