// Calorie and nutrition calculation utilities

/**
 * Calculate calories from macronutrients
 */
export function calculateCaloriesFromMacros(
  protein: number,
  carbs: number,
  fat: number
): number {
  // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

/**
 * Calculate calories for a food item based on quantity
 */
export function calculateCaloriesForQuantity(
  baseCalories: number,
  baseQuantity: number,
  targetQuantity: number,
  unit: string = 'g'
): number {
  if (baseQuantity === 0) return 0;
  const ratio = targetQuantity / baseQuantity;
  return Math.round(baseCalories * ratio);
}

/**
 * Parse serving size string (e.g., "100 g", "1 cup", "2 pieces")
 */
export function parseServingSize(servingSize: string): { quantity: number; unit: string } {
  const match = servingSize.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  if (match) {
    return {
      quantity: parseFloat(match[1]),
      unit: match[2].trim(),
    };
  }
  return { quantity: 1, unit: servingSize };
}

/**
 * Convert weight units (simplified - for common conversions)
 */
export function convertWeight(value: number, fromUnit: string, toUnit: string): number {
  const normalizedFrom = fromUnit.toLowerCase().trim();
  const normalizedTo = toUnit.toLowerCase().trim();
  
  // Convert to grams first
  let grams = value;
  if (normalizedFrom === 'kg') grams = value * 1000;
  else if (normalizedFrom === 'oz') grams = value * 28.35;
  else if (normalizedFrom === 'lb' || normalizedFrom === 'lbs') grams = value * 453.6;
  
  // Convert from grams to target unit
  if (normalizedTo === 'kg') return grams / 1000;
  if (normalizedTo === 'oz') return grams / 28.35;
  if (normalizedTo === 'lb' || normalizedTo === 'lbs') return grams / 453.6;
  if (normalizedTo === 'g' || normalizedTo === 'gram' || normalizedTo === 'grams') return grams;
  
  return value; // unknown units, return as-is
}

