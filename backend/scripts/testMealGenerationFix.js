/**
 * Test meal generation fixes for proper meal_type filtering
 */

const mealPlanService = require('../services/intelligence/diet/ayurvedaDietPlanService');
const modernPlanService = require('../services/intelligence/diet/modernDietPlanService');

const test = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          🔍 TESTING MEAL GENERATION FIXES                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Test Ayurveda meal plan generation
    console.log('📋 TEST 1: Testing Ayurveda meal generation...\n');

    const ayurvedaAssessment = {
      prakriti: { vata: 35, pitta: 40, kapha: 25 },
      vikriti: { vata: 55, pitta: 25, kapha: 20 },
      agni: 'Moderate',
      dominant_dosha: 'pitta',
      severity: 2
    };

    const ayurvPlan = await mealPlanService.generateMealPlan(
      { user_assessment: ayurvedaAssessment },
      'ayurveda'
    );

    console.log('✅ Generated Ayurveda meal plan\n');

    // Validate meal distribution
    let validBreakfasts = 0;
    let validLunches = 0;
    let validDinners = 0;
    let failedDinners = 0;
    let failedLunches = 0;

    ayurvPlan.days.forEach((day, idx) => {
      const dayNum = idx + 1;
      const bfast = day.meals.find(m => m.meal_type === 'Breakfast');
      const lunch = day.meals.find(m => m.meal_type === 'Lunch');
      const dinner = day.meals.find(m => m.meal_type === 'Dinner');

      if (bfast && bfast.foods.length > 0 && bfast.foods.length <= 3) {
        validBreakfasts++;
      }

      if (lunch && lunch.foods.length === 3) {
        validLunches++;
      } else if (lunch && lunch.foods.length !== 3) {
        failedLunches++;
        console.warn(`  ⚠️ Day ${dayNum}: Lunch has ${lunch.foods.length} items (expected 3)`);
      }

      if (dinner && dinner.foods.length > 0 && dinner.foods.length <= 2) {
        validDinners++;
      } else if (dinner && dinner.foods.length === 0) {
        failedDinners++;
        console.warn(`  ⚠️ Day ${dayNum}: Dinner is EMPTY`);
      }
    });

    console.log(`\n📊 Ayurveda Validation Results:`);
    console.log(`  ✓ Valid breakfasts: ${validBreakfasts}/7 (need ≥6)`);
    console.log(`  ✓ Valid lunches: ${validLunches}/7 (need 7, got ${failedLunches} failures)`);
    console.log(`  ✓ Valid dinners: ${validDinners}/7 (need ≥6, got ${failedDinners} empty)`);

    if (failedDinners === 0 && failedLunches === 0) {
      console.log('\n  🎉 ALL AYURVEDA TESTS PASSED!\n');
    } else {
      console.log('\n  ❌ AYURVEDA TESTS FAILED\n');
    }

    // Test Modern meal plan generation
    console.log('📋 TEST 2: Testing Modern meal generation...\n');

    const modernAssessment = {
      age: 35,
      gender: 'female',
      weight_kg: 65,
      height_cm: 165,
      activity_level: 'moderate',
      health_conditions: [],
      metabolic_risk: 'normal',
      health_goals: ['weight_management']
    };

    const modernPlan = await modernPlanService.generateMealPlan(
      { clinical_profile: modernAssessment },
      'modern'
    );

    console.log('✅ Generated Modern meal plan\n');

    validBreakfasts = 0;
    validLunches = 0;
    validDinners = 0;
    failedDinners = 0;
    failedLunches = 0;

    modernPlan.days.forEach((day, idx) => {
      const dayNum = idx + 1;
      const bfast = day.meals.find(m => m.meal_type === 'Breakfast');
      const lunch = day.meals.find(m => m.meal_type === 'Lunch');
      const dinner = day.meals.find(m => m.meal_type === 'Dinner');

      if (bfast && bfast.foods.length > 0) {
        validBreakfasts++;
      }

      if (lunch && lunch.foods.length > 0) {
        validLunches++;
      } else if (lunch && lunch.foods.length === 0) {
        failedLunches++;
      }

      if (dinner && dinner.foods.length > 0) {
        validDinners++;
      } else if (dinner && dinner.foods.length === 0) {
        failedDinners++;
        console.warn(`  ⚠️ Day ${dayNum}: Dinner is EMPTY`);
      }
    });

    console.log(`\n📊 Modern Validation Results:`);
    console.log(`  ✓ Valid breakfasts: ${validBreakfasts}/7 (need ≥6)`);
    console.log(`  ✓ Valid lunches: ${validLunches}/7 (need ≥6)`);
    console.log(`  ✓ Valid dinners: ${validDinners}/7 (need ≥6)`);

    if (failedDinners === 0 && failedLunches === 0) {
      console.log('\n  🎉 ALL MODERN TESTS PASSED!\n');
    } else {
      console.log('\n  ❌ MODERN TESTS FAILED\n');
    }

    // Summary
    console.log('╔════════════════════════════════════════════════════════════════╗');
    if (failedDinners === 0 && failedLunches === 0) {
      console.log('║          ✅ ALL MEAL GENERATION FIXES VERIFIED! ✅            ║');
    } else {
      console.log('║          ❌ ISSUES STILL DETECTED - DEBUGGING NEEDED ❌        ║');
    }
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error);
  }
};

test();
