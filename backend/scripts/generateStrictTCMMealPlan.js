#!/usr/bin/env node

/**
 * TCM Strict Meal Plan Generator - Test Script
 * Tests the strict TCM meal plan generation with sample TCM condition data
 * 
 * Usage:
 *   node scripts/generateStrictTCMMealPlan.js <yin> <yang> <heat> <cold>
 *   node scripts/generateStrictTCMMealPlan.js 40 50 60 20  (Yin deficiency + Heat excess + Yang deficiency)
 *   node scripts/generateStrictTCMMealPlan.js 30 60 40 40  (Yin deficiency, Yang excess, balanced heat/cold)
 */

const { generateStrictDailyMealPlan } = require('../services/intelligence/diet/tcmMealPlan');

// Parse command-line arguments
const args = process.argv.slice(2);

let condition = {
  yin: 50,
  yang: 50,
  heat: 25,
  cold: 25
};

if (args.length >= 4) {
  condition.yin = parseInt(args[0], 10);
  condition.yang = parseInt(args[1], 10);
  condition.heat = parseInt(args[2], 10);
  condition.cold = parseInt(args[3], 10);
}

console.log('\n');

try {
  const mealPlan = generateStrictDailyMealPlan(condition);
  process.exit(0);
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
}
