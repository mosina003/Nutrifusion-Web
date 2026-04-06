/**
 * TCM Diet Plan Service - Integration Module
 * Combines scoring engine and meal plan generator
 */

const tcmDietEngine = require('./tcmDietEngine');
const tcmMealPlan = require('./tcmMealPlan');

class TCMDietPlanService {
  /**
   * Generate complete TCM diet plan for user
   * @param {Object} userAssessment - User's TCM assessment result
   * @param {Object} options - Optional configuration
   * @returns {Promise<Object>} - Complete diet plan with rankings and 7-day plan
   */
  async generateDietPlan(userAssessment, options = {}) {
    try {
      // Validate user assessment
      if (!this._validateAssessment(userAssessment)) {
        throw new Error('Invalid user assessment data');
      }

      // console.log('📊 Loading TCM foods from JSON file...');

      // Load all foods from JSON
      const foods = tcmDietEngine.getAllFoods();

      // console.log(`📊 Scoring ${foods.length} foods for TCM diet plan...`);

      // Score all foods
      const scoredFoods = foods.map(food => 
        tcmDietEngine.scoreFood(food, userAssessment)
      );

      // Rank foods
      const rankedFoods = tcmDietEngine.rankFoods(scoredFoods);

      // console.log(`✅ Ranked foods: ${rankedFoods.recommendation_count} recommended, ${rankedFoods.avoid_count} to avoid`);

      // Generate 7-day meal plan
      const mealPlan = tcmMealPlan.generateWeeklyPlan(rankedFoods, userAssessment);

      // console.log('✅ Generated 7-day TCM meal plan');

      // DEBUG: Log the actual structure
      console.log('🔍 TCM mealPlan type:', typeof mealPlan, 'is object:', typeof mealPlan === 'object');
      console.log('🔍 TCM mealPlan["7_day_plan"] type:', typeof mealPlan['7_day_plan']);
      console.log('🔍 Is array?', Array.isArray(mealPlan['7_day_plan']));
      console.log('🔍 7_day_plan length:', mealPlan['7_day_plan']?.length);
      console.log('🔍 7_day_plan first item:', JSON.stringify(mealPlan['7_day_plan']?.[0], null, 2));

      // Convert array format to object format (day_1, day_2, etc) to match Ayurveda
      const sevenDayPlanObject = {};
      if (Array.isArray(mealPlan['7_day_plan'])) {
        console.log('✅ Converting', mealPlan['7_day_plan'].length, 'days from array to object format');
        mealPlan['7_day_plan'].forEach((dayPlan, index) => {
          const dayNum = index + 1;
          const breakfast = dayPlan.meals?.find(m => m.meal_type === 'Breakfast');
          const lunch = dayPlan.meals?.find(m => m.meal_type === 'Lunch');
          const dinner = dayPlan.meals?.find(m => m.meal_type === 'Dinner');
          
          console.log(`  📅 Day ${dayNum}: B=${breakfast?.foods?.length || 0}, L=${lunch?.foods?.length || 0}, D=${dinner?.foods?.length || 0}`);
          
          sevenDayPlanObject[`day_${dayNum}`] = {
            breakfast: breakfast ? breakfast.foods.map(f => f.food?.name || f.name || 'Unknown') : [],
            lunch: lunch ? lunch.foods.map(f => f.food?.name || f.name || 'Unknown') : [],
            dinner: dinner ? dinner.foods.map(f => f.food?.name || f.name || 'Unknown') : []
          };
        });
        console.log('✅ Converted to object:', Object.keys(sevenDayPlanObject));
      } else {
        console.error('🚨 CRITICAL: mealPlan["7_day_plan"] is NOT an array! Type:', typeof mealPlan['7_day_plan'], 'Value:', JSON.stringify(mealPlan['7_day_plan'], null, 2).substring(0, 200));
      }

      // Return complete response in format matching Ayurveda (for consistency)
      return {
        '7_day_plan': sevenDayPlanObject,
        top_ranked_foods: rankedFoods.top_ranked_foods?.slice(0, 20).map(f => ({
          food_name: f.food_name || f.name || 'Unknown',
          score: f.score || 0
        })) || [],
        reasoning_summary: typeof mealPlan.reasoning_summary === 'object' 
          ? `TCM Analysis: Thermal Pattern - ${mealPlan.reasoning_summary?.thermal_pattern || 'Unknown'}, Digestive Strength - ${mealPlan.reasoning_summary?.digestive_strength || 'Unknown'}. Key Principles: ${mealPlan.reasoning_summary?.key_principles?.join(', ') || 'None specified'}`
          : (mealPlan.reasoning_summary || 'TCM diet plan generated'),
        user_profile: {
          primary_pattern: userAssessment.primary_pattern,
          secondary_pattern: userAssessment.secondary_pattern,
          cold_heat: userAssessment.cold_heat,
          severity: userAssessment.severity
        },
        food_rankings: {
          highly_recommended: rankedFoods.top_ranked_foods.slice(0, 20).map(f => ({
            name: f.food_name,
            category: f.category,
            score: f.score,
            reasons: f.reasons
          })),
          moderately_recommended: rankedFoods.top_ranked_foods.slice(20, 40).map(f => ({
            name: f.food_name,
            category: f.category,
            score: f.score
          })),
          avoid: rankedFoods.avoid_foods.slice(0, 15).map(f => ({
            name: f.food_name,
            category: f.category,
            score: f.score,
            reasons: f.reasons
          }))
        },
        avoidFoods: rankedFoods.avoid_foods.slice(0, 15).map(f => f.food_name)
      };
    } catch (error) {
      console.error('Error generating TCM diet plan:', error);
      throw error;
    }
  }

  /**
   * Score a single food for a user
   * @param {Object} food - Food item
   * @param {Object} userAssessment - User's assessment
   * @returns {Object} - Scored food
   */
  scoreSingleFood(food, userAssessment) {
    if (!this._validateAssessment(userAssessment)) {
      throw new Error('Invalid user assessment data');
    }

    return tcmDietEngine.scoreFood(food, userAssessment);
  }

  /**
   * Get food recommendations (without full meal plan)
   * @param {Object} userAssessment - User's assessment
   * @param {Number} limit - Number of recommendations
   * @returns {Promise<Array>} - Top recommended foods
   */
  async getFoodRecommendations(userAssessment, limit = 20) {
    const foods = await Food.find({ verified: true }).lean();
    
    const scoredFoods = foods.map(food => 
      tcmDietEngine.scoreFood(food, userAssessment)
    );

    const rankedFoods = tcmDietEngine.rankFoods(scoredFoods);

    return rankedFoods.top_ranked_foods.slice(0, limit).map(f => ({
      name: f.food_name,
      category: f.category,
      score: f.score,
      reasons: f.reasons,
      thermalNature: f.rawFood.tcm?.thermalNature,
      flavor: f.rawFood.tcm?.flavor,
      properties: {
        tonifies_qi: f.rawFood.tcm?.tonifies_qi,
        nourishes_yin: f.rawFood.tcm?.nourishes_yin,
        warms_yang: f.rawFood.tcm?.warms_yang,
        clears_heat: f.rawFood.tcm?.clears_heat,
        resolves_dampness: f.rawFood.tcm?.resolves_dampness,
        moves_qi: f.rawFood.tcm?.moves_qi
      }
    }));
  }

  /**
   * Validate user assessment structure
   * @private
   */
  _validateAssessment(assessment) {
    const required = ['primary_pattern', 'cold_heat', 'severity'];
    
    for (const field of required) {
      if (!assessment[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate values
    const validPatterns = [
      'Cold Pattern', 'Heat Pattern', 'Qi Deficiency', 'Qi Excess',
      'Dampness', 'Dryness', 'Liver Qi Stagnation', 'Liver Heat',
      'Yin Deficiency', 'Yang Deficiency', 'Balanced'
    ];

    if (!validPatterns.includes(assessment.primary_pattern)) {
      console.error(`Invalid primary_pattern: ${assessment.primary_pattern}`);
      return false;
    }

    if (!['Cold', 'Heat', 'Balanced'].includes(assessment.cold_heat)) {
      console.error(`Invalid cold_heat: ${assessment.cold_heat}`);
      return false;
    }

    if (assessment.severity < 1 || assessment.severity > 3) {
      console.error(`Invalid severity: ${assessment.severity}`);
      return false;
    }

    return true;
  }
}

module.exports = new TCMDietPlanService();
