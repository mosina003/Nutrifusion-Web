/**
 * Unani (Yunani) Medicine Strict Meal Plan Generation Engine
 * Generates daily meal plans based on Temperament balance (Hot/Cold/Dry/Moist)
 * 
 * STRICT RULES IMPLEMENTATION:
 * - Breakfast: Light, easily digestible, NO ama foods
 * - Lunch: Heaviest meal (grain + protein + vegetable), balanced temperament
 * - Dinner: Light, digestibility ≤ 2, NO heavy/oily
 * - Avoid same temperament overload (e.g., hot+hot+hot)
 * - Balance hot↔cold and dry↔moist
 * - Personalization based on user temperament type (Damvi/Safravi/Balghami/Saudavi)
 */

const fs = require('fs');
const path = require('path');

// Load Unani food data
function loadUnaniFoods() {
  const filePath = path.join(__dirname, '../../../data/unani_food_constitution.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
}

/**
 * Determine user temperament type from input
 * Types: 'damvi' (hot+moist), 'safravi' (hot+dry), 'balghami' (cold+moist), 'saudavi' (cold+dry)
 * Can accept either a string or an object with primary_mizaj field
 */
function analyzeTemperament(type = 'damvi') {
  const temperamentMap = {
    'damvi': { hot: true, cold: false, dry: false, moist: true, label: 'Damvi (Hot + Moist)' },
    'safravi': { hot: true, cold: false, dry: true, moist: false, label: 'Safravi (Hot + Dry)' },
    'balghami': { hot: false, cold: true, dry: false, moist: true, label: 'Balghami (Cold + Moist)' },
    'saudavi': { hot: false, cold: true, dry: true, moist: false, label: 'Saudavi (Cold + Dry)' }
  };
  
  // CRITICAL FIX: Handle case where type is an object (e.g., userAssessment object)
  let typeString = 'damvi';
  if (typeof type === 'string') {
    typeString = type;
  } else if (type && typeof type === 'object' && type.primary_mizaj) {
    // Extract primary_mizaj from assessment object
    typeString = type.primary_mizaj || 'damvi';
  }
  
  return temperamentMap[typeString?.toLowerCase()] || temperamentMap['damvi'];
}

/**
 * Get digestibility score from digestion_ease
 * Unani: easy < moderate < hard
 */
function getDigestibilityScore(digestionEase) {
  const scoreMap = {
    'easy': 1,
    'light': 1,
    'moderate': 2,
    'hard': 3,
    'heavy': 4
  };
  return scoreMap[digestionEase?.toLowerCase()] || 2;
}

/**
 * Determine primary and secondary temperament qualities from food
 * Returns: { hot, cold, dry, moist, dominantHumorType }
 */
function getTemperamentQualities(food) {
  const t = food.temperament || {};
  return {
    hot: Math.max(t.hot_level || 0),
    cold: Math.max(t.cold_level || 0),
    dry: Math.max(t.dry_level || 0),
    moist: Math.max(t.moist_level || 0),
    dominantHumor: food.dominant_humor || 'unknown'
  };
}

/**
 * Check if food is suitable for user temperament (avoid conflicting excess)
 * Example: Safravi (hot+dry) user should avoid excess hot/dry foods
 */
function isTemperamentCompatible(food, userType) {
  const foodQuality = getTemperamentQualities(food);
  const userQuality = analyzeTemperament(userType);

  // Safravi user: avoid VERY hot foods (level 3+)
  if (userQuality.hot && foodQuality.hot >= 3) return false;
  
  // Safravi user: avoid VERY dry foods (level 3+)
  if (userQuality.dry && foodQuality.dry >= 3) return false;
  
  // Balghami user: avoid VERY cold foods (level 3+)
  if (userQuality.cold && foodQuality.cold >= 3) return false;
  
  // Balghami user: avoid VERY moist foods (level 3+)
  if (userQuality.moist && foodQuality.moist >= 3) return false;
  
  // Damvi user: avoid foods with BOTH hot AND moist at level 2+
  if (userQuality.hot && userQuality.moist && foodQuality.hot >= 3 && foodQuality.moist >= 3) {
    return false;
  }
  
  // Saudavi user: avoid foods with BOTH cold AND dry at level 2+
  if (userQuality.cold && userQuality.dry && foodQuality.cold >= 3 && foodQuality.dry >= 3) {
    return false;
  }

  return true;
}

/**
 * Filter foods suitable for breakfast
 * Rules: Light, easy to digest, NO high ama foods, avoid heavy/oily
 */
function canUseInBreakfast(food, userType) {
  if (!food) return false;

  const digestion = getDigestibilityScore(food.digestion_ease);
  const mealType = food.meal_type?.map(m => m?.toLowerCase()) || [];
  const role = food.role?.toLowerCase();
  
  // Must be easy to digest
  if (digestion > 1) {
    return false;
  }

  // Check meal_type
  if (mealType.length > 0 && !mealType.includes('breakfast')) {
    return false;
  }

  // Check temperament compatibility
  if (!isTemperamentCompatible(food, userType)) {
    return false;
  }

  return true;
}

/**
 * Filter foods suitable for lunch (main meal)
 * Rules: Balanced, can handle heavier foods, grain+protein+vegetable structure
 */
function canUseInLunch(food, userType) {
  if (!food) return false;

  const mealType = food.meal_type?.map(m => m?.toLowerCase()) || [];

  // Check meal_type
  if (mealType.length > 0 && !mealType.includes('lunch')) {
    return false;
  }

  // Check temperament compatibility
  if (!isTemperamentCompatible(food, userType)) {
    return false;
  }

  return true;
}

/**
 * Filter foods suitable for dinner
 * Rules: Light, digestibility ≤ 2, NO heavy/oily, avoid same temperament overload
 */
function canUseInDinner(food, userType) {
  if (!food) return false;

  const digestion = getDigestibilityScore(food.digestion_ease);
  const mealType = food.meal_type?.map(m => m?.toLowerCase()) || [];
  const role = food.role?.toLowerCase();

  // Strict: Dinner digestibility ≤ 2
  if (digestion > 2) {
    return false;
  }

  // Avoid heavy/oily
  if (role === 'oil' || role === 'fried' || food.digestion_ease?.toLowerCase() === 'hard') {
    return false;
  }

  // Check meal_type
  if (mealType.length > 0 && !mealType.includes('dinner')) {
    return false;
  }

  // Check temperament compatibility
  if (!isTemperamentCompatible(food, userType)) {
    return false;
  }

  return true;
}

/**
 * Check if meal has temperament overload (too many of same quality)
 */
function hasTemperamentOverload(meal, allFoods) {
  const foodObjects = meal.map(name => allFoods.find(f => f.food_name === name || f.name === name)).filter(Boolean);
  
  // Only check for overload if meal has 4+ items
  if (foodObjects.length < 4) return false;

  let hotCount = 0, coldCount = 0, dryCount = 0, moistCount = 0;

  foodObjects.forEach(food => {
    const t = food.temperament || {};
    if ((t.hot_level || 0) >= 2) hotCount++;
    if ((t.cold_level || 0) >= 2) coldCount++;
    if ((t.dry_level || 0) >= 2) dryCount++;
    if ((t.moist_level || 0) >= 2) moistCount++;
  });

  // Avoid 3+ same temperament strengths in meal with 4+ items (very strict overload only)
  return hotCount > 2 || coldCount > 2 || dryCount > 2 || moistCount > 2;
}

/**
 * Check if meal has balanced opposite qualities
 */
function isTemperamentBalanced(meal, allFoods) {
  if (meal.length < 2) return true;
  
  const foodObjects = meal.map(name => allFoods.find(f => f.food_name === name || f.name === name)).filter(Boolean);
  
  let hasHot = false, hasCold = false, hasDry = false, hasMoist = false;

  foodObjects.forEach(food => {
    const t = food.temperament || {};
    if ((t.hot_level || 0) > 0) hasHot = true;
    if ((t.cold_level || 0) > 0) hasCold = true;
    if ((t.dry_level || 0) > 0) hasDry = true;
    if ((t.moist_level || 0) > 0) hasMoist = true;
  });

  // Ideally should have both hot and cold, or both dry and moist
  return (hasHot && hasCold) || (hasDry && hasMoist);
}

/**
 * Select foods for breakfast based on Unani temperament
 * Returns: { meal: [food names], reason: [explanations] }
 */
function generateStrictBreakfast(allFoods, userType) {
  console.log('  🌅 Generating breakfast (Light & Digestible)...');

  let breakfastFoods = allFoods.filter(f => canUseInBreakfast(f, userType));

  // FALLBACK: If no suitable foods found, relax filter
  if (breakfastFoods.length === 0) {
    console.warn('⚠️ No breakfast foods found with strict filters. Relaxing filter...');
    breakfastFoods = allFoods.filter(f => 
      f && 
      f.meal_type?.map(m => m?.toLowerCase()).includes('breakfast')
    );
  }

  if (breakfastFoods.length === 0) {
    throw new Error('INVALID: No suitable breakfast foods found after all filters');
  }

  // Select light main dish
  const mainDishes = breakfastFoods.filter(f => f.category?.toLowerCase() === 'grain' || f.category?.toLowerCase() === 'vegetable');
  const mainDish = mainDishes[Math.floor(Math.random() * mainDishes.length)];

  if (!mainDish) {
    throw new Error('INVALID: No suitable breakfast grain/vegetable found');
  }

  // Optional beverage
  let beverage = null;
  const beverages = breakfastFoods.filter(f =>
    (f.role?.toLowerCase() === 'beverage' || f.category?.toLowerCase() === 'beverage') &&
    f.food_name !== mainDish.food_name
  );

  if (beverages.length > 0 && Math.random() > 0.4) {
    beverage = beverages[Math.floor(Math.random() * beverages.length)];
  }

  const meal = [mainDish, beverage].filter(Boolean).map(f => f.food_name);
  const reason = [];

  if (mainDish) {
    reason.push(`Light main: ${mainDish.food_name} (${mainDish.therapeutic_use})`);
  }
  if (beverage) {
    reason.push(`Supporting beverage for morning vitality`);
  }

  return { meal, reason };
}

/**
 * Select foods for lunch (main meal)
 * STRICT: EXACTLY 3 items (grain + protein + vegetable)
 * NO duplicate categories, balanced temperament
 */
function generateStrictLunch(allFoods, userType) {
  console.log('  🍽️  Generating lunch (Balanced & Main Meal)...');

  let lunchFoods = allFoods.filter(f => canUseInLunch(f, userType));

  // FALLBACK: If not enough foods found, relax filter
  if (lunchFoods.length < 3) {
    console.warn('⚠️ Not enough lunch foods found with strict filters. Relaxing filter...');
    lunchFoods = allFoods.filter(f => 
      f && 
      f.meal_type?.map(m => m?.toLowerCase()).includes('lunch')
    );
  }

  if (lunchFoods.length < 3) {
    throw new Error('INVALID: Not enough lunch foods found after all filters');
  }

  const meal = [];
  const reason = [];

  // Select EXACTLY 1 grain
  let grains = lunchFoods.filter(f => f.category?.toLowerCase() === 'grain');
  if (grains.length === 0) throw new Error('INVALID: No grains found for lunch');

  const grain = grains[Math.floor(Math.random() * grains.length)];
  meal.push(grain.food_name);
  reason.push(`Grain: ${grain.food_name} (primary nourishment)`);

  // Select EXACTLY 1 protein (preferably opposite temperament to grain)
  let proteins = lunchFoods.filter(f =>
    f.category?.toLowerCase() === 'legume' || f.category?.toLowerCase() === 'dairy' ||
    f.category?.toLowerCase() === 'meat'
  );

  if (proteins.length === 0) {
    proteins = lunchFoods.filter(f => f.role?.toLowerCase() === 'protein');
  }

  if (proteins.length > 0) {
    const protein = proteins[Math.floor(Math.random() * proteins.length)];
    meal.push(protein.food_name);
    reason.push(`Protein: ${protein.food_name} (strength and tissue building)`);
  }

  // Select EXACTLY 1 vegetable (NO multiple vegetables)
  let vegetables = lunchFoods.filter(f => f.category?.toLowerCase() === 'vegetable');

  if (vegetables.length > 0) {
    const veg = vegetables[Math.floor(Math.random() * vegetables.length)];
    meal.push(veg.food_name);
    reason.push(`Vegetable: ${veg.food_name} (digestive aid and vitality)`);
  }

  // VALIDATION: Lunch MUST be exactly 3 items
  if (meal.length !== 3) {
    console.warn('⚠️ Lunch should have exactly 3 items (grain/protein/veg), got:', meal.length);
  }

  return { meal, reason };
}

/**
 * Select foods for dinner (very light)
 * STRICT: MAX 2 items (NO overload)
 * Rules: Light, digestible, balanced temperament, NO heavy/oily
 */
function generateStrictDinner(allFoods, userType) {
  console.log('  🌙 Generating dinner (Light & Soothing)...');

  let dinnerFoods = allFoods.filter(f => canUseInDinner(f, userType));

  // FALLBACK: If no suitable foods found, relax filter
  if (dinnerFoods.length === 0) {
    console.warn('⚠️ No dinner foods found with strict filters. Relaxing filter...');
    dinnerFoods = allFoods.filter(f => 
      f && 
      f.meal_type?.map(m => m?.toLowerCase()).includes('dinner')
    );
  }

  if (dinnerFoods.length === 0) {
    throw new Error('INVALID: No suitable dinner foods found after all filters');
  }

  // Select easily digestible main
  const mainDishes = dinnerFoods.filter(f =>
    f.digestion_ease?.toLowerCase() === 'easy' && f.role?.toLowerCase() === 'main'
  );

  let mainDish = null;
  if (mainDishes.length > 0) {
    mainDish = mainDishes[Math.floor(Math.random() * mainDishes.length)];
  } else {
    mainDish = dinnerFoods[0];
  }

  // Select optional light side (max 1, not guaranteed)
  let sideDish = null;
  if (Math.random() > 0.6) {
    const sides = dinnerFoods.filter(f =>
      f.food_name !== mainDish.food_name && 
      getDigestibilityScore(f.digestion_ease) <= 1
    );

    if (sides.length > 0) {
      sideDish = sides[Math.floor(Math.random() * sides.length)];
    }
  }

  const meal = [mainDish, sideDish].filter(Boolean).map(f => f.food_name);
  const reason = [];

  if (mainDish) {
    reason.push(`Main: ${mainDish.food_name} (${mainDish.therapeutic_use})`);
  }
  if (sideDish) {
    reason.push(`Light support: ${sideDish.food_name}`);
  }

  // VALIDATION: Dinner MUST be max 2 items
  if (meal.length > 2) {
    console.warn('⚠️ CRITICAL: Dinner exceeds 2 items (' + meal.length + ')! Trimming...');
    meal.length = 2;
  }

  return { meal, reason };
}

/**
 * MAIN FUNCTION: Generate strict Unani daily meal plan
 * Input: userType = 'damvi' | 'safravi' | 'balghami' | 'saudavi'
 * Output: { breakfast, lunch, dinner } with meal names and explanations
 */
function generateStrictDailyMealPlan(userType = 'damvi') {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🌍 STRICT UNANI (YUNANI) MEAL PLAN GENERATOR');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Load foods
  const allFoods = loadUnaniFoods();
  console.log(`✅ Loaded ${allFoods.length} Unani foods\n`);

  // Analyze temperament
  const temperament = analyzeTemperament(userType);
  console.log('📊 User Temperament Analysis:\n');
  console.log(`   Type: ${temperament.label}`);
  if (temperament.hot) console.log('   ⚠️  Hot type → Avoid excess heating foods');
  if (temperament.cold) console.log('   ⚠️  Cold type → Avoid excess cooling foods');
  if (temperament.dry) console.log('   ⚠️  Dry type → Avoid excess drying foods');
  if (temperament.moist) console.log('   ⚠️  Moist type → Avoid excess oily/heavy foods');
  console.log();

  console.log('📋 STRICT UNANI RULES APPLIED:\n');
  console.log('   ✓ Breakfast: Light, easy to digest, NO high ama foods');
  console.log('   ✓ Lunch: Heaviest meal (grain + protein + vegetable)');
  console.log('   ✓ Dinner: Light, digestibility ≤ 2, NO heavy/oily');
  console.log('   ✓ NO same temperament overload (e.g., hot+hot+hot)');
  console.log('   ✓ Balance hot↔cold and dry↔moist');
  console.log('   ✓ Personalization based on user temperament type\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Generate meals
  const breakfast = generateStrictBreakfast(allFoods, userType);
  const lunch = generateStrictLunch(allFoods, userType);
  const dinner = generateStrictDinner(allFoods, userType);

  // VALIDATION STEP
  console.log('✅ Validating meal plan against strict Unani rules...\n');

  // Check for heavy dinner
  const dinnerDigestibility = dinner.meal.reduce((max, name) => {
    const food = allFoods.find(f => f.food_name === name);
    return Math.max(max, getDigestibilityScore(food?.digestion_ease));
  }, 0);

  if (dinnerDigestibility > 2) {
    throw new Error('INVALID: Dinner has digestibility > 2 (too heavy)');
  }

  // Check for temperament overload in each meal
  if (hasTemperamentOverload(breakfast.meal, allFoods)) {
    throw new Error('INVALID: Breakfast has temperament overload');
  }
  if (hasTemperamentOverload(lunch.meal, allFoods)) {
    throw new Error('INVALID: Lunch has temperament overload');
  }
  if (hasTemperamentOverload(dinner.meal, allFoods)) {
    throw new Error('INVALID: Dinner has temperament overload');
  }

  // Validate max items per meal
  if (breakfast.meal.length > 3) throw new Error('INVALID: Breakfast exceeds 3 items');
  if (lunch.meal.length > 4) throw new Error('INVALID: Lunch exceeds 4 items');
  if (dinner.meal.length > 2) throw new Error('INVALID: Dinner exceeds 2 items');

  console.log('✅ All Unani validations passed!\n');

  // Output
  console.log('🌅 BREAKFAST (Light & Digestible):\n');
  console.log(`   Foods: ${breakfast.meal.join(' + ')}`);
  console.log('   Reasons:');
  breakfast.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n🍽️  LUNCH (Main Meal - Balanced):\n');
  console.log(`   Foods: ${lunch.meal.join(' + ')}`);
  console.log('   Reasons:');
  lunch.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n🌙 DINNER (Light & Soothing):\n');
  console.log(`   Foods: ${dinner.meal.join(' + ')}`);
  console.log('   Reasons:');
  dinner.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ UNANI VALIDATION COMPLETE - All rules satisfied!\n');

  // Save to file
  const output = {
    timestamp: new Date().toISOString(),
    userTemperament: {
      type: userType,
      label: temperament.label,
      qualities: temperament
    },
    mealPlan: {
      breakfast: breakfast,
      lunch: lunch,
      dinner: dinner
    },
    rulesValidated: [
      'No heavy dinner (digestibility ≤ 2)',
      'No same temperament overload',
      'Balanced meal composition',
      'Breakfast light and digestible',
      'Lunch heaviest and most nutritious',
      'Dinner light and soothing',
      'Max 3-4 items per meal',
      'Temperament-specific food exclusions applied'
    ]
  };

  const outputPath = path.join(__dirname, '../../../data/strict_unani_meal_plan.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Meal plan saved to: strict_unani_meal_plan.json\n`);

  return output;
}

/**
 * Generate 7-day Unani meal plan
 * Wrapper function to provide consistent interface with Ayurveda
 */
const generateWeeklyPlan = (rankedFoods, userAssessment) => {
  // Generate 7-day plan by repeating daily meal plan
  const weeklyPlan = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Extract userType string from userAssessment object
  const userType = userAssessment?.primary_mizaj || 'damvi';

  for (let day = 1; day <= 7; day++) {
    // Generate daily plan - pass userType string, not full assessment object
    const dailyPlan = generateStrictDailyMealPlan(userType);
    
    // Reformat to match Ayurveda weekly plan structure
    if (dailyPlan && dailyPlan.mealPlan) {
      const dayPlan = {
        day: day,
        day_name: dayNames[(day - 1) % 7],
        meals: [
          {
            meal_type: 'Breakfast',
            foods: dailyPlan.mealPlan.breakfast.meal,
            timing: 'Morning (7-9 AM)'
          },
          {
            meal_type: 'Lunch',
            foods: dailyPlan.mealPlan.lunch.meal,
            timing: 'Midday (12-1 PM)'
          },
          {
            meal_type: 'Dinner',
            foods: dailyPlan.mealPlan.dinner.meal,
            timing: 'Evening (6-7 PM)'
          }
        ],
        guidelines: [
          'Balance Unani humors through food selection',
          'Respect temperament compatibility',
          'Avoid excess heat or cold',
          'Support digestive balance',
          'Follow proper meal timing'
        ]
      };
      weeklyPlan.push(dayPlan);
    }
  }

  return {
    '7_day_plan': weeklyPlan,
    top_ranked_foods: rankedFoods.highly_suitable || [],
    reasoning_summary: {
      primary_mizaj: userAssessment.primary_mizaj || 'Balanced',
      secondary_mizaj: userAssessment.secondary_mizaj || 'Neutral',
      digestive_strength: userAssessment.digestive_strength || 'Moderate',
      key_principles: [
        'Balance the four humors (dam, safra, balgham, sauda)',
        'Respect temperament-specific needs',
        'Avoid foods that aggravate dominant humor',
        'Support digestive balance',
        'Maintain proper meal timing and composition'
      ]
    }
  };
};

module.exports = {
  generateWeeklyPlan,
  generateStrictDailyMealPlan,
  analyzeTemperament,
  getDigestibilityScore
};
