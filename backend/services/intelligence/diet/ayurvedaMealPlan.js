/**
 * Ayurveda 7-Day Meal Plan Generator
 * 
 * Generates balanced meal plans following Ayurvedic principles:
 * - Lunch as main meal (strongest Agni at midday)
 * - Light breakfast and dinner
 * - Avoid Viruddha Ahara (incompatible food combinations)
 * - Seasonal and constitution-appropriate foods
 * - Proper meal timing (breakfast after sunrise, lunch at noon, dinner before sunset)
 */

const { scoreAllFoods } = require('./ayurvedaDietEngine');

/**
 * Simple seeded pseudo-random number generator (LCG algorithm)
 */
class SeededRandom {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

/**
 * Fisher-Yates shuffle algorithm with seeded randomization
 */
const shuffleArray = (array, seed = 0) => {
  const arr = [...array];
  const rng = new SeededRandom(seed);
  
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Incompatible food combinations (Viruddha Ahara)
 * These should NOT be combined in the same meal
 * CRITICAL RULE: Fruit should NEVER be combined with cooked foods
 */
const INCOMPATIBLE_COMBINATIONS = [
  { food1: 'Dairy', food2: 'Fruit', reason: 'Milk and fruits create toxins (ama)' },
  { food1: 'Dairy', food2: 'Meat', reason: 'Heavy combination, difficult to digest' },
  { food1: 'Dairy', food2: 'Beverage', reason: 'Milk should not be mixed with caffeinated drinks' },
  { food1: 'Fruit', food2: 'Grain', reason: 'Different digestion rates cause fermentation' },
  { food1: 'Fruit', food2: 'Meat', reason: 'Opposite qualities, creates ama' }
];

/**
 * Categories that are considered COOKED/PREPARED foods
 */
const COOKED_CATEGORIES = ['Grain', 'Legume', 'Meat', 'Vegetable', 'Spice'];

/**
 * Categories that should be filtered out from meal suggestions (pure ingredients)
 */
const INGREDIENT_ONLY_CATEGORIES = ['Oil', 'Spice', 'Condiment'];

/**
 * Compound food indicators - foods that contain hidden grains/carbs
 * These should NOT be combined with actual grains
 */
const COMPOUND_FOOD_KEYWORDS = ['Khichdi', 'Rice Bowl', 'Dal Rice', 'Pongal', 'Porridge'];

/**
 * Check if food name contains hidden carbs (is a compound food)
 */
const hasHiddenCarbs = (foodName) => {
  if (!foodName) return false;
  return COMPOUND_FOOD_KEYWORDS.some(keyword => foodName.includes(keyword));
};

/**
 * Check if food is raw/fresh (fruit, fresh vegetables)
 */
const isRawFood = (category) => {
  return ['Fruit', 'Beverage', 'Dairy'].includes(category);
};

/**
 * Check if food is cooked/prepared
 */
const isCookedFood = (category) => {
  return COOKED_CATEGORIES.includes(category);
};

/**
 * Check if food is meant as ingredient only (not a meal item)
 */
const isIngredientOnly = (category) => {
  return INGREDIENT_ONLY_CATEGORIES.includes(category);
};

/**
 * Check if two food categories are incompatible
 */
const areIncompatible = (category1, category2) => {
  // CRITICAL RULE: Fruit + Cooked food combination is forbidden
  if ((category1 === 'Fruit' && isCookedFood(category2)) ||
      (category2 === 'Fruit' && isCookedFood(category1))) {
    return true;
  }

  return INCOMPATIBLE_COMBINATIONS.some(combo =>
    (combo.food1 === category1 && combo.food2 === category2) ||
    (combo.food1 === category2 && combo.food2 === category1)
  );
};

/**
 * Generate breakfast meal
 * - Light, easy to digest
 * - Warm, cooked foods preferred
 * - STRICT: MAX 3 items (NOT more)
 * - NO heavy/fried foods
 * - NO high ama foods
 * - NO fruit + cooked food mixing
 */
const generateBreakfast = (categorizedFoods, agni, usedIngredients, dayNumber, randomOffset = 0) => {
  const { highly_recommended, moderate } = categorizedFoods;
  
  // Filter: NO heavy/fried, NO high ama, NO ingredients
  // CRITICAL: Also filter by meal_type to get only breakfast-suitable items
  const allBreakfastFoods = [...highly_recommended, ...moderate]
    .filter(f => 
      !isIngredientOnly(f.food.category) &&
      f.food.meal_type && f.food.meal_type.includes('breakfast') && // CRITICAL FIX: Check meal_type
      !(f.ayurveda_data.guna && (f.ayurveda_data.guna.includes('fried') || f.ayurveda_data.guna.includes('very-heavy'))) &&
      (f.ayurveda_data.ama_forming_potential || 'low') !== 'high'
    );
  
  // Breakfast categories: Grain, Fruit, Dairy, Beverage
  const breakfastCategories = ['Grain', 'Fruit', 'Dairy', 'Beverage'];
  
  const breakfastFoods = allBreakfastFoods.filter(f => 
    breakfastCategories.includes(f.food.category) &&
    (!f.ayurveda_data.guna || !f.ayurveda_data.guna.includes('Heavy'))
  );
  
  const meal = {
    meal_type: 'Breakfast',
    timing: 'After sunrise (7-8 AM)',
    foods: [],
    validation: { hasFruit: false, hasCookedFood: false }
  };
  
  // Strategy: Pick 2-3 items without duplicate categories
  // Pattern 1: Grain + Beverage (2 items) 
  // Pattern 2: Grain + Fruit + Beverage (3 items, only if no cooked + fruit mix)
  // Pattern 3: Dairy + Beverage (2 items)
  
  const availableGrains = breakfastFoods.filter(f => 
    f.food.category === 'Grain' && 
    !usedIngredients.grains.has(f.food.name)
  );
  const shuffledGrains = shuffleArray(availableGrains, randomOffset);
  const grain = shuffledGrains[0];
  
  const availableFruits = breakfastFoods.filter(f => f.food.category === 'Fruit');
  const shuffledFruits = shuffleArray(availableFruits, randomOffset + dayNumber);
  const fruit = shuffledFruits[0];
  
  const availableDairy = breakfastFoods.filter(f => f.food.category === 'Dairy');
  const shuffledDairy = shuffleArray(availableDairy, randomOffset + dayNumber * 1.5);
  const dairy = shuffledDairy[0];
  
  const availableBeverages = breakfastFoods.filter(f => f.food.category === 'Beverage');
  const shuffledBeverages = shuffleArray(availableBeverages, randomOffset + dayNumber * 2);
  const beverage = shuffledBeverages[0];
  
  // Add grain (1 item)
  if (grain) {
    meal.foods.push({
      food: grain.food,
      portion: agni === 'Slow' ? 'Small' : 'Medium',
      preparation: 'Cooked, warm'
    });
    meal.validation.hasCookedFood = true;
    usedIngredients.grains.add(grain.food.name);
  }
  
  // CRITICAL RULE: Avoid fruit if cooked food is present
  // Fruit should be taken separately, not combined with cooked meals
  // So we add either fruit OR beverage, not both if grain exists
  if (grain && agni !== 'Slow' && beverage) {
    // Grain + beverage (2 items)
    meal.foods.push({
      food: beverage.food,
      portion: '1 cup',
      preparation: 'Warm'
    });
  } else if (!grain && fruit && !dairy) {
    // No grain: can have fruit alone
    meal.foods.push({
      food: fruit.food,
      portion: 'Small',
      preparation: 'Fresh, room temperature',
      note: 'Fruit served separately from cooked foods'
    });
    meal.validation.hasFruit = true;
  } else if (dairy && !grain && beverage) {
    // Alternative: Dairy + beverage (2 items)
    meal.foods.push({
      food: dairy.food,
      portion: 'Small',
      preparation: 'Warm or Room temperature'
    });
    meal.foods.push({
      food: beverage.food,
      portion: '1 cup',
      preparation: 'Warm'
    });
  } else if (beverage && !grain) {
    // Just beverage if no grain
    meal.foods.push({
      food: beverage.food,
      portion: '1 cup',
      preparation: 'Warm'
    });
  }
  
  // VALIDATION: Breakfast must be 1-3 items (NOT more)
  if (meal.foods.length > 3) {
    console.warn('⚠️ CRITICAL: Breakfast exceeds 3 items (' + meal.foods.length + ')! Trimming...');
    meal.foods = meal.foods.slice(0, 3);
  }
  
  // CRITICAL VALIDATION: Prevent fruit + cooked food mix
  const hasFruit = meal.foods.some(f => f.food.is_fruit);
  const hasCooked = meal.foods.some(f => f.food.category === 'Grain' || f.food.category === 'Dairy');
  if (hasFruit && hasCooked) {
    console.warn('⚠️ CRITICAL: Breakfast has fruit + cooked mix! Removing fruit...');
    meal.foods = meal.foods.filter(f => !f.food.is_fruit);
    meal.validation.hasFruit = false;
  }
  
  return meal;
};

/**
 * Generate lunch meal
 * - Main meal of the day (Agni strongest at noon)
 * - STRICT: EXACTLY 3 items (grain + protein + vegetable)
 * - NO duplicate categories, NO heavy fried foods
 * - NO fruit in lunch (fruits should be separate meals)
 * - NO pure ingredients (oils, spices alone)
 */
const generateLunch = (categorizedFoods, dominantDosha, usedIngredients, dayNumber, randomOffset = 0) => {
  const { highly_recommended, moderate } = categorizedFoods;
  
  // Filter: NO ingredients, NO fruits, NO heavy/fried foods
  // CRITICAL: Also filter by meal_type to get only lunch-suitable items
  const allFoods = [...highly_recommended, ...moderate]
    .filter(f => 
      !isIngredientOnly(f.food.category) && // Remove pure ingredients
      f.food.category !== 'Fruit' && // Remove fruits
      f.food.meal_type && f.food.meal_type.includes('lunch') && // CRITICAL FIX: Check meal_type
      !(f.ayurveda_data.guna && (f.ayurveda_data.guna.includes('fried') || f.ayurveda_data.guna.includes('very-heavy')))
    );
  
  const meal = {
    meal_type: 'Lunch',
    timing: 'Midday (12-1 PM) - Main meal',
    foods: [],
    validation: { hasFruit: false, hasCookedFood: false }
  };
  
  // STRICT RULE: Exactly 1 grain (NO duplicate carbs)
  const availableGrains = allFoods.filter(f => 
    f.food.category === 'Grain' && 
    !usedIngredients.grains.has(f.food.name)
  );
  const shuffledGrains = shuffleArray(availableGrains, randomOffset + dayNumber * 3);
  const grain = shuffledGrains[0];
  
  // STRICT RULE: Exactly 1 protein (NO duplicate proteins)
  // CRITICAL: Exclude compound foods if grain already selected (to prevent hidden carbs)
  let availableProteins = [];
  if (dominantDosha === 'pitta') {
    availableProteins = allFoods.filter(f => 
      (f.food.category === 'Legume' || f.food.category === 'Dairy') &&
      !usedIngredients.proteins.has(f.food.name) &&
      (grain ? !hasHiddenCarbs(f.food.food_name) : true) // CRITICAL: Skip compound foods if grain exists
    );
  } else if (dominantDosha === 'kapha') {
    availableProteins = allFoods.filter(f => 
      f.food.category === 'Legume' &&
      !usedIngredients.proteins.has(f.food.name) &&
      (grain ? !hasHiddenCarbs(f.food.food_name) : true) // CRITICAL: Skip compound foods if grain exists
    );
  } else {
    availableProteins = allFoods.filter(f => 
      ['Legume', 'Dairy', 'Meat', 'Nut'].includes(f.food.category) &&
      !usedIngredients.proteins.has(f.food.name) &&
      (grain ? !hasHiddenCarbs(f.food.food_name) : true) // CRITICAL: Skip compound foods if grain exists
    );
  }
  const shuffledProteins = shuffleArray(availableProteins, randomOffset + dayNumber * 4);
  const protein = shuffledProteins[0];
  
  // STRICT RULE: Exactly 1 vegetable (NO multiple vegetables)
  const availableVegetables = allFoods.filter(f => 
    f.food.category === 'Vegetable' &&
    !usedIngredients.vegetables.has(f.food.name)
  );
  
  const shuffledVegetables = shuffleArray(availableVegetables, randomOffset + dayNumber * 5);
  const vegetable = shuffledVegetables[0];
  
  // Add to meal (EXACTLY 3 items: grain + protein + veg)
  if (grain) {
    meal.foods.push({
      food: grain.food,
      portion: 'Large',
      preparation: 'Cooked, warm'
    });
    meal.validation.hasCookedFood = true;
    usedIngredients.grains.add(grain.food.name);
  }
  
  if (protein) {
    meal.foods.push({
      food: protein.food,
      portion: 'Medium',
      preparation: protein.food.category === 'Legume' ? 'Well-cooked, spiced' : 'Cooked, warm',
      note: protein.food.category === 'Legume' ? 'Add cumin to aid digestion' : undefined
    });
    meal.validation.hasCookedFood = true;
    usedIngredients.proteins.add(protein.food.name);
  }
  
  // Add EXACTLY 1 vegetable (NOT multiple)
  if (vegetable) {
    meal.foods.push({
      food: vegetable.food,
      portion: 'Medium',
      preparation: dominantDosha === 'vata' ? 'Cooked with ghee' : 'Lightly cooked'
    });
    meal.validation.hasCookedFood = true;
    usedIngredients.vegetables.add(vegetable.food.name);
  }
  
  // VALIDATION: Lunch MUST be exactly 3 items
  if (meal.foods.length !== 3) {
    console.warn('⚠️ Lunch should have exactly 3 items (grain/protein/veg), got:', meal.foods.length);
  }
  
  // CRITICAL VALIDATION: Check for duplicate carb sources (grain + compound food with grain)
  const hasVisibleGrain = meal.foods.some(f => f.food.category === 'Grain');
  const hasHiddenGrainFood = meal.foods.some(f => hasHiddenCarbs(f.food.food_name));
  if (hasVisibleGrain && hasHiddenGrainFood) {
    console.warn('⚠️ CRITICAL: Lunch has visible grain + compound food with hidden carbs! Removing compound food...');
    meal.foods = meal.foods.filter(f => !hasHiddenCarbs(f.food.food_name));
  }

  return meal;
};

/**
 * Generate dinner meal
 * - Light, easy to digest (VERY STRICT)
 * - Eaten early (before sunset ideally)
 * - STRICT: MAX 2 items (NO overload)
 * - NO fruits, NO pure ingredients, NO heavy/fried
 * - Digestibility ≤ 1-2 only
 * - Must be light soup OR light grain + 1 veg maximum
 */
const generateDinner = (categorizedFoods, dominantDosha, agni, usedIngredients, dayNumber, randomOffset = 0) => {
  const { highly_recommended, moderate } = categorizedFoods;
  
  // Filter: VERY STRICT
  // - NO ingredients
  // - NO fruits
  // - NO heavy/fried/oily foods
  // - Only digestibility_score ≤ 2
  // - CRITICAL: Also filter by meal_type to get only dinner-suitable items
  const allLightFoods = [...highly_recommended, ...moderate]
    .filter(f => 
      !isIngredientOnly(f.food.category) && 
      f.food.category !== 'Fruit' &&
      f.food.meal_type && f.food.meal_type.includes('dinner') && // CRITICAL FIX: Check meal_type
      !(f.ayurveda_data.guna && (f.ayurveda_data.guna.includes('fried') || f.ayurveda_data.guna.includes('heavy') || f.ayurveda_data.guna.includes('oily'))) &&
      (f.food.digestibility_score || 3) <= 2 // CRITICAL FIX: Use f.food.digestibility_score not f.ayurveda_data
    );
  
  const meal = {
    meal_type: 'Dinner',
    timing: 'Early evening (6-7 PM) - Light meal',
    foods: [],
    validation: { hasFruit: false, hasCookedFood: false }
  };
  
  // Strategy: Pick 1 light main item
  // Option 1: Light soup (Beverage category)
  // Option 2: Light grain + light vegetable (max 2 total)
  
  const lightBeverages = allLightFoods.filter(f => f.food.category === 'Beverage');
  const lightGrains = allLightFoods.filter(f => 
    f.food.category === 'Grain' &&
    !usedIngredients.grains.has(f.food.name)
  );
  const lightVegetables = allLightFoods.filter(f => 
    f.food.category === 'Vegetable' &&
    !usedIngredients.vegetables.has(f.food.name)
  );
  
  // Pick strategy: Try soup first (simplest, lightest)
  const decideLightDinner = () => {
    if (lightBeverages.length > 0 && Math.random() > 0.4) {
      // Option A: Soup (1 item) = simplest light dinner
      const shuffledBeverages = shuffleArray(lightBeverages, randomOffset + dayNumber * 8);
      const soup = shuffledBeverages[0];
      return [soup];
    } else if (lightGrains.length > 0 && lightVegetables.length > 0) {
      // Option B: Light grain + light veg (2 items max)
      // CRITICAL: Exclude compound foods from grain selection to avoid double carbs
      const safeGrains = lightGrains.filter(f => !hasHiddenCarbs(f.food.food_name));
      if (safeGrains.length > 0) {
        const shuffledGrains = shuffleArray(safeGrains, randomOffset + dayNumber * 9);
        const shuffledVegetables = shuffleArray(lightVegetables, randomOffset + dayNumber * 10);
        return [shuffledGrains[0], shuffledVegetables[0]];
      }
    }
    if (lightGrains.length > 0) {
      // Fallback: Just grain
      const safeGrains = lightGrains.filter(f => !hasHiddenCarbs(f.food.food_name));
      if (safeGrains.length > 0) {
        const shuffledGrains = shuffleArray(safeGrains, randomOffset + dayNumber * 11);
        return [shuffledGrains[0]];
      } else {
        const shuffledGrains = shuffleArray(lightGrains, randomOffset + dayNumber * 11);
        return [shuffledGrains[0]];
      }
    }
    if (lightVegetables.length > 0) {
      // Fallback: Just vegetable
      const shuffledVegetables = shuffleArray(lightVegetables, randomOffset + dayNumber * 12);
      return [shuffledVegetables[0]];
    }
    return [];
  };
  
  const selectedItems = decideLightDinner();
  
  // Add selected items (MAX 2 items guaranteed)
  selectedItems.forEach((food, index) => {
    if (index >= 2) return; // STRICT: Max 2 items, skip anything beyond
    
    meal.foods.push({
      food: food.food,
      portion: index === 0 ? 'Small' : 'Small',
      preparation: food.food.category === 'Beverage' ? 'Warm' : 'Lightly cooked, warm',
      note: 'Very light, aids digestion before sleep'
    });
    
    meal.validation.hasCookedFood = true;
    
    // Track usage
    if (food.food.category === 'Grain') {
      usedIngredients.grains.add(food.food.name);
    } else if (food.food.category === 'Vegetable') {
      usedIngredients.vegetables.add(food.food.name);
    }
  });
  
  // VALIDATION: Dinner MUST be 1-2 items (NOT more)
  if (meal.foods.length === 0) {
    console.warn('⚠️ Warning: Dinner has no items');
  }
  if (meal.foods.length > 2) {
    console.warn('⚠️ CRITICAL: Dinner exceeds 2 items (' + meal.foods.length + ')! Trimming...');
    meal.foods = meal.foods.slice(0, 2);
  }
  
  // CRITICAL VALIDATION: Check for duplicate carb sources (grain + compound food with grain)
  const dinnerGrainCount = meal.foods.filter(f => 
    f.food.category === 'Grain' || hasHiddenCarbs(f.food.food_name)
  ).length;
  if (dinnerGrainCount > 1) {
    console.warn('⚠️ CRITICAL: Dinner has multiple carb sources! Keeping only first carb...');
    const carbs = [];
    const nonCarbs = [];
    meal.foods.forEach(f => {
      if (f.food.category === 'Grain' || hasHiddenCarbs(f.food.food_name)) {
        if (carbs.length === 0) carbs.push(f);
      } else {
        nonCarbs.push(f);
      }
    });
    meal.foods = [...carbs, ...nonCarbs];
  }

  return meal;
};

/**
 * STRICT AYURVEDIC MEAL PLAN GENERATOR
 * 
 * Generates daily meals following STRICT Ayurvedic rules:
 * - Breakfast: LIGHT (digestibility ≤ 3), NO heavy/fried, NO high ama
 * - Lunch: MAIN meal (grain+protein+vegetable), balanced
 * - Dinner: VERY LIGHT (digestibility ≤ 2), NO high ama, NO fried
 * - NO fruit+cooked combinations, NO duplicate carbs, NO dairy+meat
 * - All meals 3-4 items max
 * 
 * @param {Object} prakritiData - { vata: X, pitta: Y, kapha: Z } from assessment
 * @param {Array} allFoods - All Ayurveda food items from JSON
 * @returns {Object} { breakfast: {meal, reason}, lunch: {meal, reason}, dinner: {meal, reason} }
 */
const generateStrictDailyMealPlan = (prakritiData, allFoods) => {
  if (!prakritiData || !allFoods) {
    throw new Error('Prakriti data and all foods are required');
  }

  // Identify dominant dosha
  const { vata = 0, pitta = 0, kapha = 0 } = prakritiData;
  const doshas = [
    { type: 'vata', score: vata },
    { type: 'pitta', score: pitta },
    { type: 'kapha', score: kapha }
  ].sort((a, b) => b.score - a.score);
  
  const dominantDosha = doshas[0].type;
  console.log(`🧬 Dominant Dosha: ${dominantDosha.toUpperCase()} (V:${vata} P:${pitta} K:${kapha})`);

  /**
   * Filter helper: Check if food can be used in specific meal
   */
  const canUseInBreakfast = (food) => {
    if (!food) return false;
    
    // CRITICAL: Filter by meal_type from JSON
    if (!food.meal_type || !food.meal_type.includes('breakfast')) return false;
    
    const digestibility = food.digestibility_score || 3;
    const ama = food.ama_forming_potential || 'low';
    
    // Rule: digestibility_score ≤ 3
    if (digestibility > 3) return false;
    
    // Rule: NO high ama foods at breakfast
    if (ama === 'high') return false;
    
    // Don't exclude Heavy guna for breakfast (many breakfast foods are naturally heavier)
    // Just avoid very oily foods
    const guna = food.guna || [];
    if (guna.includes('oily') && digestibility > 3) return false;
    
    return true;
  };

  const canUseInDinner = (food) => {
    if (!food) return false;
    
    // CRITICAL: Filter by meal_type from JSON
    if (!food.meal_type || !food.meal_type.includes('dinner')) return false;
    
    const digestibility = food.digestibility_score || 3;
    const ama = food.ama_forming_potential || 'low';
    
    // Rule: digestibility_score ≤ 2 (VERY STRICT for dinner)
    if (digestibility > 2) return false;
    
    // Rule: NO high ama foods at dinner
    if (ama === 'high') return false;
    
    // Rule: NO fried, heavy, oily
    const guna = food.guna || [];
    if (guna.includes('heavy') || guna.includes('oily')) return false;
    
    return true;
  };

  const canUseInLunch = (food) => {
    if (!food) return false;
    
    // CRITICAL: Filter by meal_type from JSON
    if (!food.meal_type || !food.meal_type.includes('lunch')) return false;
    
    // Lunch can include moderate foods, less strict
    return true;
  };

  /**
   * Check if food has incompatible properties
   */
  const isIncompatibleCombination = (existingFoods, newFood) => {
    const fruitsInMeal = existingFoods.some(f => f.category === 'fruit');
    const cookedInMeal = existingFoods.some(f => f.guna && f.guna.includes('cooked'));
    const dairyInMeal = existingFoods.some(f => f.category === 'dairy');
    const meatInMeal = existingFoods.some(f => f.category === 'meat');

    // Rule: NEVER combine fruit with cooked meals
    if (fruitsInMeal && cookedInMeal && newFood.category !== 'fruit') {
      return true;
    }
    if (newFood.category === 'fruit' && cookedInMeal) {
      return true;
    }

    // Rule: NEVER combine dairy with meat
    if (dairyInMeal && newFood.category === 'meat') return true;
    if (meatInMeal && newFood.category === 'dairy') return true;

    return false;
  };

  /**
   * Generate STRICT Breakfast (max 3 items: main + beverage)
   */
  const generateStrictBreakfast = () => {
    // Filter for breakfast-suitable foods
    const breakfastFoods = allFoods.filter(canUseInBreakfast);
    
    if (breakfastFoods.length === 0) {
      throw new Error('No suitable breakfast foods found');
    }

    // Group by role
    const mains = breakfastFoods.filter(f => f.role === 'main' || f.category === 'grain');
    const beverages = breakfastFoods.filter(f => f.category === 'beverage');

    // Select 1 main + 1 beverage
    const meal = [];
    const reasons = [];

    if (mains.length > 0) {
      const mainFood = mains[Math.floor(Math.random() * mains.length)];
      meal.push(mainFood.food_name || mainFood.name);
      reasons.push(`Light, easy-to-digest main (digestibility score ${mainFood.digestibility_score || 1})`);
    }

    if (beverages.length > 0) {
      const beverage = beverages[Math.floor(Math.random() * beverages.length)];
      meal.push(beverage.food_name || beverage.name);
      reasons.push('Warm beverage for digestion');
    }

    // Validation
    if (meal.length < 1) throw new Error('Failed to generate breakfast');
    if (meal.length > 3) throw new Error('Breakfast exceeds 3 items');

    return { meal, reason: reasons };
  };

  /**
   * Generate STRICT Lunch (exactly: 1 grain + 1 protein + 1 vegetable)
   */
  const generateStrictLunch = () => {
    const lunchFoods = allFoods.filter(canUseInLunch);

    // Group by category
    const grains = lunchFoods.filter(f => f.category === 'grain');
    const proteins = lunchFoods.filter(f => ['legume', 'dairy', 'meat', 'nut'].includes(f.category));
    const vegetables = lunchFoods.filter(f => f.category === 'vegetable');

    const meal = [];
    const reasons = [];

    // Rule: NO duplicate carbs - select exactly 1 grain
    if (grains.length > 0) {
      const grain = grains[Math.floor(Math.random() * grains.length)];
      meal.push(grain.food_name || grain.name);

      // Dosha-specific selection
      if (dominantDosha === 'vata') {
        reasons.push('Warm, grounding grain to balance Vata');
      } else if (dominantDosha === 'pitta') {
        reasons.push('Cooling grain to balance Pitta');
      } else {
        reasons.push('Light grain to balance Kapha');
      }
    }

    // Rule: exactly 1 protein
    if (proteins.length > 0) {
      // Filter by dosha
      let selectedProteins = proteins;
      if (dominantDosha === 'kapha') {
        selectedProteins = proteins.filter(p => p.category !== 'dairy'); // Kapha avoid dairy
      } else if (dominantDosha === 'pitta') {
        selectedProteins = proteins.filter(p => p.category !== 'meat'); // Pitta avoid meat (heating)
      }

      if (selectedProteins.length === 0) selectedProteins = proteins;
      
      const protein = selectedProteins[Math.floor(Math.random() * selectedProteins.length)];
      meal.push(protein.food_name || protein.name);
      reasons.push(`${protein.category} protein for strength`);
    }

    // Rule: exactly 1 vegetable
    if (vegetables.length > 0) {
      const vegetable = vegetables[Math.floor(Math.random() * vegetables.length)];
      meal.push(vegetable.food_name || vegetable.name);
      reasons.push('Cooked vegetable for nutrition');
    }

    // Validation
    if (meal.length < 3) throw new Error('Lunch requires grain + protein + vegetable');
    if (meal.length > 4) throw new Error('Lunch exceeds 4 items');

    return { meal, reason: reasons };
  };

  /**
   * Generate STRICT Dinner (max 2 items: very light main + optional side)
   */
  const generateStrictDinner = () => {
    const dinnerFoods = allFoods.filter(canUseInDinner);

    if (dinnerFoods.length === 0) {
      throw new Error('No suitable dinner foods found (too strict filtering)');
    }

    // Prefer very light items
    const veryLight = dinnerFoods.filter(f => (f.digestibility_score || 0) <= 1);
    const selectedFoods = veryLight.length > 0 ? veryLight : dinnerFoods;

    const meal = [];
    const reasons = [];

    // Select 1 very light main
    const mainFood = selectedFoods[Math.floor(Math.random() * selectedFoods.length)];
    meal.push(mainFood.food_name || mainFood.name);
    reasons.push(`Very light main (digestibility score ${mainFood.digestibility_score || 1})`);

    // Optional side if available (optional, not required)
    if (selectedFoods.length > 1 && Math.random() > 0.5) {
      const sideFood = selectedFoods[Math.floor(Math.random() * selectedFoods.length)];
      if (sideFood.food_name !== meal[0]) {
        meal.push(sideFood.food_name || sideFood.name);
        reasons.push('Light accompaniment');
      }
    }

    // Validation
    if (meal.length < 1) throw new Error('Failed to generate dinner');
    if (meal.length > 2) throw new Error('Dinner exceeds 2 items');

    return { meal, reason: reasons };
  };

  // Generate all three meals
  const breakfast = generateStrictBreakfast();
  const lunch = generateStrictLunch();
  const dinner = generateStrictDinner();

  // VALIDATION STEP
  console.log('✅ Validating meal plan against strict rules...');
  
  // Validate: No fruit + cooked combination
  const hasInvalidFruitCombo = (meal) => {
    const hasFruit = meal.some(name => allFoods.find(f => (f.food_name === name || f.name === name) && f.category === 'fruit'));
    const hasCooked = meal.some(name => allFoods.find(f => (f.food_name === name || f.name === name) && f.role !== 'beverage'));
    return hasFruit && hasCooked;
  };

  if (hasInvalidFruitCombo(breakfast.meal)) throw new Error('INVALID: Breakfast has fruit + cooked combination');
  if (hasInvalidFruitCombo(lunch.meal)) throw new Error('INVALID: Lunch has fruit + cooked combination');
  if (hasInvalidFruitCombo(dinner.meal)) throw new Error('INVALID: Dinner has fruit + cooked combination');

  // Validate: No duplicate carbs in lunch
  const lunchGrains = lunch.meal.filter(name => allFoods.find(f => (f.food_name === name || f.name === name) && f.category === 'grain'));
  if (lunchGrains.length > 1) throw new Error('INVALID: Lunch has duplicate grains');

  // Validate: Max items per meal
  if (breakfast.meal.length > 3) throw new Error('INVALID: Breakfast exceeds 3 items');
  if (lunch.meal.length > 4) throw new Error('INVALID: Lunch exceeds 4 items');
  if (dinner.meal.length > 2) throw new Error('INVALID: Dinner exceeds 2 items');

  console.log('✅ All validations passed!');

  return {
    breakfast,
    lunch,
    dinner,
    doshaProfile: { vata, pitta, kapha },
    dominantDosha
  };
};

/**
 * Generate complete 7-day meal plan
 * 
 * @param {Object} assessmentResult - Ayurveda assessment results
 * @param {Object} categorizedFoods - Foods sorted by recommendation tier
 * @returns {Array} 7-day meal plan
 */
const generateWeeklyPlan = (assessmentResult, categorizedFoods) => {
  const { dominant_dosha, agni } = assessmentResult;
  
  // Generate a random offset based on timestamp for true variety on regeneration
  const randomOffset = Date.now() % 1000000 + Math.floor(Math.random() * 100000);
  console.log('🔀 Ayurveda random offset for plan variety:', randomOffset);
  
  const weeklyPlan = [];
  
  // Track ingredient usage to ensure variety
  const weeklyUsage = {
    grains: new Set(),
    proteins: new Set(),
    vegetables: new Set()
  };
  
  for (let day = 1; day <= 7; day++) {
    // Use the weekly tracking directly - no resetting for true 7-day variety
    const dayUsage = weeklyUsage;
    
    const dayPlan = {
      day: day,
      day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(day - 1) % 7],
      meals: []
    };
    
    // Generate meals with unique ingredients across all 7 days (pass random offset)
    dayPlan.meals.push(generateBreakfast(categorizedFoods, agni, dayUsage, day, randomOffset));
    dayPlan.meals.push(generateLunch(categorizedFoods, dominant_dosha, dayUsage, day, randomOffset));
    dayPlan.meals.push(generateDinner(categorizedFoods, dominant_dosha, agni, dayUsage, day, randomOffset));
    
    // Add general guidelines
    dayPlan.guidelines = [
      'Eat in a calm environment',
      'Main meal at midday when Agni is strongest',
      'Avoid cold drinks with meals',
      'Leave 3-4 hours between meals'
    ];
    
    // Dosha-specific guidelines
    if (dominant_dosha === 'vata') {
      dayPlan.guidelines.push('Favor warm, oily, grounding foods');
      dayPlan.guidelines.push('Eat at regular times');
    } else if (dominant_dosha === 'pitta') {
      dayPlan.guidelines.push('Favor cooling, non-spicy foods');
      dayPlan.guidelines.push('Avoid skipping meals');
    } else if (dominant_dosha === 'kapha') {
      dayPlan.guidelines.push('Favor light, dry, warm foods');
      dayPlan.guidelines.push('Can skip breakfast if not hungry');
    }
    
    weeklyPlan.push(dayPlan);
  }
  
  return weeklyPlan;
};

/**
 * Generate meal plan reasoning/summary
 */
const generateReasoning = (assessmentResult, categorizedFoods) => {
  const { dominant_dosha, severity, agni, prakriti, vikriti } = assessmentResult;
  
  return {
    constitution_summary: `Dominant Dosha: ${dominant_dosha.charAt(0).toUpperCase() + dominant_dosha.slice(1)} (${severity === 3 ? 'Severe' : severity === 2 ? 'Moderate' : 'Mild'} imbalance)`,
    agni_type: `Digestive Fire: ${agni}`,
    
    primary_goal: `Balance ${dominant_dosha.charAt(0).toUpperCase() + dominant_dosha.slice(1)} dosha through foods that decrease ${dominant_dosha} qualities`,
    
    dietary_approach: severity >= 2 
      ? `Strict ${dominant_dosha}-pacifying diet with strong emphasis on balancing foods`
      : `Gentle ${dominant_dosha}-balancing diet with moderate restrictions`,
    
    meal_timing: agni === 'Variable' 
      ? 'Regular meal times crucial; avoid skipping meals'
      : agni === 'Sharp'
      ? 'Never skip meals; eat on time to prevent aggravation'
      : agni === 'Slow'
      ? 'Light meals; can skip breakfast if not hungry; avoid overeating'
      : 'Flexible timing; maintain consistency',
    
    key_principles: [
      `Favor foods that DECREASE ${dominant_dosha}`,
      'Lunch as main meal (strongest Agni at midday)',
      'Light, warm breakfast and dinner',
      'Avoid incompatible food combinations (Viruddha Ahara)',
      'Eat seasonally appropriate foods'
    ],
    
    foods_to_emphasize: categorizedFoods.highly_recommended.slice(0, 10).map(f => f.food.name),
    foods_to_avoid: categorizedFoods.avoid.slice(0, 10).map(f => f.food.name)
  };
};

module.exports = {
  generateWeeklyPlan,
  generateReasoning,
  generateStrictDailyMealPlan
};
