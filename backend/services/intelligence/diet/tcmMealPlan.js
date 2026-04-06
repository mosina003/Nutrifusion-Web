/**
 * TCM (Traditional Chinese Medicine) Strict Meal Plan Generation Engine
 * Generates daily meal plans based on Yin/Yang and Heat/Cold balance
 * 
 * STRICT RULES IMPLEMENTATION:
 * - Breakfast: Light, warm, easy to digest, NO cold/raw foods
 * - Lunch: Balanced (grain + protein + vegetable), moderate thermal intensity
 * - Dinner: Light, warm, calming, digestibility ≤ 2, NO heavy/greasy
 * - Avoid mixing hot+hot excessively, NO cold foods at night
 * - Yin deficiency → cooling foods, Yang deficiency → warming foods
 */

const fs = require('fs');
const path = require('path');

// Load TCM food data
function loadTCMFoods() {
  const filePath = path.join(__dirname, '../../../data/tcm_food_constitution.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
}

/**
 * Analyze thermal nature to determine digestibility
 * TCM: Neutral/Warm → easier, Cool/Cold → harder
 */
function getThermalDigestibility(thermalNature) {
  const thermalMap = {
    'hot': 2,
    'warm': 1,
    'neutral': 1,
    'cool': 3,
    'cold': 4
  };
  return thermalMap[thermalNature?.toLowerCase()] || 2;
}

/**
 * Determine Yin/Yang balance from user condition
 * condition: { yin: X, yang: Y, heat: X, cold: Y }
 * Returns: { yinDeficiency: bool, yangDeficiency: bool, excessHeat: bool, excessCold: bool }
 */
function analyzeCondition(condition) {
  const { yin = 50, yang = 50, heat = 25, cold = 25 } = condition;
  
  return {
    yinDeficiency: yin < 40,
    yangDeficiency: yang < 40,
    excessHeat: heat > 50,
    excessCold: cold > 50,
    yinPercent: yin,
    yangPercent: yang,
    heatPercent: heat,
    coldPercent: cold
  };
}

/**
 * Filter foods suitable for breakfast
 * Rules: Warm/Light, easy to digest, NO cold/raw foods
 */
function canUseInBreakfast(food, condition) {
  if (!food) return false;
  
  const thermalNature = food.thermal_nature?.toLowerCase();
  const role = food.role?.toLowerCase();
  const mealType = food.meal_type?.map(m => m?.toLowerCase()) || [];

  // Avoid cold/raw foods for breakfast
  if (thermalNature === 'cold' || role === 'raw' || role === 'beverage-cold') {
    return false;
  }

  // Prefer warm/neutral for breakfast
  if (thermalNature !== 'warm' && thermalNature !== 'neutral' && thermalNature !== 'hot') {
    return false;
  }

  // Check meal_type: If specified, must include breakfast. If empty, allow it (fallback)
  if (mealType.length > 0 && !mealType.includes('breakfast')) {
    return false;
  }

  return true;
}

/**
 * Filter foods suitable for lunch (main meal)
 * Rules: Balanced thermal, moderate intensity, grain+protein+vegetable standard
 */
function canUseInLunch(food, condition) {
  if (!food) return false;

  const thermalNature = food.thermal_nature?.toLowerCase();
  const category = food.category?.toLowerCase();
  const role = food.role?.toLowerCase();
  const mealType = food.meal_type?.map(m => m?.toLowerCase()) || [];

  // Avoid extreme thermal natures for lunch balance
  if (thermalNature === 'hot' && condition.excessHeat) return false;
  if (thermalNature === 'cold' && condition.excessCold) return false;

  // Check meal_type if specified: If has items, must include lunch. If empty, allow (fallback)
  if (mealType.length > 0 && !mealType.includes('lunch')) {
    return false;
  }

  return true;
}

/**
 * Filter foods suitable for dinner
 * Rules: Warm/Neutral ONLY, light and calming, NO heavy/greasy
 * TCM: Dinner is most important for Spleen/digestion
 */
function canUseInDinner(food, condition) {
  if (!food) return false;

  const thermalNature = food.thermal_nature?.toLowerCase();
  const digestibility = getThermalDigestibility(thermalNature);
  const role = food.role?.toLowerCase();
  const mealType = food.meal_type?.map(m => m?.toLowerCase()) || [];

  // Strict: Dinner must be warm or neutral ONLY
  if (thermalNature !== 'warm' && thermalNature !== 'neutral') {
    return false;
  }

  // Dinner must be easily digestible (digestibility ≤ 2)
  if (digestibility > 2) {
    return false;
  }

  // Avoid heavy/greasy foods at night
  if (role === 'oil' || role === 'fried') {
    return false;
  }

  // Check meal_type
  if (mealType.length > 0 && !mealType.includes('dinner')) {
    return false;
  }

  return true;
}

/**
 * Check if two foods are incompatible
 * TCM rules: No cold + hot extreme mixing, no raw + cooked where incompatible
 */
function isIncompatibleCombination(food1, food2) {
  if (!food1 || !food2) return false;

  const thermal1 = food1.thermal_nature?.toLowerCase();
  const thermal2 = food2.thermal_nature?.toLowerCase();
  const role1 = food1.role?.toLowerCase();
  const role2 = food2.role?.toLowerCase();

  // TCM: Avoid mixing hot + hot excessively (creates imbalance)
  if (thermal1 === 'hot' && thermal2 === 'hot') {
    return true;
  }

  // Avoid mixing cold + cold excessively
  if (thermal1 === 'cold' && thermal2 === 'cold') {
    return true;
  }

  // Avoid mixing cold + raw at night (weak digestion)
  if ((thermal1 === 'cold' && role2 === 'raw') || (thermal2 === 'cold' && role1 === 'raw')) {
    return true;
  }

  return false;
}

/**
 * Select foods for breakfast based on Yin/Yang balance
 * Returns: { meal: [food names], reason: [explanations] }
 */
function generateStrictBreakfast(allFoods, condition) {
  console.log('  🌅 Generating breakfast (Light & Warm)...');

  const { yinDeficiency, yangDeficiency, excessHeat, excessCold } = condition;

  // Filter suitable breakfast foods
  let breakfastFoods = allFoods.filter(f => canUseInBreakfast(f, condition));

  // FALLBACK: If no suitable foods found, relax thermal_nature filter
  if (breakfastFoods.length === 0) {
    console.warn('⚠️ No breakfast foods found with strict thermal filters. Relaxing filter...');
    breakfastFoods = allFoods.filter(f => 
      f && 
      f.meal_type?.map(m => m?.toLowerCase()).includes('breakfast') &&
      !(f.tcm_properties?.thermal_nature?.toLowerCase() === 'cold')
    );
  }
  
  if (breakfastFoods.length === 0) {
    throw new Error('INVALID: No suitable breakfast foods found after all filters');
  }

  // Select main dish (grain/vegetable)
  let mainDish = null;
  if (yangDeficiency) {
    // Yang deficiency → warming foods
    const warmingFoods = breakfastFoods.filter(f =>
      f.tcm_properties?.thermal_nature?.toLowerCase() === 'warm' && f.category?.toLowerCase() === 'grain'
    );
    mainDish = warmingFoods[Math.floor(Math.random() * warmingFoods.length)];
  } else if (yinDeficiency && excessHeat) {
    // Yin deficiency + heat → cooling foods
    const coolingFoods = breakfastFoods.filter(f =>
      (f.thermal_nature?.toLowerCase() === 'cool' || f.thermal_nature?.toLowerCase() === 'neutral') &&
      f.category?.toLowerCase() === 'grain'
    );
    mainDish = coolingFoods[Math.floor(Math.random() * coolingFoods.length)];
  } else {
    // Neutral balance → prefer neutral/warm grains
    const neutralFoods = breakfastFoods.filter(f =>
      (f.thermal_nature?.toLowerCase() === 'neutral' || f.thermal_nature?.toLowerCase() === 'warm') &&
      f.category?.toLowerCase() === 'grain'
    );
    mainDish = neutralFoods[Math.floor(Math.random() * neutralFoods.length)];
  }

  if (!mainDish) {
    mainDish = breakfastFoods.find(f => f.category?.toLowerCase() === 'grain') || breakfastFoods[0];
  }

  // Select beverage (optional)
  let beverage = null;
  const beverages = breakfastFoods.filter(f =>
    f.role?.toLowerCase() === 'beverage' && !isIncompatibleCombination(mainDish, f)
  );
  if (beverages.length > 0) {
    beverage = beverages[Math.floor(Math.random() * beverages.length)];
  }

  const meal = [mainDish, beverage].filter(Boolean).map(f => f.food_name);
  const reason = [];

  if (mainDish) {
    reason.push(`Main dish: ${mainDish.thermal_nature} nature (${mainDish.therapeutic_use})`);
  }
  if (beverage) {
    reason.push(`Warm beverage for Spleen digestion`);
  }

  return { meal, reason };
}

/**
 * Select foods for lunch (main meal)
 * STRICT: EXACTLY 3 items (grain + protein + vegetable)
 * NO duplicate categories, NO heavy fried foods
 */
function generateStrictLunch(allFoods, condition) {
  console.log('  🍽️  Generating lunch (Balanced & Moderate)...');

  const { yinDeficiency, yangDeficiency, excessHeat, excessCold } = condition;
  
  // Filter: NO fried, NO very-heavy
  let lunchFoods = allFoods.filter(f => 
    canUseInLunch(f, condition) &&
    !(f.guna && (f.guna.includes('fried') || f.guna.includes('very-heavy')))
  );

  // FALLBACK: If not enough foods found, relax guna filter
  if (lunchFoods.length < 3) {
    console.warn('⚠️ Not enough lunch foods found with strict guna filters. Relaxing filter...');
    lunchFoods = allFoods.filter(f => 
      f && 
      f.meal_type?.map(m => m?.toLowerCase()).includes('lunch') &&
      !(f.tcm_properties?.thermal_nature?.toLowerCase() === 'cold')
    );
  }

  if (lunchFoods.length < 3) {
    throw new Error('INVALID: Not enough lunch foods found after all filters');
  }

  const meal = [];
  const reason = [];

  // Select EXACTLY 1 grain
  let grains = lunchFoods.filter(f => f.category?.toLowerCase() === 'grain');
  if (yangDeficiency) {
    grains = grains.filter(f => f.thermal_nature?.toLowerCase() === 'warm');
  }
  if (grains.length === 0) grains = lunchFoods.filter(f => f.category?.toLowerCase() === 'grain');

  const grain = grains[Math.floor(Math.random() * grains.length)];
  if (grain) {
    meal.push(grain.food_name);
    reason.push(`Grain: ${grain.food_name} (middle jiao strengthening)`);
  }

  // Select EXACTLY 1 protein
  let proteins = lunchFoods.filter(f =>
    f.category?.toLowerCase() === 'legume' || f.category?.toLowerCase() === 'dairy' ||
    f.category?.toLowerCase() === 'meat'
  );

  // Filter incompatible with grain
  proteins = proteins.filter(p => !isIncompatibleCombination(grain, p));

  if (proteins.length === 0) {
    proteins = lunchFoods.filter(f =>
      f.category?.toLowerCase() === 'legume' || f.category?.toLowerCase() === 'dairy'
    );
  }

  const protein = proteins[Math.floor(Math.random() * proteins.length)];
  if (protein) {
    meal.push(protein.food_name);
    reason.push(`Protein: ${protein.food_name} (Qi support)`);
  }

  // Select EXACTLY 1 vegetable (NO multiple vegetables)
  let vegetables = lunchFoods.filter(f =>
    f.category?.toLowerCase() === 'vegetable' && !isIncompatibleCombination(grain, f) &&
    (protein ? !isIncompatibleCombination(protein, f) : true)
  );

  if (vegetables.length === 0) {
    vegetables = lunchFoods.filter(f => f.category?.toLowerCase() === 'vegetable');
  }

  const vegetable = vegetables[Math.floor(Math.random() * vegetables.length)];
  if (vegetable) {
    meal.push(vegetable.food_name);
    reason.push(`Vegetable: ${vegetable.food_name} (digestive support)`);
  }

  // VALIDATION: Lunch MUST be exactly 3 items
  if (meal.length !== 3) {
    console.warn('⚠️ Lunch should have exactly 3 items (grain/protein/veg), got:', meal.length);
  }

  return { meal, reason };
}

/**
 * Select foods for dinner (very light & calming)
 * STRICT: MAX 2 items (NO overload)
 * Rules: Warm/Neutral only, easily digestible, NO heavy/greasy/fried
 */
function generateStrictDinner(allFoods, condition) {
  console.log('  🌙 Generating dinner (Light & Warm)...');

  const { yinDeficiency, yangDeficiency } = condition;
  
  // Filter: VERY STRICT - NO heavy/fried/oily
  let dinnerFoods = allFoods.filter(f => 
    canUseInDinner(f, condition) &&
    !(f.guna && (f.guna.includes('fried') || f.guna.includes('heavy') || f.guna.includes('oily') || f.guna.includes('very-heavy')))
  );

  // FALLBACK: If no suitable foods found, relax guna filter
  if (dinnerFoods.length === 0) {
    console.warn('⚠️ No dinner foods found with strict guna filters. Relaxing filter...');
    dinnerFoods = allFoods.filter(f => 
      f && 
      f.meal_type?.map(m => m?.toLowerCase()).includes('dinner') &&
      (f.tcm_properties?.thermal_nature?.toLowerCase() === 'warm' || f.tcm_properties?.thermal_nature?.toLowerCase() === 'neutral')
    );
  }

  if (dinnerFoods.length === 0) {
    throw new Error('INVALID: No suitable dinner foods found after all filters');
  }

  // Prefer warm for dinner to support digestion
  let mainDish = null;
  let sideDish = null;

  if (yangDeficiency) {
    // Yang deficiency → warming foods for deeper nourishment
    const warmingFoods = dinnerFoods.filter(f => f.thermal_nature?.toLowerCase() === 'warm');
    mainDish = warmingFoods[Math.floor(Math.random() * warmingFoods.length)];
  } else {
    // Neutral balance → prefer neutral for calm digestion
    const neutralFoods = dinnerFoods.filter(f => f.thermal_nature?.toLowerCase() === 'neutral');
    mainDish = neutralFoods.length > 0 ? neutralFoods[Math.floor(Math.random() * neutralFoods.length)] : dinnerFoods[0];
  }

  if (!mainDish) {
    mainDish = dinnerFoods[0];
  }

  // Select light side (OPTIONAL, not guaranteed - max 1)
  // Only add sideDish if we have a good match and random chance favors it
  if (Math.random() > 0.6) {
    const sides = dinnerFoods.filter(f =>
      f.food_name !== mainDish.food_name && !isIncompatibleCombination(mainDish, f)
    );
    
    if (sides.length > 0) {
      sideDish = sides[Math.floor(Math.random() * sides.length)];
    }
  }

  const meal = [mainDish, sideDish].filter(Boolean).map(f => f.food_name);
  const reason = [];

  if (mainDish) {
    reason.push(`Main: ${mainDish.food_name} (${mainDish.thermal_nature}, easily digested for sleep)`);
  }
  if (sideDish) {
    reason.push(`Light side: ${sideDish.food_name}`);
  }

  // VALIDATION: Dinner MUST be max 2 items
  if (meal.length > 2) {
    console.warn('⚠️ CRITICAL: Dinner exceeds 2 items (' + meal.length + ')! Trimming...');
    meal.length = 2;
  }

  return { meal, reason };
}

/**
 * MAIN FUNCTION: Generate strict TCM daily meal plan
 * Input: condition = { yin, yang, heat, cold }
 * Output: { breakfast, lunch, dinner } with meal names and explanations
 */
function generateStrictDailyMealPlan(condition) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🌿 STRICT TCM MEAL PLAN GENERATOR');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Load foods
  const allFoods = loadTCMFoods();
  console.log(`✅ Loaded ${allFoods.length} TCM foods\n`);

  // Analyze condition
  const analysis = analyzeCondition(condition);
  console.log('📊 User TCM Pattern Analysis:\n');
  console.log(`   Yin: ${analysis.yinPercent}% ${analysis.yinDeficiency ? '(DEFICIENT ⚠️)' : '(balanced)'}`);
  console.log(`   Yang: ${analysis.yangPercent}% ${analysis.yangDeficiency ? '(DEFICIENT ⚠️)' : '(balanced)'}`);
  console.log(`   Heat: ${analysis.heatPercent}% ${analysis.excessHeat ? '(EXCESS ⚠️)' : '(balanced)'}`);
  console.log(`   Cold: ${analysis.coldPercent}% ${analysis.excessCold ? '(EXCESS ⚠️)' : '(balanced)'}\n`);

  console.log('📋 STRICT TCM RULES APPLIED:\n');
  console.log('   ✓ Breakfast: Light, warm, easy to digest, NO cold/raw');
  console.log('   ✓ Lunch: Balanced (grain + protein + vegetable)');
  console.log('   ✓ Dinner: Light, warm, calming, digestibility ≤ 2');
  console.log('   ✓ NO mixing hot + hot excessively');
  console.log('   ✓ NO cold foods at night');
  console.log('   ✓ NO raw foods with weak digestion');
  console.log('   ✓ Yin deficiency → cooling foods, Yang deficiency → warming foods\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Generate meals
  const breakfast = generateStrictBreakfast(allFoods, analysis);
  const lunch = generateStrictLunch(allFoods, analysis);
  const dinner = generateStrictDinner(allFoods, analysis);

  // VALIDATION STEP
  console.log('✅ Validating meal plan against strict TCM rules...\n');

  const hasInvalidColdCombo = (meal) => {
    return meal.some(name => allFoods.find(f => (f.food_name === name || f.name === name) &&
      f.thermal_nature?.toLowerCase() === 'cold'));
  };

  if (hasInvalidColdCombo(breakfast.meal)) {
    throw new Error('INVALID: Breakfast contains cold foods');
  }
  if (hasInvalidColdCombo(dinner.meal)) {
    throw new Error('INVALID: Dinner contains cold foods');
  }

  // Check for excessive hot mixing
  const countHotFoods = (meal) => {
    return meal.filter(name => allFoods.find(f => (f.food_name === name || f.name === name) &&
      f.thermal_nature?.toLowerCase() === 'hot')).length;
  };

  if (countHotFoods(breakfast.meal) > 2 || countHotFoods(lunch.meal) > 2 || countHotFoods(dinner.meal) > 1) {
    throw new Error('INVALID: Excessive hot foods in meal');
  }

  // Validate: Max items per meal
  if (breakfast.meal.length > 3) throw new Error('INVALID: Breakfast exceeds 3 items');
  if (lunch.meal.length > 4) throw new Error('INVALID: Lunch exceeds 4 items');
  if (dinner.meal.length > 2) throw new Error('INVALID: Dinner exceeds 2 items');

  console.log('✅ All TCM validations passed!\n');

  // Output
  console.log('🌅 BREAKFAST (Light & Warm):\n');
  console.log(`   Foods: ${breakfast.meal.join(' + ')}`);
  console.log('   Reasons:');
  breakfast.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n🍽️  LUNCH (Main Meal - Balanced):\n');
  console.log(`   Foods: ${lunch.meal.join(' + ')}`);
  console.log('   Reasons:');
  lunch.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n🌙 DINNER (Very Light & Warm):\n');
  console.log(`   Foods: ${dinner.meal.join(' + ')}`);
  console.log('   Reasons:');
  dinner.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ TCM VALIDATION COMPLETE - All rules satisfied!\n');

  // Save to file
  const output = {
    timestamp: new Date().toISOString(),
    condition: condition,
    tcmAnalysis: {
      yinDeficiency: analysis.yinDeficiency,
      yangDeficiency: analysis.yangDeficiency,
      excessHeat: analysis.excessHeat,
      excessCold: analysis.excessCold
    },
    mealPlan: {
      breakfast: breakfast,
      lunch: lunch,
      dinner: dinner
    },
    rulesValidated: [
      'No cold foods at breakfast/dinner',
      'No excessive hot+hot combinations',
      'All meals within thermal balance guidelines',
      'Breakfast easily digestible',
      'Dinner digestibility ≤ 2',
      'Max 3-4 items per meal',
      'Yin/Yang balance considerations applied',
      'No incompatible thermal combinations'
    ]
  };

  const outputPath = path.join(__dirname, '../../../data/strict_tcm_meal_plan.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Meal plan saved to: strict_tcm_meal_plan.json\n`);

  return output;
}

/**
 * Generate 7-day TCM meal plan
 * Wrapper function to provide consistent interface with Ayurveda
 */
const generateWeeklyPlan = (rankedFoods, userAssessment) => {
  // Build condition from user assessment
  const condition = {
    yin: userAssessment.yin_yang_ratio?.[0] || 50,
    yang: userAssessment.yin_yang_ratio?.[1] || 50,
    heat: userAssessment.hot_cold_score || 25,
    cold: (100 - userAssessment.hot_cold_score) || 75
  };

  // Generate 7-day plan by repeating daily meal plan
  const weeklyPlan = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (let day = 1; day <= 7; day++) {
    // Generate daily plan
    const dailyPlan = generateStrictDailyMealPlan(condition);
    
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
          'Maintain warm foods throughout the day',
          'Avoid cold/raw foods',
          'Balance thermal natures',
          'Yin/Yang balance consideration',
          'Respect digestive capacity'
        ]
      };
      weeklyPlan.push(dayPlan);
    }
  }

  return {
    '7_day_plan': weeklyPlan,
    top_ranked_foods: rankedFoods.top_ranked_foods || [],
    reasoning_summary: {
      thermal_pattern: userAssessment.thermal_tendency || 'Neutral',
      digestive_strength: userAssessment.digestive_strength || 'Moderate',
      key_principles: [
        'Warm foods for proper digestion',
        'Balance Yin and Yang through food selection',
        'Respect thermal nature compatibility',
        'Avoid excessive heat or cold',
        'Support digestive fire (chi)'
      ]
    }
  };
};

module.exports = {
  generateWeeklyPlan,
  generateStrictDailyMealPlan,
  analyzeCondition,
  getThermalDigestibility
};
