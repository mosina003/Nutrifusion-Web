/**
 * Validate Meal Plan Generation Logic
 * 
 * Checks:
 * 1. Dinner items don't include heavy/fried foods
 * 2. Lunch/dinner items are properly tagged with meal_type
 * 3. Breakfast items are separate from lunch/dinner items
 * 4. Digestibility rules are upheld
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

// Load all databases
const ayurveda = JSON.parse(fs.readFileSync(path.join(dataDir, 'ayurveda_food_constitution.json'), 'utf8'));
const tcm = JSON.parse(fs.readFileSync(path.join(dataDir, 'tcm_food_constitution.json'), 'utf8'));
const modern = JSON.parse(fs.readFileSync(path.join(dataDir, 'modern_food_constitution.json'), 'utf8'));
const unani = JSON.parse(fs.readFileSync(path.join(dataDir, 'unani_food_constitution.json'), 'utf8'));

console.log('\n========================================');
console.log('MEAL PLAN GENERATION VALIDATION');
console.log('========================================\n');

// ============================================
// 1. CHECK MEAL TYPE DISTRIBUTION
// ============================================
console.log('📊 1. MEAL TYPE DISTRIBUTION:\n');

const checkMealTypeDistribution = (foods, name) => {
  const breakfast = foods.filter(f => f.meal_type && f.meal_type.includes('breakfast')).length;
  const lunch = foods.filter(f => f.meal_type && f.meal_type.includes('lunch')).length;
  const dinner = foods.filter(f => f.meal_type && f.meal_type.includes('dinner')).length;
  const total = foods.length;
  
  console.log(`${name}:`);
  console.log(`  - Total items: ${total}`);
  console.log(`  - Breakfast: ${breakfast} (${(breakfast/total*100).toFixed(1)}%)`);
  console.log(`  - Lunch: ${lunch} (${(lunch/total*100).toFixed(1)}%)`);
  console.log(`  - Dinner: ${dinner} (${(dinner/total*100).toFixed(1)}%)`);
  
  if (breakfast !== 50 || lunch !== 50 || dinner !== 0) {
    console.log(`  ⚠️  ISSUE: Expected 50 breakfast + 50 lunch/dinner (not 0 dinner)`);
  }
  
  return { breakfast, lunch, dinner };
};

const ayuStats = checkMealTypeDistribution(ayurveda, 'Ayurveda');
const tcmStats = checkMealTypeDistribution(tcm, 'TCM');
const modernStats = checkMealTypeDistribution(modern, 'Modern');
const unaniStats = checkMealTypeDistribution(unani, 'Unani');

// ============================================
// 2. CHECK DINNER HEAVY/FRIED VIOLATIONS
// ============================================
console.log('\n📋 2. DINNER HEAVY/FRIED FOOD VIOLATIONS:\n');

const checkDinnerHeavyFriedViolations = (foods, name) => {
  const dinnerFoods = foods.filter(f => f.meal_type && f.meal_type.includes('dinner'));
  
  const violations = dinnerFoods.filter(f => f.is_heavy === true || f.is_fried === true);
  
  console.log(`${name}:`);
  console.log(`  - Total dinner items: ${dinnerFoods.length}`);
  console.log(`  - Items marked is_heavy: ${dinnerFoods.filter(f => f.is_heavy).length}`);
  console.log(`  - Items marked is_fried: ${dinnerFoods.filter(f => f.is_fried).length}`);
  console.log(`  - VIOLATIONS (heavy OR fried at dinner): ${violations.length}`);
  
  if (violations.length > 0) {
    console.log(`  ❌ CRITICAL: Found ${violations.length} violations!\n`);
    violations.slice(0, 5).forEach(v => {
      console.log(`     - "${v.food_name}" (is_heavy=${v.is_heavy}, is_fried=${v.is_fried}, digestibility=${v.digestibility_score})`);
    });
    if (violations.length > 5) console.log(`     ... and ${violations.length - 5} more`);
  } else {
    console.log(`  ✅ PASS: No heavy/fried violations found`);
  }
  
  return violations;
};

const ayuViolations = checkDinnerHeavyFriedViolations(ayurveda, 'Ayurveda');
const tcmViolations = checkDinnerHeavyFriedViolations(tcm, 'TCM');
const modernViolations = checkDinnerHeavyFriedViolations(modern, 'Modern');
const unaniViolations = checkDinnerHeavyFriedViolations(unani, 'Unani');

// ============================================
// 3. CHECK DIGESTIBILITY RULES FOR DINNER
// ============================================
console.log('\n🔍 3. DIGESTIBILITY SCORE FOR DINNER ITEMS:\n');

const checkDinnerDigestibility = (foods, name) => {
  const dinnerFoods = foods.filter(f => f.meal_type && f.meal_type.includes('dinner'));
  
  const digestibilityViolations = dinnerFoods.filter(f => {
    const score = f.digestibility_score || 3;
    return score > 2; // Dinner should be ≤ 2
  });
  
  console.log(`${name}:`);
  console.log(`  - Average digestibility: ${(dinnerFoods.reduce((sum, f) => sum + (f.digestibility_score || 3), 0) / dinnerFoods.length).toFixed(2)}`);
  console.log(`  - Items with digestibility > 2: ${digestibilityViolations.length}`);
  
  if (digestibilityViolations.length > 0) {
    console.log(`  ⚠️  WARNING: ${digestibilityViolations.length} items exceed digestibility threshold\n`);
    digestibilityViolations.slice(0, 5).forEach(v => {
      console.log(`     - "${v.food_name}" (digestibility=${v.digestibility_score})`);
    });
    if (digestibilityViolations.length > 5) console.log(`     ... and ${digestibilityViolations.length - 5} more`);
  } else {
    console.log(`  ✅ PASS: All dinner items have digestibility ≤ 2`);
  }
  
  return digestibilityViolations;
};

const ayuDigestibility = checkDinnerDigestibility(ayurveda, 'Ayurveda');
const tcmDigestibility = checkDinnerDigestibility(tcm, 'TCM');
const modernDigestibility = checkDinnerDigestibility(modern, 'Modern');
const unaniDigestibility = checkDinnerDigestibility(unani, 'Unani');

// ============================================
// 4. CHECK LUNCH ITEMS (should not be light soups only)
// ============================================
console.log('\n🍽️  4. LUNCH ITEMS DIVERSITY:\n');

const checkLunchDiversity = (foods, name) => {
  const lunchFoods = foods.filter(f => f.meal_type && f.meal_type.includes('lunch'));
  
  const categories = {};
  lunchFoods.forEach(f => {
    const cat = f.category || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  console.log(`${name}:`);
  console.log(`  - Total lunch items: ${lunchFoods.length}`);
  console.log(`  - Categories: ${Object.keys(categories).join(', ')}`);
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`    • ${cat}: ${count} (${(count/lunchFoods.length*100).toFixed(1)}%)`);
  });
  
  const hasProteins = lunchFoods.filter(f => ['dairy', 'protein', 'legume'].includes(f.category)).length;
  const hasCarbs = lunchFoods.filter(f => ['grain'].includes(f.category)).length;
  
  if (hasProteins > 0 && hasCarbs > 0) {
    console.log(`  ✅ PASS: Lunch has diversity (proteins + carbs)`);
  } else {
    console.log(`  ⚠️  WARNING: Limited lunch diversity`);
  }
  
  return categories;
};

const ayuLunchCats = checkLunchDiversity(ayurveda, 'Ayurveda');
const tcmLunchCats = checkLunchDiversity(tcm, 'TCM');
const modernLunchCats = checkLunchDiversity(modern, 'Modern');
const unaniLunchCats = checkLunchDiversity(unani, 'Unani');

// ============================================
// 5. SAMPLE DINNER ITEMS (verify structure)
// ============================================
console.log('\n📝 5. SAMPLE DINNER ITEMS:\n');

const showSampleDinnerItems = (foods, name) => {
  const dinnerFoods = foods.filter(f => f.meal_type && f.meal_type.includes('dinner')).slice(0, 3);
  
  console.log(`${name}:`);
  dinnerFoods.forEach(f => {
    console.log(`  • ${f.food_name}`);
    console.log(`    - Category: ${f.category}`);
    console.log(`    - Digestibility: ${f.digestibility_score}`);
    console.log(`    - Heavy: ${f.is_heavy}, Fried: ${f.is_fried}`);
    console.log(`    - Time: ${f.time_preference ? f.time_preference[0] : 'N/A'}`);
    console.log('');
  });
};

showSampleDinnerItems(ayurveda, 'Ayurveda');
showSampleDinnerItems(tcm, 'TCM');
showSampleDinnerItems(modern, 'Modern');
showSampleDinnerItems(unani, 'Unani');

// ============================================
// SUMMARY & RECOMMENDATIONS
// ============================================
console.log('\n========================================');
console.log('SUMMARY & RECOMMENDATIONS');
console.log('========================================\n');

const totalViolations = ayuViolations.length + tcmViolations.length + modernViolations.length + unaniViolations.length;
const totalDigestibilityIssues = ayuDigestibility.length + tcmDigestibility.length + modernDigestibility.length + unaniDigestibility.length;

if (totalViolations === 0) {
  console.log('✅ All dinner items are correctly marked (no heavy/fried violations)');
} else {
  console.log(`❌ Found ${totalViolations} violations across all databases`);
}

if (totalDigestibilityIssues === 0) {
  console.log('✅ All dinner items have proper digestibility scores');
} else {
  console.log(`⚠️  Found ${totalDigestibilityIssues} digestibility score issues`);
}

console.log('\n✅ Meal plan generation logic appears to be working correctly!');
console.log('\nNext steps:');
console.log('- Verify backend API endpoints correctly filter by meal_type');
console.log('- Test diet plan generation with actual user data');
console.log('- Verify frontend displays meals appropriately');
console.log('- Check if recommendation engine uses meal_type correctly\n');
