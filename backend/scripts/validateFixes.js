/**
 * FINAL VALIDATION - Diet Plan Generation Fixes
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   VALIDATING MEAL PLAN GENERATION - ALL FILES CHECKED    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Load all frameworks
const frameworks = {
  'Ayurveda': 'ayurveda_food_constitution.json',
  'TCM': 'tcm_food_constitution.json',
  'Modern': 'modern_food_constitution.json',
  'Unani': 'unani_food_constitution.json'
};

console.log('TEST: Meal Type Filtering in Food Databases\n');

let allValid = true;

Object.entries(frameworks).forEach(([name, file]) => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  
  const breakfast = data.filter(f => f.meal_type?.includes('breakfast'));
  const lunch = data.filter(f => f.meal_type?.includes('lunch'));
  const dinner = data.filter(f => f.meal_type?.includes('dinner'));
  
  console.log(`${name}:`);
  console.log(`  ✓ Breakfast items: ${breakfast.length}`);
  console.log(`  ✓ Lunch items: ${lunch.length}`);
  console.log(`  ✓ Dinner items: ${dinner.length}`);
  console.log(`  ✓ Total: ${data.length}\n`);
  
  // Validation checks
  const breakfast_ok = breakfast.length >= 50;
  const lunch_ok = lunch.length >= 50;
  const dinner_ok = dinner.length >= 40;
  
  if (!breakfast_ok || !lunch_ok || !dinner_ok) {
    console.log(`  ❌ INSUFFICIENT DATA for generation!`);
    allValid = false;
  }
});

// Check code for meal_type filtering
console.log('TEST: Code Files Have meal_type Filtering\n');

const codeFiles = {
  'ayurvedaMealPlan.js': 'backend/services/intelligence/diet/ayurvedaMealPlan.js',
  'tcmMealPlan.js': 'backend/services/intelligence/diet/tcmMealPlan.js',
  'modernMealPlan.js': 'backend/services/intelligence/diet/modernMealPlan.js',
  'unaniMealPlan.js': 'backend/services/intelligence/diet/unaniMealPlan.js'
};

Object.entries(codeFiles).forEach(([name, filePath]) => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for meal_type filtering (multiple patterns possible)
  const checks = {
    breakfast: content.includes("meal_type") && (
      content.includes("'breakfast'") || content.includes('"breakfast"')
    ),
    lunch: content.includes("meal_type") && (
      content.includes("'lunch'") || content.includes('"lunch"')
    ),
    dinner: content.includes("meal_type") && (
      content.includes("'dinner'") || content.includes('"dinner"')
    )
  };
  
  const hasAll = checks.breakfast && checks.lunch && checks.dinner;
  
  console.log(`${name}:`);
  console.log(`  ${checks.breakfast ? '✅' : '❌'} Breakfast filtering: ${checks.breakfast ? 'YES' : 'NO'}`);
  console.log(`  ${checks.lunch ? '✅' : '❌'} Lunch filtering: ${checks.lunch ? 'YES' : 'NO'}`);
  console.log(`  ${checks.dinner ? '✅' : '❌'} Dinner filtering: ${checks.dinner ? 'YES' : 'NO'}`);
  
  if (!hasAll) {
    console.log(`  ⚠️  MISSING: Some filtering needed`);
    allValid = false;
  } else {
    console.log(`  ✅ All meal types have filtering`);
  }
  console.log();
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                      SUMMARY                             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (allValid) {
  console.log('✅ ALL VALIDATIONS PASSED!\n');
  console.log('📋 Meal Plan Generation Ready:');
  console.log('   ✓ 50 breakfast options per framework');
  console.log('   ✓ 50 lunch options per framework');
  console.log('   ✓ 40 dinner options per framework');
  console.log('   ✓ All code files have proper meal_type filtering\n');
  console.log('🎯 Next: Test actual meal plan generation with sample user profiles\n');
} else {
  console.log('❌ ISSUES FOUND - Fix required!\n');
}
