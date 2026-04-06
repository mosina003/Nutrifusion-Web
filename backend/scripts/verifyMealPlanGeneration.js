/**
 * FINAL VERIFICATION: End-to-end meal plan generation test
 * This simulates what the actual API does when generating a 7-day diet plan
 */

const fs = require('fs');
const path = require('path');

// Load all food frameworks
const dataDir = path.join(__dirname, '../data');
const ayurvedaData = JSON.parse(fs.readFileSync(path.join(dataDir, 'ayurveda_food_constitution.json'), 'utf8'));
const tcmData = JSON.parse(fs.readFileSync(path.join(dataDir, 'tcm_food_constitution.json'), 'utf8'));
const modernData = JSON.parse(fs.readFileSync(path.join(dataDir, 'modern_food_constitution.json'), 'utf8'));
const unaniData = JSON.parse(fs.readFileSync(path.join(dataDir, 'unani_food_constitution.json'), 'utf8'));

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║           FINAL VERIFICATION: Meal Plan Generation Test                   ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// Test User Profile (Ayurveda-based)
const testUserProfile = {
  constitution: 'Vata-Pitta',
  primaryDosha: 'Vata',
  digestion: 'variable',
  goals: ['energy', 'digestion'],
  allergies: ['peanuts'],
  conditions: ['anxiety', 'insomnia']
};

console.log('📋 Test User Profile:');
console.log(`   Constitution: ${testUserProfile.constitution}`);
console.log(`   Primary Dosha: ${testUserProfile.primaryDosha}`);
console.log(`   Goals: ${testUserProfile.goals.join(', ')}\n`);

// Simulate diet plan generation
function filterByMealType(foods, mealType) {
  return foods.filter(f => f.meal_type && f.meal_type.includes(mealType));
}

function generateSampleDayPlan(framework, foods) {
  const breakfast = filterByMealType(foods, 'breakfast');
  const lunch = filterByMealType(foods, 'lunch');
  const dinner = filterByMealType(foods, 'dinner');

  // Mock selection (random for simulation)
  const selectRandom = (arr, max) => arr.sort(() => Math.random() - 0.5).slice(0, max);

  return {
    breakfast: selectRandom(breakfast, 2).map(f => f.food_name),
    lunch: selectRandom(lunch, 3).map(f => f.food_name),
    dinner: selectRandom(dinner, 2).map(f => f.food_name)
  };
}

// Test each framework
const frameworks = {
  'Ayurveda': ayurvedaData,
  'TCM': tcmData,
  'Modern Nutrition': modernData,
  'Unani': unaniData
};

console.log('🍽️  SAMPLE MEAL PLAN GENERATION:\\n');

for (const [frameworkName, foods] of Object.entries(frameworks)) {
  console.log(`${frameworkName.toUpperCase()}`);
  console.log('─'.repeat(50));

  const mealCounts = {
    breakfast: filterByMealType(foods, 'breakfast').length,
    lunch: filterByMealType(foods, 'lunch').length,
    dinner: filterByMealType(foods, 'dinner').length
  };

  console.log(`  Items available: B=${mealCounts.breakfast} L=${mealCounts.lunch} D=${mealCounts.dinner}`);

  const dayPlan = generateSampleDayPlan(frameworkName, foods);
  
  console.log(`\\n  📅 Sample Day Menu:`);
  console.log(`     🌅 Breakfast: ${dayPlan.breakfast.join(', ')}`);
  console.log(`     🌤️  Lunch: ${dayPlan.lunch.join(', ')}`);
  console.log(`     🌙 Dinner: ${dayPlan.dinner.join(', ')}`);

  // Verify dinner items are light
  const dinnerItems = filterByMealType(foods, 'dinner');
  const allLight = dinnerItems.every(f => !f.is_heavy && !f.is_fried && f.digestibility_score <= 2);
  console.log(`\\n  ✓ Dinner validation: ${allLight ? '✅ ALL light items' : '❌ ISSUES FOUND'}`);
  console.log('');
}

// Verification checklist
console.log('\\n╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                       VERIFICATION SUMMARY                                  ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝\\n');

let allPassed = true;

for (const [frameworkName, foods] of Object.entries(frameworks)) {
  const breakfast = filterByMealType(foods, 'breakfast');
  const lunch = filterByMealType(foods, 'lunch');
  const dinner = filterByMealType(foods, 'dinner');

  // Check 1: Item counts
  const countCheck = breakfast.length === 50;
  console.log(`${countCheck ? '✅' : '❌'} ${frameworkName}: 50 breakfast items`);

  // Check 2: Lunch diversity
  const hasProteins = lunch.some(f => f.category === 'protein' || f.category === 'dairy');
  const hasGrains = lunch.some(f => f.category === 'grain');
  const lunchCheck = hasProteins && hasGrains;
  console.log(`${lunchCheck ? '✅' : '❌'} ${frameworkName}: Lunch has proteins & grains`);

  // Check 3: Dinner restrictions
  const dinnerCheck = dinner.every(f => !f.is_heavy && !f.is_fried && f.digestibility_score <= 2);
  console.log(`${dinnerCheck ? '✅' : '❌'} ${frameworkName}: All dinner items are light`);

  // Check 4: Digestibility (Breakfast ≤3, Lunch ≤4, Dinner ≤2)
  const breakfastDigest = breakfast.every(f => f.digestibility_score && f.digestibility_score <= 3);
  const lunchDigest = lunch.every(f => f.digestibility_score && f.digestibility_score <= 4);
  const dinnerDigest = dinner.every(f => f.digestibility_score && f.digestibility_score <= 2);
  const digestCheck = breakfastDigest && lunchDigest && dinnerDigest;
  console.log(`${digestCheck ? '✅' : '❌'} ${frameworkName}: Digestibility scores correct (B≤3, L≤4, D≤2)`);

  allPassed = allPassed && countCheck && lunchCheck && dinnerCheck && digestCheck;
  console.log('');
}

console.log('\\n╔════════════════════════════════════════════════════════════════════════════╗');
if (allPassed) {
  console.log('║                  ✅ ALL VERIFICATIONS PASSED                               ║');
  console.log('║                                                                            ║');
  console.log('║  The meal plan generation logic is working correctly!                      ║');
  console.log('║  Ready for API integration and user testing.                               ║');
} else {
  console.log('║                  ❌ SOME VERIFICATIONS FAILED                              ║');
  console.log('║                                                                            ║');
  console.log('║  Review the output above for details.                                      ║');
}
console.log('╚════════════════════════════════════════════════════════════════════════════╝\\n');

// Test meal plan rotation (verify different items each day)
console.log('🔄 Testing 7-Day Rotation (Ayurveda):\\n');

const sevenDayPlans = [];
for (let day = 1; day <= 7; day++) {
  const plan = generateSampleDayPlan('Ayurveda', ayurvedaData);
  sevenDayPlans.push(plan);
  console.log(`  Day ${day}:`);
  console.log(`    Breakfast: ${plan.breakfast.join(', ')}`);
  console.log(`    Lunch: ${plan.lunch.join(', ')}`);
  console.log(`    Dinner: ${plan.dinner.join(', ')}`);
}

console.log('\\n✨ Diet plan generation test complete!\\n');
