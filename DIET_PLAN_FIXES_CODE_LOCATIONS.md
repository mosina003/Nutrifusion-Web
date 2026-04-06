# Diet Plan Audit - CODE LOCATIONS & FIXES REFERENCE

## ISSUE LOCATOR & FIX GUIDE

---

## 🚨 MODERN FRAMEWORK - CRITICAL ISSUES

### Issue #1: Snacks Not Extracted from 7_day_plan During Conversion

**Location**: `backend/routes/assessments.js` - Lines 1058-1104

**Function**: `convertSevenDayPlanToMeals(sevenDayPlan)`

**Current Code** (INCOMPLETE):
```javascript
// Line 1058-1104
function convertSevenDayPlanToMeals(sevenDayPlan) {
  const meals = [];
  
  for (let day = 1; day <= 7; day++) {
    const dayKey = `day_${day}`;
    const dayData = sevenDayPlan[dayKey];
    
    // ✓ Extracts breakfast
    if (dayData.breakfast && dayData.breakfast.length > 0) {
      meals.push({
        day: day,
        mealType: 'Breakfast',
        foods: dayData.breakfast,
        timing: '7:00 AM - 8:00 AM',
        notes: 'Light, easy to digest'
      });
    }

    // ✓ Extracts lunch
    if (dayData.lunch && dayData.lunch.length > 0) {
      meals.push({...});
    }

    // ✓ Extracts dinner
    if (dayData.dinner && dayData.dinner.length > 0) {
      meals.push({...});
    }
    
    // ❌ MISSING: SNACKS EXTRACTION
    // Modern includes snacks in sevenDayPlan[dayKey].snacks
    // But they're never extracted to meals array!
    // Result: Snacks completely lost when stored to DB
  }
  
  return meals;
}
```

**FIX Required**:
```javascript
// Add after dinner extraction, before closing day loop:
// ❌ SNACKS EXTRACTION
if (dayData.snacks && dayData.snacks.length > 0) {
  meals.push({
    day: day,
    mealType: 'Snack',
    foods: dayData.snacks,
    timing: '10:00 AM - 10:30 AM, 3:00 PM - 3:30 PM',
    notes: 'Light snack'
  });
}
```

**Impact**: Without this, 14 snacks per week are lost (28.5% of meals when 5 meals/day planned)

---

### Issue #2: Daily Targets & Calorie Estimates Not Saved to DietPlan.rulesApplied

**Location**: `backend/routes/assessments.js` - Lines 576-590

**Function**: Assessment submission logic for Modern framework

**Current Code** (INCOMPLETE):
```javascript
// Line 584: Modern diet plan generation
const dietPlan = new DietPlan({
  userId,
  planName: `Modern Auto-Generated Plan`,
  planType: 'modern',
  meals: meals,
  rulesApplied: [{
    framework: 'modern',
    details: {
      reasoning: dietPlanData.reasoning_summary || 'Auto-generated from assessment',
      topFoods: dietPlanData.top_ranked_foods || [],
      avoidFoods: dietPlanData.avoidFoods || [],
      metabolic_risk_level: result.scores.metabolic_risk_level,
      bmi: dietPlanData.user_profile?.bmi,
      // ❌ MISSING: daily_targets
      // ❌ MISSING: total_calories_estimated
      // ❌ MISSING: bmr (from user_profile)
      // ❌ MISSING: tdee (from user_profile)
      sourceAssessmentId: assessment._id
    }
  }],
  // ... rest of DietPlan fields
});
```

**FIX Required**:
```javascript
// Before sourceAssessmentId, add:
daily_targets: dietPlanData['7_day_plan']?.day_1?.daily_targets, // Average or day 1 as reference
average_daily_calories: calculateAverageDailyCalories(dietPlanData['7_day_plan']),
bmr: dietPlanData.user_profile?.bmr,
tdee: dietPlanData.user_profile?.tdee,

// Helper function to add:
const calculateAverageDailyCalories = (sevenDayPlan) => {
  let total = 0;
  for (let i = 1; i <= 7; i++) {
    total += sevenDayPlan[`day_${i}`]?.total_calories_estimated || 0;
  }
  return Math.round(total / 7);
};
```

**Impact**: Macro targets and calorie estimates completely unavailable in persisted plan

---

### Issue #3: Snacks Not Reconstructed in convertMealsToSevenDayPlan

**Location**: `backend/routes/assessments.js` - Lines 1112-1164

**Function**: `convertMealsToSevenDayPlan(meals)`

**Current Code** (INCOMPLETE):
```javascript
// Line 1112-1164
function convertMealsToSevenDayPlan(meals) {
  const sevenDayPlan = {};
  
  // Initialize all 7 days
  for (let day = 1; day <= 7; day++) {
    sevenDayPlan[`day_${day}`] = {
      breakfast: [],
      lunch: [],
      dinner: []
      // ❌ MISSING: snacks: []
      // ❌ MISSING: daily_targets: {}
      // ❌ MISSING: total_calories_estimated: 0
    };
  }

  // Fill in meals
  meals.forEach(meal => {
    const dayKey = `day_${meal.day}`;
    const mealType = meal.mealType.toLowerCase();
    
    if (sevenDayPlan[dayKey] && meal.foods) {
      sevenDayPlan[dayKey][mealType] = meal.foods;
      // ❌ When mealType='Snack', this tries to assign to lowercase 'snack'
      // But we initialized only breakfast, lunch, dinner!
      // Result: Snacks still lost
    }
  });

  // ... validation code ...
  
  return sevenDayPlan;
}
```

**FIX Required**:
```javascript
// In initialization loop (line 1124), modify:
for (let day = 1; day <= 7; day++) {
  sevenDayPlan[`day_${day}`] = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],  // ✅ ADD THIS
    daily_targets: {},  // ✅ ADD THIS (retrieve from somewhere)
    total_calories_estimated: 0  // ✅ ADD THIS (retrieve from somewhere)
  };
}

// NOTE: Cannot resurrect daily_targets and total_calories_estimated
// from meals array alone - THEY MUST BE SAVED to rulesApplied (Issue #2)
// So reconstruct from DB after retrieval:
// Line 758, after convertMealsToSevenDayPlan:
const nutritionData = dietPlan.rulesApplied[0]?.details || {};
if (nutritionData.daily_targets) {
  for (let day = 1; day <= 7; day++) {
    sevenDayPlan[`day_${day}`].daily_targets = nutritionData.daily_targets;
  }
}
if (nutritionData.average_daily_calories) {
  for (let day = 1; day <= 7; day++) {
    sevenDayPlan[`day_${day}`].total_calories_estimated = 
      nutritionData.average_daily_calories;
  }
}
```

**Impact**: Snacks cannot be reconstructed, daily targets cannot be added back

---

### Issue #4: Modern avoidFoods Format Inconsistent with Others

**Location**: `backend/services/intelligence/diet/modernDietPlanService.js` - Line 408

**Current Code**:
```javascript
// Line 408
avoidFoods: categorizedFoods.avoid.slice(0, 15).map(f => ({
  food_name: f.food.name,
  score: f.score
})),
```

**Compare to Ayurveda** (line 206):
```javascript
avoidFoods: avoidFoodsList,  // Array of strings
```

**FIX Required** (to match Ayurveda/TCM/Unani):
```javascript
// Change line 408 to:
avoidFoods: categorizedFoods.avoid.slice(0, 15).map(f => f.food.name),
```

**Impact**: Minor - Frontend handles both, but inconsistent across frameworks

---

## ⚠️ TCM FRAMEWORK - CODE QUALITY ISSUES

### Issue #5: tcmMealPlan.generateWeeklyPlan Returns Already-Wrapped Structure

**Location**: `backend/services/intelligence/diet/tcmMealPlan.js` - Lines 550-623

**Current Code** (INCONSISTENT):
```javascript
// Line 550: tcmMealPlan.generateWeeklyPlan returns:
const generateWeeklyPlan = (rankedFoods, userAssessment) => {
  // ... code ...
  const weeklyPlan = [];
  for (let day = 1; day <= 7; day++) {
    // Create dayPlan
    weeklyPlan.push(dayPlan);
  }

  return {  // ❌ Returns WRAPPED structure
    '7_day_plan': weeklyPlan,  // ❌ Should just return weeklyPlan
    top_ranked_foods: rankedFoods.top_ranked_foods || [],
    reasoning_summary: {...}
  };
};
```

**Used by** `tcmDietPlanService` (line 39):
```javascript
// Line 39
const mealPlan = tcmMealPlan.generateWeeklyPlan(rankedFoods, userAssessment);

// Then lines 35-72: Tries to convert AGAIN
console.log('🔍 Is array?', Array.isArray(mealPlan['7_day_plan']));
if (Array.isArray(mealPlan['7_day_plan'])) {
  // Creates sevenDayPlanObject and rebuilds...
  // ❌ REDUNDANT - Already done!
}
```

**FIX Required**:
```javascript
// Option 1: Change tcmMealPlan to return wrapped structure like Ayurveda does
// Option 2: Change tcmDietPlanService to not expect wrapped structure
// BEST: Make tcmMealPlan.generateWeeklyPlan return ONLY array (line 623):

const generateWeeklyPlan = (rankedFoods, userAssessment) => {
  const weeklyPlan = [];
  for (let day = 1; day <= 7; day++) {
    // ... create dayPlan ...
    weeklyPlan.push(dayPlan);
  }
  return weeklyPlan;  // ✅ Just return array
};

// Then in tcmDietPlanService, fix lines 39-72:
const weeklyPlanArray = tcmMealPlan.generateWeeklyPlan(rankedFoods, userAssessment);

// Convert to object like Ayurveda does
const sevenDayPlanObject = {};
weeklyPlanArray.forEach((dayPlan, index) => {
  const dayNum = index + 1;
  // ... extract breakfast, lunch, dinner ...
  sevenDayPlanObject[`day_${dayNum}`] = {
    breakfast: [...],
    lunch: [...],
    dinner: [...]
  };
});

return {
  '7_day_plan': sevenDayPlanObject,
  top_ranked_foods: rankedFoods.top_ranked_foods || [],
  reasoning_summary: reasoningSummary
};
```

**Impact**: Code smell, redundant logic path, maintenance burden

---

### Issue #6: TCM reasoning_summary Stored as Object Instead of String

**Location**: `backend/services/intelligence/diet/tcmMealPlan.js` - Line 603

**Current Code**:
```javascript
// Line 603: Returns object, not string
reasoning_summary: {
  thermal_pattern: userAssessment.thermal_tendency || 'Neutral',
  digestive_strength: userAssessment.digestive_strength || 'Moderate',
  key_principles: [...]
}
```

**Used In Assessment Submission** (assessments.js:531):
```javascript
// Saved as object, but should be string
rulesApplied: [{
  details: {
    reasoning: dietPlanData.reasoning_summary || 'Auto-generated from assessment',
    // ❌ reasoning is object, not string!
  }
}]
```

**Retrieved & Converted** (assessments.js:769-778):
```javascript
// Has to convert from object to string
if (typeof reasoningSummary === 'object' && reasoningSummary !== null) {
  if (reasoningSummary.thermal_pattern || reasoningSummary.secondary_mizaj) {
    // TCM format
    reasoningSummary = `TCM Analysis: Thermal Pattern - ${reasoningSummary.thermal_pattern || 'Unknown'}...`;
  }
}
```

**FIX Required** (convert to string immediately in tcmMealPlan):
```javascript
// Line 603, change to:
reasoning_summary: `TCM Analysis: Thermal Pattern - ${userAssessment.thermal_tendency || 'Neutral'}, Digestive Strength - ${userAssessment.digestive_strength || 'Moderate'}. Key Principles: ${[...key_principles...].join(', ')}`
```

**Impact**: Extra processing during retrieval, inconsistency with other frameworks

---

## 🟢 AYURVEDA FRAMEWORK - NO ISSUES

**All code flows correctly, no changes needed.**

---

## 📋 FIX PRIORITY ORDER

### Priority 1: URGENT (Production Impact)
1. **Issue #1**: Add snacks extraction to convertSevenDayPlanToMeals
   - Prevents data loss on DB save
   - ~15 minutes to fix

2. **Issue #2**: Save daily_targets and calorie data to rulesApplied
   - Prevents data loss on DB save
   - ~20 minutes to fix

3. **Issue #3**: Reconstruct snacks/targets in convertMealsToSevenDayPlan
   - Ensures data recovery on retrieval
   - ~25 minutes to fix

### Priority 2: HIGH (Frontend Impact)
4. **Issue #4**: Standardize avoidFoods format
   - Small change, improves consistency
   - ~5 minutes to fix

### Priority 3: MEDIUM (Code Quality)
5. **Issue #5**: Fix TCM redundant conversion
   - Reduces confusing code paths
   - ~30 minutes to fix

6. **Issue #6**: Convert TCM reasoning to string
   - Simplifies retrieval logic
   - ~15 minutes to fix

---

## TESTING RECOMMENDATIONS

After fixes, validate with:

```javascript
// Test 1: Modern plan generation preserves snacks
GET /api/assessments/diet-plan/current
// Verify: dietPlan['7_day_plan']['day_1']['snacks'].length > 0

// Test 2: Daily targets persisted
// Check DietPlan.rulesApplied[0].details.daily_targets exists

// Test 3: Calorie estimates persisted
// Check DietPlan.rulesApplied[0].details.average_daily_calories exists

// Test 4: TCM reasoning is string
// Verify: typeof dietPlan.rulesApplied[0].details.reasoning === 'string'

// Test 5: All avoidFoods are strings
// Verify: dietPlan.avoidFoods.every(f => typeof f === 'string')
```

---

## FILES TO MODIFY

1. `backend/routes/assessments.js`
   - Line 1058-1104: convertSevenDayPlanToMeals - add snacks extraction
   - Line 576-590: Modern DietPlan save - add daily_targets fields
   - Line 1112-1164: convertMealsToSevenDayPlan - initialize snacks field
   - Line 758: Add nutrition data reconstruction after conversion

2. `backend/services/intelligence/diet/tcmMealPlan.js`
   - Line 603: Convert reasoning_summary to string
   - Line 550-623: Fix generateWeeklyPlan return structure

3. `backend/services/intelligence/diet/tcmDietPlanService.js`
   - Lines 35-72: Simplify/remove redundant conversion

4. `backend/services/intelligence/diet/modernDietPlanService.js`
   - Line 408: Standardize avoidFoods to Array<string>

---

## ESTIMATED EFFORT

- **Total Fix Time**: ~1.5 hours
- **Testing Time**: ~30 minutes
- **Documentation**: ~30 minutes
- **Total**: ~2.5 hours for complete remediation
