/**
 * Diet Recommendation Engine
 * Scores foods/recipes based on:
 * 1. User's primary health goal (weight_loss, weight_gain, energy, digestion, mental_clarity, recovery)
 * 2. Framework constitution/profile
 * 3. Nutritional properties match to goal
 */

const goalScoringCriteria = {
  weight_loss: {
    description: 'Low calorie, high protein, high fiber, low fat',
    factors: {
      caloriesDensity: { min: 0, max: 2, weight: 0.2 }, // calories per 100g
      proteinRatio: { min: 15, max: 100, weight: 0.3 }, // % of calories from protein
      fiberContent: { min: 2, max: 100, weight: 0.25 }, // grams per 100g
      fatContent: { min: 0, max: 10, weight: 0.15 }, // grams per 100g
      glycemicIndex: { min: 0, max: 35, weight: 0.1 } // low GI preferred
    },
    avoidProperties: ['high_sugar', 'high_fat', 'high_calorie', 'refined'],
    preferProperties: ['high_protein', 'high_fiber', 'low_calorie', 'low_gi']
  },

  weight_gain: {
    description: 'High calorie, nutrient-dense, easy to digest, high healthy fats',
    factors: {
      caloriesDensity: { min: 1.5, max: 4, weight: 0.25 }, // calories per 100g (higher is better)
      proteinRatio: { min: 8, max: 100, weight: 0.25 }, // % of calories from protein
      healthyFats: { min: 2, max: 100, weight: 0.25 }, // grams per 100g
      digestibility: { min: 6, max: 10, weight: 0.15 }, // on 1-10 scale
      micronutrients: { min: 5, max: 10, weight: 0.1 } // nutrient density score
    },
    avoidProperties: ['low_calorie', 'high_fiber_insoluble', 'raw', 'heavy'],
    preferProperties: ['high_calorie', 'nutrient_dense', 'grounding', 'easy_digest']
  },

  energy: {
    description: 'Complex carbs, B vitamins, iron-rich, quick energy release',
    factors: {
      complexCarbs: { min: 30, max: 100, weight: 0.3 }, // grams per 100g
      bVitamins: { min: 3, max: 10, weight: 0.2 }, // score 1-10
      ironContent: { min: 0.5, max: 100, weight: 0.15 }, // mg per 100g
      sustainedEnergy: { min: 5, max: 10, weight: 0.2 }, // score 1-10 (low GI better)
      electrolytes: { min: 2, max: 10, weight: 0.15 } // score 1-10
    },
    avoidProperties: ['high_sugar', 'caffeinated_heavy', 'heavy_digestion', 'raw_cold'],
    preferProperties: ['energizing', 'b_vitamin_rich', 'iron_rich', 'warming']
  },

  digestion: {
    description: 'Easy to digest, moderate fiber, probiotic-rich, warming spices',
    factors: {
      digestibility: { min: 6, max: 10, weight: 0.25 }, // on 1-10 scale
      fiberContent: { min: 1, max: 8, weight: 0.15 }, // grams per 100g (moderate)
      probiotics: { min: 3, max: 10, weight: 0.2 }, // score 1-10
      warmingSpices: { min: 3, max: 10, weight: 0.15 }, // score 1-10
      waterContent: { min: 2, max: 95, weight: 0.15 }, // % of weight
      soothing: { min: 4, max: 10, weight: 0.1 } // soothing properties score
    },
    avoidProperties: ['high_gas_producing', 'cold_raw', 'oily_heavy', 'high_sugar'],
    preferProperties: ['easy_digest', 'warming', 'probiotic', 'gentle_on_gut']
  },

  mental_clarity: {
    description: 'Omega-3s, B vitamins, antioxidants, minerals for brain health',
    factors: {
      omega3s: { min: 0.1, max: 100, weight: 0.2 }, // grams per 100g
      bVitamins: { min: 4, max: 10, weight: 0.25 }, // score 1-10
      antioxidants: { min: 3, max: 10, weight: 0.2 }, // score 1-10 (polyphenols, etc)
      minerals: { min: 3, max: 10, weight: 0.15 }, // Mg, Zn, Fe score 1-10
      bloodflowPromoting: { min: 3, max: 10, weight: 0.1 }, // score 1-10
      caffeine: { min: 0, max: 100, weight: 0.1 } // mg per serving (moderate ok)
    },
    avoidProperties: ['heavy_digestion', 'high_sugar_spike', 'processed', 'inflammatory'],
    preferProperties: ['brain_boosting', 'omega3_rich', 'antioxidant', 'mineral_dense']
  },

  recovery: {
    description: 'Protein-rich, anti-inflammatory, electrolytes, amino acids',
    factors: {
      proteinRatio: { min: 15, max: 100, weight: 0.3 }, // % of calories from protein
      antiInflammatory: { min: 4, max: 10, weight: 0.2 }, // score 1-10
      aminoAcidsProfile: { min: 3, max: 10, weight: 0.2 }, // complete proteins score
      electrolytes: { min: 3, max: 10, weight: 0.15 }, // K, Na, Mg score 1-10
      antioxidants: { min: 3, max: 10, weight: 0.15 } // for cellular repair
    },
    avoidProperties: ['processed', 'trans_fat', 'high_sodium_artificial', 'inflammatory'],
    preferProperties: ['protein_rich', 'anti_inflammatory', 'electrolyte_rich', 'whole_food']
  }
};

/**
 * Score a food item against a specific goal
 * @param {Object} food - Food object with nutritional properties
 * @param {String} goal - User's primary goal
 * @param {Object} framework - Framework type (for context)
 * @returns {Number} Score between 0-100
 */
function scoreFoodForGoal(food, goal, framework) {
  if (!goal || !goalScoringCriteria[goal]) {
    return 50; // Neutral score if goal not found
  }

  const criteria = goalScoringCriteria[goal];
  let totalScore = 0;
  let factorCount = 0;

  // Score each factor
  for (const [factor, range] of Object.entries(criteria.factors)) {
    const foodValue = extractNutritionValue(food, factor);
    
    if (foodValue !== undefined) {
      // Normalize score based on range
      let score = 0;
      if (foodValue >= range.min && foodValue <= range.max) {
        // Linear interpolation within optimal range
        score = ((foodValue - range.min) / (range.max - range.min)) * 100;
      } else if (foodValue < range.min) {
        score = Math.max(0, 100 - (range.min - foodValue) * 2);
      } else {
        score = Math.max(0, 100 - (foodValue - range.max) * 2);
      }
      
      totalScore += score * range.weight;
      factorCount += range.weight;
    }
  }

  // Bonus for preferred properties
  if (food.properties) {
    const matchedPreferred = criteria.preferProperties.filter(prop => 
      food.properties.includes(prop)
    ).length;
    totalScore += matchedPreferred * 10;
    factorCount += matchedPreferred * 0.5;

    // Penalty for avoided properties
    const matchedAvoided = criteria.avoidProperties.filter(prop => 
      food.properties.includes(prop)
    ).length;
    totalScore -= matchedAvoided * 15;
    factorCount += matchedAvoided * 0.5;
  }

  const finalScore = factorCount > 0 ? Math.min(100, Math.max(0, totalScore / factorCount)) : 50;
  return Math.round(finalScore);
}

/**
 * Extract nutrition value from food object (handles various property names)
 */
function extractNutritionValue(food, factor) {
  const mapping = {
    caloriesDensity: ['calories', 'energy', 'caloriesPer100g'],
    proteinRatio: ['proteinPercentage', 'protein_ratio', 'protein%'],
    fiberContent: ['fiber', 'dietary_fiber', 'fiberGrams'],
    fatContent: ['fat', 'totalFat', 'fatGrams'],
    glycemicIndex: ['gi', 'glycemicIndex', 'gindex'],
    healthyFats: ['unsaturatedFat', 'healthy_fats', 'monounsaturatedFat'],
    digestibility: ['digestibility', 'digestibilityScore', 'easeOfDigestion'],
    micronutrients: ['micronutrientScore', 'nutrient_density', 'nutrientDensity'],
    complexCarbs: ['carbohydrates', 'carbs', 'complexCarbs'],
    bVitamins: ['b_vitamin_content', 'bVitamins', 'b_vitamin_score'],
    ironContent: ['iron', 'ironContent', 'iron_mg'],
    sustainedEnergy: ['sustainedEnergy', 'energyRelease', 'sustained_energy_score'],
    electrolytes: ['electrolytes', 'electrolyteScore', 'mineral_content'],
    probiotics: ['probiotics', 'probiotic_content', 'probiotic_score'],
    warmingSpices: ['warming_spices', 'warmingProperties', 'warming_score'],
    waterContent: ['waterContent', 'moisture', 'water%'],
    soothing: ['soothing', 'soothing_properties', 'gentleness'],
    omega3s: ['omega3', 'omega_3', 'omega3Content'],
    antioxidants: ['antioxidants', 'antioxidant_score', 'antioxidant_content'],
    minerals: ['minerals', 'mineral_score', 'mineral_content'],
    bloodflowPromoting: ['bloodflow', 'circulation', 'blood_flow_score'],
    caffeine: ['caffeine', 'caffein_content', 'caffeineMg'],
    antiInflammatory: ['anti_inflammatory', 'antiInflammatory', 'inflammation_score'],
    aminoAcidsProfile: ['amino_acids', 'amino_acid_profile', 'aas_score']
  };

  const keys = mapping[factor] || [factor];
  for (const key of keys) {
    if (food[key] !== undefined) {
      return parseFloat(food[key]) || 0;
    }
  }
  return undefined;
}

/**
 * Get top food recommendations for a goal
 * @param {Array} foods - Array of food objects
 * @param {String} goal - User's primary goal
 * @param {String} framework - Framework type for context
 * @param {Number} limit - Number of recommendations to return
 * @returns {Array} Sorted array of foods with goal-based scores
 */
function getRecommendationsByGoal(foods, goal, framework, limit = 5) {
  if (!foods || !Array.isArray(foods)) {
    return [];
  }

  // Score each food for the goal
  const scoredFoods = foods.map(food => ({
    ...food,
    goalScore: scoreFoodForGoal(food, goal, framework),
    recommendationReason: generateRecommendationReason(food, goal)
  }));

  // Sort by goal score descending
  return scoredFoods
    .sort((a, b) => b.goalScore - a.goalScore)
    .slice(0, limit);
}

/**
 * Generate a human-readable reason for recommendation
 */
function generateRecommendationReason(food, goal) {
  const criteria = goalScoringCriteria[goal];
  const matchedProperties = [];

  if (food.properties) {
    const matched = criteria.preferProperties.filter(prop => 
      food.properties.includes(prop)
    );
    matchedProperties.push(...matched);
  }

  if (matchedProperties.length > 0) {
    return `Great for ${goal.replace(/_/g, ' ')}: ${matchedProperties.join(', ')}`;
  }

  return `Recommended for ${goal.replace(/_/g, ' ')}: ${criteria.description}`;
}

/**
 * Get goal-based meal plan structure
 * Suggests meal composition based on goal
 */
function getMealPlanStructureByGoal(goal) {
  const structures = {
    weight_loss: {
      breakfast: { calories: 300, protein: '25-30%', carbs: '40-45%', fat: '25-30%' },
      lunch: { calories: 400, protein: '30-35%', carbs: '40-45%', fat: '20-25%' },
      dinner: { calories: 350, protein: '30-35%', carbs: '35-40%', fat: '20-25%' },
      snacks: { calories: 150, protein: '20-25%', carbs: '50-60%', fat: '20-30%' },
      totalDailyCalories: '1200-1500'
    },
    weight_gain: {
      breakfast: { calories: 500, protein: '15-20%', carbs: '50-55%', fat: '25-30%' },
      lunch: { calories: 600, protein: '20-25%', carbs: '50-55%', fat: '20-25%' },
      dinner: { calories: 550, protein: '25-30%', carbs: '45-50%', fat: '20-25%' },
      snacks: { calories: 300, protein: '15-20%', carbs: '60-65%', fat: '15-20%' },
      totalDailyCalories: '2000-2500'
    },
    energy: {
      breakfast: { calories: 400, protein: '20-25%', carbs: '50-55%', fat: '20-25%' },
      midmorning: { calories: 150, protein: '10-15%', carbs: '70-75%', fat: '10-15%' },
      lunch: { calories: 500, protein: '25-30%', carbs: '50-55%', fat: '15-20%' },
      midafternoon: { calories: 200, protein: '15-20%', carbs: '60-65%', fat: '15-20%' },
      dinner: { calories: 450, protein: '25-30%', carbs: '45-50%', fat: '15-20%' },
      totalDailyCalories: '1700-1800'
    },
    digestion: {
      breakfast: { calories: 350, protein: '15-20%', carbs: '50-55%', fat: '20-25%', note: 'Warm, cooked, spiced' },
      lunch: { calories: 450, protein: '20-25%', carbs: '50-55%', fat: '20-25%', note: 'Main meal, diverse spices' },
      dinner: { calories: 350, protein: '15-20%', carbs: '50-55%', fat: '20-25%', note: 'Lighter, early, warming' },
      snacks: { calories: 150, protein: '10-15%', carbs: '60-70%', fat: '10-20%', note: 'Herbal teas, digestive aids' },
      totalDailyCalories: '1300-1400'
    },
    mental_clarity: {
      breakfast: { calories: 400, protein: '20-25%', carbs: '45-50%', fat: '25-30%', note: 'Omega-3 rich, antioxidants' },
      lunch: { calories: 500, protein: '25-30%', carbs: '45-50%', fat: '20-25%', note: 'Protein, mineral-rich' },
      dinner: { calories: 400, protein: '20-25%', carbs: '45-50%', fat: '20-25%', note: 'Light, brain-boosting' },
      snacks: { calories: 150, protein: '10-15%', carbs: '55-65%', fat: '20-30%', note: 'Nuts, berries, seeds' },
      totalDailyCalories: '1450-1550'
    },
    recovery: {
      breakfast: { calories: 450, protein: '25-30%', carbs: '50-55%', fat: '15-20%', note: 'High protein, whole grains' },
      postworkout: { calories: 300, protein: '30-35%', carbs: '50-60%', fat: '5-10%', note: 'Quick amino acids + carbs' },
      lunch: { calories: 550, protein: '30-35%', carbs: '50-55%', fat: '15-20%', note: 'Anti-inflammatory, protein-rich' },
      dinner: { calories: 500, protein: '30-35%', carbs: '45-50%', fat: '15-20%', note: 'Lean protein, electrolytes' },
      totalDailyCalories: '1800-1900'
    }
  };

  return structures[goal] || structures.energy; // Default to energy if goal not found
}

module.exports = {
  goalScoringCriteria,
  scoreFoodForGoal,
  getRecommendationsByGoal,
  getMealPlanStructureByGoal,
  generateRecommendationReason
};
