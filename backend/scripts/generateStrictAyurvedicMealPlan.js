#!/usr/bin/env node

/**
 * STRICT AYURVEDIC MEAL PLAN GENERATOR
 * 
 * Demonstrates the strict meal plan generation following all Ayurvedic rules:
 * - Breakfast: LIGHT and digestible
 * - Lunch: MAIN meal with grain+protein+vegetable  
 * - Dinner: VERY LIGHT and easy to digest
 * - Validates all incompatible combinations
 * - Respects dosha-specific food preferences
 * 
 * Usage:
 *   node generateStrictAyurvedicMealPlan.js [vata] [pitta] [kapha]
 *   
 * Example:
 *   node generateStrictAyurvedicMealPlan.js 50 20 30
 * 
 * Default (Vata-dominant):
 *   node generateStrictAyurvedicMealPlan.js
 */

const fs = require('fs');
const path = require('path');

// Load Ayurveda food data
const foodPath = path.join(__dirname, '../data/ayurveda_food_constitution.json');
let ayurvedaFoods = [];

try {
  const foodData = fs.readFileSync(foodPath, 'utf8');
  ayurvedaFoods = JSON.parse(foodData);
  console.log(`✅ Loaded ${ayurvedaFoods.length} Ayurveda foods\n`);
} catch (error) {
  console.error('❌ Error loading Ayurveda foods:', error.message);
  process.exit(1);
}

// Load the meal plan generator
const { generateStrictDailyMealPlan } = require('../services/intelligence/diet/ayurvedaMealPlan');

// Parse command line arguments or use defaults
const args = process.argv.slice(2);
const vata = parseInt(args[0]) || 50;
const pitta = parseInt(args[1]) || 20;
const kapha = parseInt(args[2]) || 30;

const prakritiData = { vata, pitta, kapha };

console.log('═════════════════════════════════════════════════════════════════');
console.log('🧬 STRICT AYURVEDIC MEAL PLAN GENERATOR');
console.log('═════════════════════════════════════════════════════════════════');
console.log(`\n📊 User Dosha Profile:\n`);
console.log(`   Vata:  ${vata}%`);
console.log(`   Pitta: ${pitta}%`);
console.log(`   Kapha: ${kapha}%`);
console.log('\n📋 STRICT RULES APPLIED:\n');
console.log('   ✓ Breakfast: Light, digestibility ≤ 3, NO high ama');
console.log('   ✓ Lunch: Grain + Protein + Vegetable (main meal)');
console.log('   ✓ Dinner: Very light, digestibility ≤ 2, NO fried/heavy');
console.log('   ✓ NO fruit + cooked combinations');
console.log('   ✓ NO duplicate carbs in one meal');
console.log('   ✓ NO dairy + meat combinations');
console.log('   ✓ Max 3-4 items per meal');
console.log('\n═════════════════════════════════════════════════════════════════\n');

try {
  // Generate meal plan
  const mealPlan = generateStrictDailyMealPlan(prakritiData, ayurvedaFoods);

  // Display results
  console.log('🥣 BREAKFAST (Light & Digestible):\n');
  console.log(`   Foods: ${mealPlan.breakfast.meal.join(' + ')}`);
  console.log(`   Reasons:`);
  mealPlan.breakfast.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n\n🍽️  LUNCH (Main Meal - Balanced):\n');
  console.log(`   Foods: ${mealPlan.lunch.meal.join(' + ')}`);
  console.log(`   Reasons:`);
  mealPlan.lunch.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n\n🌙 DINNER (Very Light & Soothing):\n');
  console.log(`   Foods: ${mealPlan.dinner.meal.join(' + ')}`);
  console.log(`   Reasons:`);
  mealPlan.dinner.reason.forEach(r => console.log(`     • ${r}`));

  console.log('\n\n═════════════════════════════════════════════════════════════════');
  console.log('✅ VALIDATION COMPLETE - All rules satisfied!\n');

  // Output JSON
  const output = {
    timestamp: new Date().toISOString(),
    prakritiData: mealPlan.doshaProfile,
    dominantDosha: mealPlan.dominantDosha,
    mealPlan: {
      breakfast: mealPlan.breakfast,
      lunch: mealPlan.lunch,
      dinner: mealPlan.dinner
    },
    rulesValidated: [
      'No fruit + cooked combinations',
      'No duplicate carbs per meal',
      'No dairy + meat combinations',
      'Breakfast digestibility ≤ 3',
      'Dinner digestibility ≤ 2',
      'Max 3-4 items per meal',
      'No high ama foods at breakfast/dinner',
      'Dosha-specific food selection applied'
    ]
  };

  // Save to file
  const outputFile = path.join(__dirname, '../data/strict_ayurvedic_meal_plan.json');
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`✅ Meal plan saved to: strict_ayurvedic_meal_plan.json\n`);

} catch (error) {
  console.error(`\n❌ Error generating meal plan: ${error.message}\n`);
  process.exit(1);
}
