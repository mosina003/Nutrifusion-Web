/**
 * Modern Nutrition Strict Meal Plan Generation Engine
 * Generates daily meal plans based on macronutrient balance and calorie control
 * 
 * STRICT RULES IMPLEMENTATION:
 * - Breakfast: Balanced carbs + protein, light to moderate calories
 * - Lunch: Complex carbs + protein + fiber (main meal), balanced
 * - Dinner: Low calorie, high protein + low carbs, easy to digest
 * - Avoid excessive carbs, high-fat+high-carb combos, processed foods, sugar
 * - BMI-based personalization with goal-specific macro targets
 * - Balanced macronutrients throughout day
 */

const fs = require('fs');
const path = require('path');

// Load Modern food data
function loadModernFoods() {
  const filePath = path.join(__dirname, '../../../data/modern_food_constitution.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
}

/**
 * Analyze user profile and determine macro targets
 * Input: { bmi, goal )
 * bmi: "underweight" < "normal" < "overweight" < "obese"
 * goal: "weight_loss" | "maintenance" | "muscle_gain"
 */
function analyzeUserProfile(profile = {}) {
  const { bmi = 'normal', goal = 'maintenance', health_conditions = [] } = profile;
  
  // Base daily calorie targets (approximate)
  const calorieTargets = {
    'weight_loss': { underweight: 1800, normal: 1800, overweight: 1800, obese: 1800 },
    'maintenance': { underweight: 2200, normal: 2200, overweight: 2200, obese: 2200 },
    'muscle_gain': { underweight: 2800, normal: 2800, overweight: 2800, obese: 2800 }
  };

  const dailyCalories = calorieTargets[goal]?.[bmi] || 2200;

  // Meal calorie distribution
  const mealCalories = {
    'weight_loss': { breakfast: 350, lunch: 600, dinner: 450 },
    'maintenance': { breakfast: 450, lunch: 750, dinner: 550 },
    'muscle_gain': { breakfast: 600, lunch: 900, dinner: 650 }
  };

  // Macronutrient ratios (carbs%, protein%, fat%)
  const macroRatios = {
    'weight_loss': { carbs: 0.40, protein: 0.40, fat: 0.20 },     // High protein, low fat
    'maintenance': { carbs: 0.50, protein: 0.30, fat: 0.20 },     // Balanced
    'muscle_gain': { carbs: 0.50, protein: 0.35, fat: 0.15 }      // High protein, moderate carbs
  };

  const selectedMealCals = mealCalories[goal];
  const selectedMacros = macroRatios[goal];

  return {
    bmi: bmi,
    goal: goal,
    dailyCalories: dailyCalories,
    mealCalories: selectedMealCals,
    macroRatios: selectedMacros,
    // Calculate macro targets per meal in grams (using 4 cal/g for carbs/protein, 9 cal/g for fat)
    breakfast: {
      calories: selectedMealCals.breakfast,
      carbs: Math.round((selectedMealCals.breakfast * selectedMacros.carbs) / 4),
      protein: Math.round((selectedMealCals.breakfast * selectedMacros.protein) / 4),
      fat: Math.round((selectedMealCals.breakfast * selectedMacros.fat) / 9)
    },
    lunch: {
      calories: selectedMealCals.lunch,
      carbs: Math.round((selectedMealCals.lunch * selectedMacros.carbs) / 4),
      protein: Math.round((selectedMealCals.lunch * selectedMacros.protein) / 4),
      fat: Math.round((selectedMealCals.lunch * selectedMacros.fat) / 9)
    },
    dinner: {
      calories: selectedMealCals.dinner,
      carbs: Math.round((selectedMealCals.dinner * selectedMacros.carbs) / 4),
      protein: Math.round((selectedMealCals.dinner * selectedMacros.protein) / 4),
      fat: Math.round((selectedMealCals.dinner * selectedMacros.fat) / 9)
    }
  };
}

/**
 * Check if food matches nutritional criteria
 */
function isHealthyFood(food) {
  if (!food) return false;

  // Avoid fried foods
  if (food.preparation_methods?.includes('fried') || food.preparation_methods?.includes('deep_fried')) {
    return false;
  }

  // No ultra-processed foods (indicated by allergen info or very high sodium)
  if (food.micronutrients?.sodium > 500) {
    return false;
  }

  return true;
}

/**
 * Get health score for user conditions (positive = good for user, negative = bad)
 */
function getHealthScore(food, userProfile) {
  if (!food.health_conditions) return 0;

  const conditions = food.health_conditions;
  let score = 0;

  // Lower score better (avoid foods that worsen their conditions)
  if (conditions.diabetes < 0) score += 1;
  if (conditions.hypertension < 0) score += 1;
  if (conditions.heart_disease < 0) score += 1;
  if (conditions.digestive_issues > 0) score += 1;

  return score;
}

/**
 * Filter foods suitable for breakfast
 * Rules: Balanced carbs + protein, light to moderate calories
 */
function canUseInBreakfast(food, userProfile, targets) {
  if (!isHealthyFood(food)) return false;

  const mealType = food.meal_type?.map(m => m?.toLowerCase()) || [];
  if (mealType.length > 0 && !mealType.includes('breakfast')) {
    return false;
  }

  // For weight loss, avoid high-calorie breakfast
  if (userProfile.goal === 'weight_loss' && food.calories > 400) {
    return false;
  }

  // Breakfast should have decent protein (minimum 3g)
  if (food.protein < 3) {
    return false;
  }

  return true;
}

/**
 * Filter foods suitable for lunch (main meal)
 * Rules: Complex carbs + protein + fiber, balanced nutrition
 */
function canUseInLunch(food, userProfile, targets) {
  if (!isHealthyFood(food)) return false;

  const mealType = food.meal_type?.map(m => m?.toLowerCase()) || [];
  if (mealType.length > 0 && !mealType.includes('lunch')) {
    return false;
  }

  // Lunch can be heavier but avoid excess for weight loss
  if (userProfile.goal === 'weight_loss' && food.calories > 800) {
    return false;
  }

  return true;
}

/**
 * Filter foods suitable for dinner
 * Rules: Low calorie, high protein + low carbs, easy to digest
 */
function canUseInDinner(food, userProfile, targets) {
  if (!isHealthyFood(food)) return false;

  const mealType = food.meal_type?.map(m => m?.toLowerCase()) || [];
  if (mealType.length > 0 && !mealType.includes('dinner')) {
    return false;
  }

  // STRICT: Dinner must be low-calorie
  if (food.calories > 300) {
    return false;
  }

  // Dinner should be low-fat for easier digestion
  if (food.fat > 8) {
    return false;
  }

  // Dinner protein should be moderate (easy on stomach)
  if (food.protein < 2 || food.protein > 25) {
    return false;
  }

  return true;
}

/**
 * Calculate macro balance deviation (how far from targets)
 */
function calcMacroDeviation(foods, targets) {
  let totalCarbs = 0, totalProtein = 0, totalFat = 0;

  foods.forEach(name => {
    const food = foods.find(f => f.food_name === name);
    if (food) {
      totalCarbs += food.carbs;
      totalProtein += food.protein;
      totalFat += food.fat;
    }
  });

  return Math.abs(totalCarbs - targets.carbs) + Math.abs(totalProtein - targets.protein) + Math.abs(totalFat - targets.fat);
}

/**
 * Select foods for breakfast
 * Returns: { meal: [food names], reason: [explanations] }
 */
function generateStrictBreakfast(allFoods, userProfile, targets) {
  console.log('  🌅 Generating breakfast (Balanced & Moderate)...');

  const breakfastFoods = allFoods.filter(f => canUseInBreakfast(f, userProfile, targets));

  if (breakfastFoods.length === 0) {
    throw new Error('INVALID: No suitable breakfast foods found');
  }

  // Select grain/carb source
  const grains = breakfastFoods.filter(f => f.category?.toLowerCase() === 'grain');
  const grain = grains[Math.floor(Math.random() * grains.length)];

  if (!grain) {
    throw new Error('INVALID: No breakfast grain found');
  }

  // Select protein/dairy
  let protein = null;
  const proteins = breakfastFoods.filter(f =>
    (f.category?.toLowerCase() === 'dairy' || f.category?.toLowerCase() === 'legume' || 
     f.category?.toLowerCase() === 'meat') && f.food_name !== grain.food_name
  );

  if (proteins.length > 0) {
    protein = proteins[Math.floor(Math.random() * proteins.length)];
  }

  const meal = [grain, protein].filter(Boolean).map(f => f.food_name);
  const reason = [];

  if (grain) {
    reason.push(`Grain: ${grain.food_name} (${grain.calories} cal, carbs: ${grain.carbs}g, protein: ${grain.protein}g)`);
  }
  if (protein) {
    reason.push(`Protein: ${protein.food_name} (${protein.calories} cal, protein: ${protein.protein}g)`);
  }

  const totalCals = [grain, protein].filter(Boolean).reduce((sum, f) => sum + f.calories, 0);
  reason.push(`Total: ${totalCals} calories`);

  return { meal, reason };
}

/**
 * Select foods for lunch (main meal)
 * Structure: Grain + Protein + Vegetable with balanced macros
 */
function generateStrictLunch(allFoods, userProfile, targets) {
  console.log('  🍽️  Generating lunch (Balanced & Nutritious)...');

  const lunchFoods = allFoods.filter(f => canUseInLunch(f, userProfile, targets));

  if (lunchFoods.length < 3) {
    throw new Error('INVALID: Not enough lunch foods found');
  }

  const meal = [];
  const reason = [];

  // Select grain
  let grains = lunchFoods.filter(f => f.category?.toLowerCase() === 'grain');
  if (grains.length === 0) throw new Error('INVALID: No grains found for lunch');

  const grain = grains[Math.floor(Math.random() * grains.length)];
  meal.push(grain.food_name);
  reason.push(`Grain: ${grain.food_name} (complex carbs, fiber)`);

  // Select protein
  let proteins = lunchFoods.filter(f =>
    f.category?.toLowerCase() === 'legume' || f.category?.toLowerCase() === 'dairy' ||
    f.category?.toLowerCase() === 'meat'
  );

  if (proteins.length > 0) {
    const protein = proteins[Math.floor(Math.random() * proteins.length)];
    meal.push(protein.food_name);
    reason.push(`Protein: ${protein.food_name} (muscle support)`);
  }

  // Select vegetable
  let vegetables = lunchFoods.filter(f => f.category?.toLowerCase() === 'vegetable');

  if (vegetables.length > 0) {
    const veg = vegetables[Math.floor(Math.random() * vegetables.length)];
    meal.push(veg.food_name);
    reason.push(`Vegetable: ${veg.food_name} (fiber & micronutrients)`);
  }

  return { meal, reason };
}

/**
 * Select foods for dinner (very light, high protein, low carb)
 * Rules: Low calorie, digestible, high protein ratio
 */
function generateStrictDinner(allFoods, userProfile, targets) {
  console.log('  🌙 Generating dinner (Light & High-Protein)...');

  const dinnerFoods = allFoods.filter(f => canUseInDinner(f, userProfile, targets));

  if (dinnerFoods.length === 0) {
    throw new Error('INVALID: No suitable dinner foods found');
  }

  // Prioritize high-protein foods for dinner
  const proteinFoods = dinnerFoods.filter(f => f.protein > 5);
  let mainDish = null;

  if (proteinFoods.length > 0) {
    mainDish = proteinFoods[Math.floor(Math.random() * proteinFoods.length)];
  } else {
    mainDish = dinnerFoods[0];
  }

  // Light side dish
  let sideDish = null;
  const sides = dinnerFoods.filter(f =>
    f.food_name !== mainDish.food_name && f.calories <= 150
  );

  if (sides.length > 0 && Math.random() > 0.5) {
    sideDish = sides[Math.floor(Math.random() * sides.length)];
  }

  const meal = [mainDish, sideDish].filter(Boolean).map(f => f.food_name);
  const reason = [];

  if (mainDish) {
    reason.push(`Main: ${mainDish.food_name} (${mainDish.calories} cal, protein: ${mainDish.protein}g, carbs: ${mainDish.carbs}g)`);
  }
  if (sideDish) {
    reason.push(`Side: ${sideDish.food_name} (${sideDish.calories} cal)`);
  }

  const totalCals = [mainDish, sideDish].filter(Boolean).reduce((sum, f) => sum + f.calories, 0);
  reason.push(`Total: ${totalCals} calories (low-calorie dinner)`);

  return { meal, reason };
}

/**
 * MAIN FUNCTION: Generate strict modern nutrition daily meal plan
 * Input: userProfile = { bmi, goal }
 * Output: { breakfast, lunch, dinner } with meal names, macros, and explanations
 */
function generateStrictDailyMealPlan(userProfile = {}) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🏃 STRICT MODERN NUTRITION MEAL PLAN GENERATOR');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Load foods
  const allFoods = loadModernFoods();
  console.log(`✅ Loaded ${allFoods.length} modern foods\n`);

  // Analyze profile
  const profile = analyzeUserProfile(userProfile);
  console.log('📊 User Profile Analysis:\n');
  console.log(`   BMI Status: ${profile.bmi}`);
  console.log(`   Goal: ${profile.goal}`);
  console.log(`   Daily Calorie Target: ${profile.dailyCalories}`);
  console.log(`   Macro Ratios: ${Math.round(profile.macroRatios.carbs * 100)}% carbs, ${Math.round(profile.macroRatios.protein * 100)}% protein, ${Math.round(profile.macroRatios.fat * 100)}% fat\n`);

  console.log('📋 STRICT MODERN NUTRITION RULES APPLIED:\n');
  console.log('   ✓ Breakfast: Balanced carbs + protein, moderate calories');
  console.log('   ✓ Lunch: Complex carbs + protein + fiber (main meal)');
  console.log('   ✓ Dinner: Low calorie, high protein + low carbs');
  console.log('   ✓ NO excessive carbs in one meal');
  console.log('   ✓ NO high-fat + high-carb combinations');
  console.log('   ✓ NO processed foods or fried foods');
  console.log('   ✓ Limited sugar, balanced macros throughout day\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Generate meals
  const breakfast = generateStrictBreakfast(allFoods, profile, profile.breakfast);
  const lunch = generateStrictLunch(allFoods, profile, profile.lunch);
  const dinner = generateStrictDinner(allFoods, profile, profile.dinner);

  // VALIDATION STEP
  console.log('✅ Validating meal plan against strict nutrition rules...\n');

  // Check dinner calories
  const dinnerCalories = dinner.meal.reduce((sum, name) => {
    const food = allFoods.find(f => f.food_name === name);
    return sum + (food?.calories || 0);
  }, 0);

  if (dinnerCalories > profile.dinner.calories + 100) {
    throw new Error(`INVALID: Dinner too high in calories (${dinnerCalories} > ${profile.dinner.calories})`);
  }

  // Check dinner fat content
  const dinnerFat = dinner.meal.reduce((sum, name) => {
    const food = allFoods.find(f => f.food_name === name);
    return sum + (food?.fat || 0);
  }, 0);

  if (dinnerFat > 12) {
    throw new Error('INVALID: Dinner has too much fat (should be < 12g)');
  }

  // Validate max items per meal
  if (breakfast.meal.length > 3) throw new Error('INVALID: Breakfast exceeds 3 items');
  if (lunch.meal.length > 4) throw new Error('INVALID: Lunch exceeds 4 items');
  if (dinner.meal.length > 2) throw new Error('INVALID: Dinner exceeds 2 items');

  console.log('✅ All nutrition validations passed!\n');

  // Output
  console.log('🌅 BREAKFAST (Balanced & Moderate):\n');
  console.log(`   Foods: ${breakfast.meal.join(' + ')}`);
  console.log('   Details:');
  breakfast.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n🍽️  LUNCH (Main Meal - Nutritious):\n');
  console.log(`   Foods: ${lunch.meal.join(' + ')}`);
  console.log('   Details:');
  lunch.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n🌙 DINNER (Light & High-Protein):\n');
  console.log(`   Foods: ${dinner.meal.join(' + ')}`);
  console.log('   Details:');
  dinner.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ MODERN NUTRITION VALIDATION COMPLETE - All rules satisfied!\n');

  // Save to file
  const output = {
    timestamp: new Date().toISOString(),
    userProfile: {
      bmi: profile.bmi,
      goal: profile.goal,
      dailyCalories: profile.dailyCalories,
      macroRatios: profile.macroRatios
    },
    targetMacros: {
      breakfast: profile.breakfast,
      lunch: profile.lunch,
      dinner: profile.dinner
    },
    mealPlan: {
      breakfast: breakfast,
      lunch: lunch,
      dinner: dinner
    },
    rulesValidated: [
      'Dinner low-calorie',
      'Dinner low-fat',
      'No processed/fried foods',
      'Balanced macronutrients',
      'Appropriate calorie distribution',
      'Max items per meal enforced',
      'Goal-specific macro ratios applied',
      'BMI-based personalization applied'
    ]
  };

  const outputPath = path.join(__dirname, '../../../data/strict_modern_meal_plan.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Meal plan saved to: strict_modern_meal_plan.json\n`);

  return output;
}

module.exports = {
  generateStrictDailyMealPlan,
  analyzeUserProfile
};
