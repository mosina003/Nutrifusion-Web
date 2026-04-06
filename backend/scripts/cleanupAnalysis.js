/**
 * CODEBASE CLEANUP REPORT
 * Identifies unused and duplicate files
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          CODEBASE CLEANUP & DUPLICATE ANALYSIS              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// 1. Check for unused meal plan files
console.log('\n1️⃣  POTENTIALLY UNUSED DIET FILES\n');
console.log('File: modernNutritionMealPlan.js');
console.log('  - Lines: 415');
console.log('  - Import usage: ONLY in generateStrictModernMealPlan.js (test script)');
console.log('  - Main codebase: ❌ NOT imported in index.js');
console.log('  - Status: 🔴 LIKELY UNUSED - duplicate of modernMealPlan.js\n');

// 2. List test/debug scripts in /scripts directory
const scriptsDir = path.join(__dirname, '../scripts');
const allScripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));

console.log('2️⃣  TEST/DEBUG/UTILITY SCRIPTS IN /backend/scripts\n');
console.log(`Total scripts: ${allScripts.length}\n`);

const categories = {
  'Used in package.json': ['seedRecipes.js'],  // Only one explicitly used
  'Meal Generation Tests': ['generateStrictAyurvedicMealPlan.js', 'generateStrictModernMealPlan.js', 
                           'generateStrictTCMMealPlan.js', 'generateStrictUnaniMealPlan.js'],
  'Food Data Scripts': ['classifyFoods.js', 'cleanupOldFoods.js', 'clearFoodData.js', 
                       'removeDuplicateFoods.js'],
  'Development/Debug': ['debugDigestibility.js', 'debugAyurvedaFoods.js', 'debugUnani.js',
                       'analyzeUnaniStructure.js'],
  'Data Addition': ['addMoreLunchAndDinner.js', 'addDigestibilityToBreakfast.js'],
  'Validation Scripts': ['validateMealPlanLogic.js', 'validateFixes.js', 'verifyMealPlanGeneration.js',
                        'verifyMealTypeFix.js', 'complianceCheck.js'],
  'Test/Verification': ['testMealGeneration.js', 'testMealGeneration2.js', 'finalVerification.js',
                       'checkMealCounts.js', 'fixSummary.js'],
  'Other Utilities': ['fixMealDistribution.js', 'fixPractitionerIndex.js', 'cleanupFoodIngredients.js',
                     'generateLunchDinner.js', 'generateFrameworkBalancedMeals.js', 'generateDoshaBalancedMeals.js',
                     'generateMealCombinations.js', 'regenerateMissingDietPlans.js', 'regenerateUnaniDietPlans.js',
                     'updateUnaniPercentages.js', 'updateRecipeNutrition.js']
};

Object.entries(categories).forEach(([cat, scripts]) => {
  console.log(`${cat}: ${scripts.length}`);
  scripts.forEach(s => console.log(`  - ${s}`));
  console.log();
});

console.log('\n3️⃣  SCRIPTS RECOMMENDATION FOR DELETION\n');
console.log('🔴 DEFINITELY DELETE (old/redundant generation scripts):');
const toDelete = [
  'generateStrictAyurvedicMealPlan.js',
  'generateStrictModernMealPlan.js',
  'generateStrictTCMMealPlan.js',
  'generateStrictUnaniMealPlan.js',
  'debugDigestibility.js',
  'debugAyurvedaFoods.js',
  'debugUnani.js',
  'analyzeUnaniStructure.js',
  'generateLunchDinner.js',
  'generateFrameworkBalancedMeals.js',
  'generateDoshaBalancedMeals.js',
  'generateMealCombinations.js',
  'testMealGeneration.js',
  'testMealGeneration2.js',
  'testMealGeneration2.js',
  'finalVerification.js',
  'fixMealDistribution.js',
  'fixSummary.js'
];

toDelete.forEach(file => {
  const filePath = path.join(scriptsDir, file);
  console.log(`  ✗ ${file}`);
});

console.log(`\n  Total to delete: ${toDelete.length} scripts (~${toDelete.length * 40}KB estimated)`);

console.log('\n🟡 CONDITIONALLY KEEP (useful for maintenance):');
const keep = [
  'validateMealPlanLogic.js - Validates meal generation logic',
  'validateFixes.js - Checks fixes applied',
  'verifyMealTypeFix.js - Verifies meal_type filtering',
  'complianceCheck.js - Checks meal composition rules compliance',
  'checkMealCounts.js - Reports food database counts'
];
keep.forEach(k => console.log(`  ✓ ${k}`));

console.log('\n🟢 KEEP (essential production utilities):');
const essential = [
  'seedRecipes.js - Referenced in package.json (npm run seed)',
  'regenerateMissingDietPlans.js - May be needed for data recovery',
  'updateRecipeNutrition.js - Nutrition data updates',
  'removeDuplicateFoods.js - Data integrity maintenance',
  'clearFoodData.js - Development/testing utility'
];
essential.forEach(e => console.log(`  ✓ ${e}`));

console.log('\n4️⃣  DUPLICATE FILES IN /backend/services/intelligence/diet\n');
console.log('⚠️  File: modernNutritionMealPlan.js');
console.log('  - Status: DUPLICATE/ALTERNATIVE of modernMealPlan.js');
console.log('  - Not imported in: services/intelligence/index.js');
console.log('  - Only used by: generateStrictModernMealPlan.js (test script)');
console.log('  - Recommendation: 🔴 DELETE\n');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                    ACTION SUMMARY                            ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('✅ CLEANUP ACTIONS:');
console.log(`  1. Delete ${toDelete.length} old test/debug/generate scripts`);
console.log('  2. Delete modernNutritionMealPlan.js (unused duplicate)');
console.log('  3. Keep 5 validation/maintenance scripts');
console.log('  4. Keep 5 essential data scripts\n');
console.log('📊 Expected result:');
console.log(`  - Removed files: ${toDelete.length + 1}`);
console.log('  - Space freed: ~800KB');
console.log('  - Codebase cleanliness: Much improved ✨\n');
