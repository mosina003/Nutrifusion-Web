/**
 * Unani Diet Plan Service - Integration Module
 * Combines scoring engine and meal plan generator
 */

const unaniDietEngine = require('./unaniDietEngine');
const unaniMealPlan = require('./unaniMealPlan');

class UnaniDietPlanService {
  /**
   * Generate complete Unani diet plan for user
   * @param {Object} userAssessment - User's Unani assessment result
   * @param {Object} options - Optional configuration
   * @returns {Promise<Object>} - Complete diet plan with rankings and 7-day plan
   */
  async generateDietPlan(userAssessment, options = {}) {
    try {
      // Validate user assessment
      if (!this._validateAssessment(userAssessment)) {
        throw new Error('Invalid user assessment data');
      }

      console.log('📊 Scoring Unani foods from JSON file...');

      // Score and rank all foods (will load from JSON)
      const rankedFoods = unaniDietEngine.scoreAllFoods(null, userAssessment);

      console.log(`✅ Ranked foods: ${rankedFoods.highly_suitable.length} highly suitable, ${rankedFoods.moderately_suitable.length} moderately suitable, ${rankedFoods.avoid.length} to avoid`);

      // Generate 7-day meal plan
      const mealPlan = unaniMealPlan.generateWeeklyPlan(rankedFoods, userAssessment);

      console.log('✅ Generated 7-day meal plan');

      // DEBUG: Log the actual structure
      console.log('🔍 Unani mealPlan type:', typeof mealPlan, 'is object:', typeof mealPlan === 'object');
      console.log('🔍 Unani mealPlan["7_day_plan"] type:', typeof mealPlan['7_day_plan']);
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
            breakfast: breakfast ? breakfast.foods.map(f => typeof f === 'string' ? f : (f.food?.name || f.name || 'Unknown')) : [],
            lunch: lunch ? lunch.foods.map(f => typeof f === 'string' ? f : (f.food?.name || f.name || 'Unknown')) : [],
            dinner: dinner ? dinner.foods.map(f => typeof f === 'string' ? f : (f.food?.name || f.name || 'Unknown')) : []
          };
        });
        console.log('✅ Converted to object:', Object.keys(sevenDayPlanObject));
      } else {
        console.error('🚨 CRITICAL: mealPlan["7_day_plan"] is NOT an array! Type:', typeof mealPlan['7_day_plan'], 'Value:', JSON.stringify(mealPlan['7_day_plan'], null, 2).substring(0, 200));
      }

      // Return complete response in format matching Ayurveda (for consistency)
      return {
        '7_day_plan': sevenDayPlanObject,
        top_ranked_foods: rankedFoods.highly_suitable?.slice(0, 20).map(f => ({
          food_name: f.food_name || f.name || 'Unknown',
          score: f.score || 0
        })) || [],
        reasoning_summary: typeof mealPlan.reasoning_summary === 'object'
          ? `Unani Analysis: Primary Mizaj - ${mealPlan.reasoning_summary?.primary_mizaj || 'Unknown'}, Secondary Mizaj - ${mealPlan.reasoning_summary?.secondary_mizaj || 'Unknown'}, Digestive Strength - ${mealPlan.reasoning_summary?.digestive_strength || 'Unknown'}. Key Principles: ${mealPlan.reasoning_summary?.key_principles?.join(', ') || 'None specified'}`
          : (mealPlan.reasoning_summary || 'Unani diet plan generated'),
        user_profile: {
          primary_mizaj: userAssessment.primary_mizaj,
          secondary_mizaj: userAssessment.secondary_mizaj,
          dominant_humor: userAssessment.dominant_humor,
          severity: userAssessment.severity,
          digestive_strength: userAssessment.digestive_strength
        },
        food_rankings: {
          highly_suitable: rankedFoods.highly_suitable.slice(0, 20).map(f => ({
            name: f.food_name,
            category: f.category,
            score: f.score,
            reasons: f.reasons
          })),
          moderately_suitable: rankedFoods.moderately_suitable.slice(0, 15).map(f => ({
            name: f.food_name,
            category: f.category,
            score: f.score
          })),
          avoid: rankedFoods.avoid.slice(0, 15).map(f => ({
            name: f.food_name,
            category: f.category,
            score: f.score,
            reasons: f.reasons
          }))
        },
        avoidFoods: rankedFoods.avoid.slice(0, 15).map(f => f.food_name)
      };
    } catch (error) {
      console.error('Error generating Unani diet plan:', error);
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

    return unaniDietEngine.scoreFood(food, userAssessment);
  }

  /**
   * Get food recommendations (without full meal plan)
   * @param {Object} userAssessment - User's assessment
   * @param {Number} limit - Number of recommendations
   * @returns {Promise<Array>} - Top recommended foods
   */
  async getFoodRecommendations(userAssessment, limit = 20) {
    const foods = await Food.find({ verified: true }).lean();
    const rankedFoods = unaniDietEngine.scoreAllFoods(foods, userAssessment);

    return rankedFoods.highly_suitable.slice(0, limit).map(f => ({
      name: f.food_name,
      category: f.category,
      score: f.score,
      reasons: f.reasons,
      temperament: f.rawFood.unani?.temperament,
      humorEffects: f.rawFood.unani?.humorEffects
    }));
  }

  /**
   * Validate user assessment structure
   * @private
   */
  _validateAssessment(assessment) {
    const required = ['primary_mizaj', 'dominant_humor', 'severity', 'digestive_strength'];
    
    for (const field of required) {
      if (!assessment[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate values
    if (!['dam', 'safra', 'balgham', 'sauda'].includes(assessment.primary_mizaj)) {
      console.error(`Invalid primary_mizaj: ${assessment.primary_mizaj}`);
      return false;
    }

    if (assessment.severity < 1 || assessment.severity > 3) {
      console.error(`Invalid severity: ${assessment.severity}`);
      return false;
    }

    const validStrengths = ['weak', 'slow', 'moderate', 'strong', 'strong_but_hot'];
    if (!validStrengths.includes(assessment.digestive_strength)) {
      console.error(`Invalid digestive_strength: ${assessment.digestive_strength}`);
      return false;
    }

    return true;
  }
}

module.exports = new UnaniDietPlanService();
