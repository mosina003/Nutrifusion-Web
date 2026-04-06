#!/usr/bin/env node

/**
 * Unani Strict Meal Plan Generator - Test Script
 * Tests the strict Unani meal plan generation with sample temperament data
 * 
 * Usage:
 *   node scripts/generateStrictUnaniMealPlan.js <temperament_type>
 *   node scripts/generateStrictUnaniMealPlan.js damvi      (Hot + Moist)
 *   node scripts/generateStrictUnaniMealPlan.js safravi    (Hot + Dry)
 *   node scripts/generateStrictUnaniMealPlan.js balghami   (Cold + Moist)
 *   node scripts/generateStrictUnaniMealPlan.js saudavi    (Cold + Dry)
 */

const { generateStrictDailyMealPlan } = require('../services/intelligence/diet/unaniMealPlan');

// Parse command-line arguments
const args = process.argv.slice(2);

let userType = 'damvi';

if (args.length >= 1) {
  userType = args[0];
}

console.log('\n');

try {
  const mealPlan = generateStrictDailyMealPlan(userType);
  process.exit(0);
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
}
