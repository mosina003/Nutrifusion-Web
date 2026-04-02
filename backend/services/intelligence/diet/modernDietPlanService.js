/**
 * Modern Clinical Diet Plan Service
 * 
 * Orchestrates the generation of personalized meal plans based on:
 * - Clinical profile (from assessment/modern.js)
 * - Food scoring (from modernDietEngine)
 * - Meal planning (from modernMealPlan)
 * - User preferences (vegetarian, allergens, etc.)
 * 
 * Main entry point for Modern nutrition recommendations.
 */

const { scoreFood, scoreAllFoods } = require('./modernDietEngine');
const { generateWeeklyPlan } = require('./modernMealPlan');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI for personalized explanations
let geminiModel = null;
if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-pro for stable, reliable API access
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    console.log('✅ Gemini AI initialized for Modern diet plan explanations (gemini-1.5-pro)');
  } catch (error) {
    console.warn('⚠️ Gemini AI unavailable, using template-based explanations:', error.message);
  }
}

/**
 * Validate clinical profile has required fields
 * @param {Object} clinicalProfile - Output from assessment/modern.js
 * @private
 */
const _validateProfile = (clinicalProfile) => {
  if (!clinicalProfile) {
    throw new Error('Clinical profile is required');
  }
  
  const requiredSections = [
    'anthropometric',
    'metabolic_risk',
    'dietary_restrictions', 
    'lifestyle_load',
    'digestive_function',
    'goal_strategy'
  ];
  
  const missingSections = requiredSections.filter(section => !clinicalProfile[section]);
  
  if (missingSections.length > 0) {
    throw new Error(`Missing required sections: ${missingSections.join(', ')}`);
  }
  
  return true;
};

/**
 * Apply user preferences to food list
 * @param {Array} foods - Scored foods
 * @param {Object} preferences - User dietary preferences
 * @returns {Array} Filtered foods
 * @private
 */
const _applyPreferences = (foods, preferences = {}) => {
  let filtered = [...foods];
  
  // Vegetarian filter
  if (preferences.vegetarian === true) {
    const meatCategories = ['Meat', 'Poultry', 'Fish', 'Seafood'];
    filtered = filtered.filter(f => !meatCategories.includes(f.food.category));
  }
  
  // Vegan filter
  if (preferences.vegan === true) {
    const animalCategories = ['Meat', 'Poultry', 'Fish', 'Seafood', 'Dairy', 'Egg'];
    filtered = filtered.filter(f => !animalCategories.includes(f.food.category));
  }
  
  // Allergen exclusions
  if (preferences.excludeAllergens && Array.isArray(preferences.excludeAllergens)) {
    const allergenCategories = {
      'dairy': ['Dairy', 'Milk', 'Cheese', 'Yogurt'],
      'nuts': ['Nut', 'Peanut', 'Almond', 'Cashew'],
      'soy': ['Soy', 'Tofu', 'Tempeh'],
      'gluten': ['Grain', 'Wheat', 'Barley', 'Rye'],
      'shellfish': ['Shellfish', 'Shrimp', 'Crab'],
      'eggs': ['Egg']
    };
    
    preferences.excludeAllergens.forEach(allergen => {
      const categoriesToExclude = allergenCategories[allergen.toLowerCase()] || [];
      filtered = filtered.filter(f => !categoriesToExclude.includes(f.food.category));
    });
  }
  
  // Custom exclusions
  if (preferences.excludeFoods && Array.isArray(preferences.excludeFoods)) {
    const excludeIds = preferences.excludeFoods.map(id => id.toString());
    filtered = filtered.filter(f => !excludeIds.includes(f.food._id.toString()));
  }
  
  return filtered;
};

/**
 * Generate reasoning and summary for the diet plan using AI or template
 * @param {Object} clinicalProfile - Clinical profile
 * @param {Object} categorizedFoods - Categorized scored foods
 * @returns {Promise<Object>} Reasoning object with AI-generated summary
 * @private
 */
const _generateReasoning = async (clinicalProfile, categorizedFoods) => {
  console.log('\n🔵 === _generateReasoning() CALLED ===');
  console.log('🔵 Clinical profile received:', !!clinicalProfile);
  console.log('🔵 Categorized foods received:', !!categorizedFoods);
  
  const reasoning = {
    primary_focus: [],
    metabolic_considerations: [],
    dietary_adjustments: [],
    lifestyle_recommendations: []
  };
  
  // Primary focus based on goals
  const goals = clinicalProfile.goals || [];
  console.log('🔵 Goals:', goals);
  if (goals.includes('weight_loss')) {
    reasoning.primary_focus.push('Calorie-controlled, high-protein, high-fiber foods for sustainable weight loss');
  }
  if (goals.includes('muscle_gain')) {
    reasoning.primary_focus.push('Protein-rich foods with adequate carbohydrates for muscle synthesis and recovery');
  }
  if (goals.includes('metabolic_health')) {
    reasoning.primary_focus.push('Low glycemic index, nutrient-dense foods to optimize metabolic function');
  }
  
  // Metabolic considerations
  const riskLevel = clinicalProfile.metabolic_risk_level;
  if (riskLevel === 'high' || riskLevel === 'very_high') {
    reasoning.metabolic_considerations.push('Minimizing refined carbohydrates and saturated fats due to elevated metabolic risk');
  }
  
  const riskFlags = clinicalProfile.risk_flags || [];
  if (riskFlags.includes('diabetes')) {
    reasoning.metabolic_considerations.push('Prioritizing low glycemic load foods to manage blood sugar');
  }
  if (riskFlags.includes('hypertension')) {
    reasoning.metabolic_considerations.push('Limiting sodium intake to support blood pressure management');
  }
  
  // Dietary adjustments
  const digestiveIssues = clinicalProfile.digestive_issues || [];
  if (digestiveIssues.includes('acid_reflux')) {
    reasoning.dietary_adjustments.push('Avoiding high-fat and spicy foods to prevent acid reflux symptoms');
  }
  if (digestiveIssues.includes('ibs')) {
    reasoning.dietary_adjustments.push('Selecting low FODMAP options to minimize IBS symptoms');
  }
  
  const intolerances = clinicalProfile.food_intolerances || [];
  if (intolerances.length > 0) {
    reasoning.dietary_adjustments.push(`Excluding ${intolerances.join(', ')} due to food intolerances`);
  }
  
  // Lifestyle recommendations
  const stressLevel = clinicalProfile.stress_level;
  if (stressLevel === 'high' || stressLevel === 'very_high') {
    reasoning.lifestyle_recommendations.push('Including magnesium and B-vitamin rich foods to support stress management');
  }
  
  const sleepQuality = clinicalProfile.sleep_quality;
  if (sleepQuality === 'poor' || sleepQuality === 'very_poor') {
    reasoning.lifestyle_recommendations.push('Incorporating tryptophan-rich foods to support sleep quality');
  }
  
  const activityLevel = clinicalProfile.physical_activity_level;
  if (activityLevel === 'high' || activityLevel === 'very_high') {
    reasoning.lifestyle_recommendations.push('Ensuring adequate carbohydrate and protein intake to fuel activity');
  }
  
  // Build human-readable constitution summary
  const bmi = clinicalProfile.anthropometric?.bmi || 0;
  const bmiCategory = clinicalProfile.anthropometric?.bmi_category || 'normal';
  const primaryGoal = (goals[0] || 'metabolic_health').replace('_', ' ');
  
  // Create friendly, conversational summary
  const summaryParts = [];
  
  // Opening with BMI and metabolic status - make it warm and encouraging
  const bmiDescriptions = {
    'underweight': `your BMI of ${bmi.toFixed(1)} is on the lower side`,
    'normal': `you're maintaining a healthy BMI of ${bmi.toFixed(1)}`,
    'overweight': `your BMI is ${bmi.toFixed(1)}, which gives us room to work together on some positive changes`,
    'obese': `with a BMI of ${bmi.toFixed(1)}, we'll focus on sustainable, healthy improvements`
  };
  
  const riskDescriptions = {
    'low': `which is great news for your overall health`,
    'moderate': `and we'll work on optimizing your metabolic health`,
    'high': `but this plan will help support better metabolic balance`,
    'very_high': `which makes this personalized nutrition plan especially important`
  };
  
  const bmiText = bmiDescriptions[bmiCategory] || `your BMI is ${bmi.toFixed(1)}`;
  const riskText = riskDescriptions[riskLevel] || 'and we can support your health journey';
  
  summaryParts.push(`I've created this 7-day plan just for you. Based on your profile, ${bmiText}, ${riskText}.`);
  
  // Primary focus - make it goal-oriented and motivating
  if (reasoning.primary_focus.length > 0) {
    const goalDescriptions = {
      'weight loss': 'helping you reach a healthy weight',
      'muscle gain': 'supporting your muscle-building goals',
      'metabolic health': 'optimizing your overall wellness',
      'weight management': 'maintaining your ideal weight',
      'disease prevention': 'supporting your long-term health'
    };
    
    const goalText = goalDescriptions[primaryGoal] || primaryGoal;
    summaryParts.push(`The meals are designed with ${goalText} in mind, featuring ${reasoning.primary_focus[0].toLowerCase()}.`);
  }
  
  // Metabolic considerations - frame positively
  if (reasoning.metabolic_considerations.length > 0) {
    summaryParts.push(`To support your body's needs, I've focused on ${reasoning.metabolic_considerations[0].toLowerCase()}.`);
  }
  
  // Dietary adjustments - show personalization
  if (reasoning.dietary_adjustments.length > 0) {
    summaryParts.push(`I've also tailored the plan by ${reasoning.dietary_adjustments[0].toLowerCase()}.`);
  }
  
  // Lifestyle support - encouraging tone
  if (reasoning.lifestyle_recommendations.length > 0) {
    summaryParts.push(`For the best results, consider ${reasoning.lifestyle_recommendations[0].toLowerCase()}.`);
  }
  
  // Add encouraging closing
  summaryParts.push(`Remember, this is a starting point - we can adjust it as you progress!`);
  
  // Template-based summary as base
  const templateSummary = summaryParts.join(' ');
  
  // Try to enhance with Gemini AI for more natural, personalized explanation
  console.log('🔍 DEBUG: Checking Gemini model availability...');
  console.log('🔍 DEBUG: geminiModel exists?', !!geminiModel);
  console.log('🔍 DEBUG: geminiModel type:', typeof geminiModel);
  
  if (geminiModel) {
    try {
      console.log('🤖 Attempting AI-generated explanation...');
      console.log('🔍 DEBUG: Template summary (fallback):', templateSummary);
      
      const focusAreas = [
        ...reasoning.primary_focus,
        ...reasoning.metabolic_considerations,
        ...reasoning.dietary_adjustments,
        ...reasoning.lifestyle_recommendations
      ].filter(f => f).map(f => '- ' + f).join('\n');
      
      const prompt = `You are a friendly, professional nutritionist creating a personalized diet plan explanation.

Patient Profile:
- BMI: ${bmi.toFixed(1)} (${bmiCategory})
- Metabolic Risk: ${riskLevel || 'low'}
- Primary Goal: ${primaryGoal}
- Medical Conditions: ${riskFlags.join(', ') || 'none'}
- Dietary Restrictions: ${(clinicalProfile.dietary_restrictions?.allergies || []).join(', ') || 'none'}

Key Focus Areas:
${focusAreas || 'General health maintenance'}

Write a warm, personalized 2-3 sentence explanation of why this diet plan is tailored for this person. Be conversational, encouraging, and specific to their health profile. Focus on benefits and how it supports their goals.`;

      console.log('📝 Sending prompt to Gemini AI...');
      console.log('🔍 DEBUG: Prompt length:', prompt.length);
      
      const result = await geminiModel.generateContent(prompt);
      console.log('🔍 DEBUG: Received result from geminiModel');
      console.log('🔍 DEBUG: Result object:', JSON.stringify(result, null, 2));
      
      const aiSummary = result.response.text();
      console.log('🔍 DEBUG: AI Summary:', aiSummary);
      console.log('🔍 DEBUG: AI Summary length:', aiSummary?.length);
      
      if (aiSummary && aiSummary.trim()) {
        reasoning.constitution_summary = aiSummary.trim();
        console.log('✅ AI-generated diet plan explanation');
        console.log('✅ Final reasoning.constitution_summary:', reasoning.constitution_summary);
      } else {
        reasoning.constitution_summary = templateSummary;
        console.log('⚠️ AI returned empty, using template explanation');
      }
    } catch (error) {
      console.error('❌ AI enhancement failed - Full error details:');
      console.error('   Error message:', error.message);
      console.error('   Error name:', error.name);
      console.error('   Error stack:', error.stack);
      if (error.response) {
        console.error('   Error response:', JSON.stringify(error.response, null, 2));
      }
      reasoning.constitution_summary = templateSummary;
      console.log('⚠️ Falling back to template:', templateSummary);
    }
  } else {
    console.log('❌ No Gemini model initialized - using template explanation');
    console.log('🔍 DEBUG: GOOGLE_API_KEY present?', !!process.env.GOOGLE_API_KEY);
    reasoning.constitution_summary = templateSummary;
  }
  
  console.log('\n🔵 === _generateReasoning() COMPLETE ===');
  console.log('🔵 Returning reasoning with constitution_summary:', reasoning.constitution_summary?.substring(0, 100) + '...');
  
  return reasoning;
};

/**
 * Generate complete Modern diet plan
 * 
 * @param {Object} clinicalProfile - Output from assessment/modern.js score()
 * @param {Object} preferences - User dietary preferences
 * @returns {Object} Complete diet plan with weekly meals and recommendations
 */
const generateDietPlan = async (clinicalProfile, preferences = {}) => {
  try {
    // Step 1: Validate clinical profile
    _validateProfile(clinicalProfile);
    console.log('✓ Clinical profile validated');
    
    // Step 2: Score all foods
    console.log('Scoring all foods based on clinical profile...');
    const categorizedFoods = await scoreAllFoods(clinicalProfile);
    console.log(`✓ Scored ${categorizedFoods.highly_recommended.length + categorizedFoods.moderate.length + categorizedFoods.avoid.length} foods`);
    
    // Step 3: Apply user preferences
    if (preferences.vegetarian || preferences.vegan || preferences.excludeAllergens) {
      console.log('Applying dietary preferences...');
      categorizedFoods.highly_recommended = _applyPreferences(categorizedFoods.highly_recommended, preferences);
      categorizedFoods.moderate = _applyPreferences(categorizedFoods.moderate, preferences);
      categorizedFoods.avoid = _applyPreferences(categorizedFoods.avoid, preferences);
      console.log('✓ Preferences applied');
    }
    
    // Step 4: Generate 7-day meal plan
    console.log('Generating 7-day Modern meal plan...');
    const weeklyPlan = generateWeeklyPlan(clinicalProfile, categorizedFoods);
    console.log('✓ Weekly plan generated');
    
    // Step 5: Generate reasoning and summary (with AI if available)
    const reasoning = await _generateReasoning(clinicalProfile, categorizedFoods);
    console.log('✓ Reasoning generated');
    console.log('🔍 DEBUG: reasoning object keys:', Object.keys(reasoning));
    console.log('🔍 DEBUG: reasoning.constitution_summary:', reasoning.constitution_summary?.substring(0, 150));
    
    // Step 6: Transform weeklyPlan array to 7_day_plan object format
    const sevenDayPlan = {};
    weeklyPlan.forEach((dayPlan, index) => {
      const dayKey = `day_${index + 1}`;
      
      // Extract food names from meal objects
      const extractFoodNames = (meals) => {
        const foodNames = [];
        meals.forEach(meal => {
          if (meal.foods && Array.isArray(meal.foods)) {
            meal.foods.forEach(foodItem => {
              if (foodItem.food && foodItem.food.name) {
                foodNames.push(foodItem.food.name);
              }
            });
          }
        });
        return foodNames;
      };
      
      sevenDayPlan[dayKey] = {
        breakfast: extractFoodNames(dayPlan.meals.filter(m => m.meal_type === 'Breakfast')),
        lunch: extractFoodNames(dayPlan.meals.filter(m => m.meal_type === 'Lunch')),
        dinner: extractFoodNames(dayPlan.meals.filter(m => m.meal_type === 'Dinner')),
        snacks: extractFoodNames(dayPlan.meals.filter(m => m.meal_type && m.meal_type.includes('Snack'))),
        daily_targets: dayPlan.daily_targets,
        total_calories_estimated: dayPlan.total_calories_estimated
      };
    });
    
    // Step 7: Return complete plan in standardized format
    console.log('\n🟢 === RETURNING DIET PLAN ===');
    console.log('🟢 reasoning_summary being returned:', reasoning.constitution_summary?.substring(0, 150));
    
    return {
      '7_day_plan': sevenDayPlan,
      top_ranked_foods: categorizedFoods.highly_recommended.slice(0, 20).map(f => ({
        food_name: f.food.name,
        score: f.score
      })),
      reasoning_summary: reasoning.constitution_summary || JSON.stringify(reasoning),
      avoidFoods: categorizedFoods.avoid.slice(0, 15).map(f => ({
        food_name: f.food.name,
        score: f.score
      })),
      user_profile: {
        bmi: clinicalProfile.anthropometric.bmi,
        bmr: clinicalProfile.anthropometric.bmr_kcal,
        tdee: clinicalProfile.anthropometric.tdee_kcal,
        metabolic_risk_level: clinicalProfile.metabolic_risk_level
      },
      summary: {
        total_foods_scored: 
          categorizedFoods.highly_recommended.length + 
          categorizedFoods.moderate.length + 
          categorizedFoods.avoid.length,
        highly_recommended_count: categorizedFoods.highly_recommended.length,
        moderate_count: categorizedFoods.moderate.length,
        avoid_count: categorizedFoods.avoid.length
      }
    };
    
  } catch (error) {
    console.error('Modern diet plan generation error:', error);
    throw error;
  }
};

/**
 * Get scored food recommendations (without meal plan)
 * 
 * @param {Object} clinicalProfile - Output from assessment/modern.js score()
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Object} Categorized food recommendations
 */
const getFoodRecommendations = async (clinicalProfile, limit = 50) => {
  try {
    _validateProfile(clinicalProfile);
    
    const categorizedFoods = await scoreAllFoods(clinicalProfile);
    
    return {
      highly_recommended: categorizedFoods.highly_recommended.slice(0, Math.ceil(limit * 0.4)),
      moderate: categorizedFoods.moderate.slice(0, Math.ceil(limit * 0.4)),
      avoid: categorizedFoods.avoid.slice(0, Math.ceil(limit * 0.2)),
      summary: {
        total_foods_scored: 
          categorizedFoods.highly_recommended.length + 
          categorizedFoods.moderate.length + 
          categorizedFoods.avoid.length,
        bmi: clinicalProfile.anthropometric.bmi,
        metabolic_risk_level: clinicalProfile.metabolic_risk_level
      }
    };
  } catch (error) {
    console.error('Modern food recommendations error:', error);
    throw error;
  }
};

/**
 * Score a single food item
 * 
 * @param {Object} clinicalProfile - Output from assessment/modern.js score()
 * @param {Object} food - Food document or ID
 * @returns {Object} Scored food with detailed breakdown
 */
const scoreSingleFood = async (clinicalProfile, food) => {
  try {
    _validateProfile(clinicalProfile);
    
    // If food is an ID, fetch it
    if (typeof food === 'string') {
      const Food = require('../../../models/Food');
      food = await Food.findById(food);
      if (!food) {
        throw new Error('Food not found');
      }
    }
    
    const scoredFood = scoreFood(clinicalProfile, food);
    
    if (!scoredFood) {
      throw new Error('Food does not have Modern nutrition data or is invalid');
    }
    
    // Determine recommendation tier
    let recommendation;
    if (scoredFood.score >= 10) {
      recommendation = 'Highly Recommended';
    } else if (scoredFood.score >= 0) {
      recommendation = 'Moderate - Consume in moderation';
    } else {
      recommendation = 'Avoid or minimize';
    }
    
    return {
      ...scoredFood,
      recommendation,
      details: {
        caloric_alignment: scoredFood.breakdown.goal_based > 0 
          ? 'Well-aligned with your nutrition goals' 
          : 'Not optimally aligned with your goals',
        metabolic_safety: scoredFood.breakdown.metabolic_risk >= 0 
          ? 'Safe for your metabolic profile' 
          : 'May worsen metabolic risk factors',
        digestive_compatibility: scoredFood.breakdown.digestive >= 0 
          ? 'Compatible with your digestive health' 
          : 'May trigger digestive discomfort',
        reason_summary: scoredFood.rule_reasons.join('; ')
      }
    };
  } catch (error) {
    console.error('Error scoring single food:', error);
    throw error;
  }
};

module.exports = {
  generateDietPlan,
  getFoodRecommendations,
  scoreSingleFood
};
