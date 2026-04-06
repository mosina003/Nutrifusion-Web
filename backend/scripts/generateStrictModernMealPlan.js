#!/usr/bin/env node

/**
 * Modern Nutrition Strict Meal Plan Generator - Test Script
 * Tests the strict modern nutrition meal plan generation with sample user profile data
 * 
 * Usage:
 *   node scripts/generateStrictModernMealPlan.js <bmi> <goal>
 *   node scripts/generateStrictModernMealPlan.js obese weight_loss      (Weight loss for obese person)
 *   node scripts/generateStrictModernMealPlan.js normal maintenance     (Maintenance for normal BMI)
 *   node scripts/generateStrictModernMealPlan.js underweight muscle_gain (Muscle gain for underweight)
 * 
 * BMI values: underweight, normal, overweight, obese
 * Goals: weight_loss, maintenance, muscle_gain
 */

const { generateStrictDailyMealPlan } = require('../services/intelligence/diet/modernNutritionMealPlan');

// Parse command-line arguments
const args = process.argv.slice(2);

let userProfile = {
  bmi: 'normal',
  goal: 'maintenance'
};

if (args.length >= 2) {
  userProfile.bmi = args[0];
  userProfile.goal = args[1];
}

console.log('\n');

try {
  const mealPlan = generateStrictDailyMealPlan(userProfile);
  process.exit(0);
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
}
