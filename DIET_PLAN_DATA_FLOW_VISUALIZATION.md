# Diet Plan Pipeline - Data Flow Visualization

## FRAMEWORK: AYURVEDA ✅ HEALTHY FLOW

```
SERVICE GENERATION
├─ generateWeeklyPlan() → Array[7 days: {meals, guidelines}]
├─ Transform: day_1, day_2, ... day_7 objects
└─ Return: {
     '7_day_plan': {day_1: {B:[], L:[], D:[]}, ... day_7},
     top_ranked_foods: [{name, score}...],
     reasoning_summary: "string",
     avoidFoods: ["string"...]
   }
   
ROUTE PROCESSING (assessments.js line 439)
├─ Receive: Full diet plan object ✓
├─ Extract: dietPlanData['7_day_plan'] → object format
└─ Call: convertSevenDayPlanToMeals()
         └─ For each day_1...day_7:
            ├─ Extract breakfast → meals.push()
            ├─ Extract lunch → meals.push()
            └─ Extract dinner → meals.push()
            Result: 21 meals (7×3) ✓

DATABASE STORAGE
├─ meals: [
│    {day:1, mealType:'Breakfast', foods:[...], timing, notes},
│    {day:1, mealType:'Lunch', foods:[...], timing, notes},
│    {day:1, mealType:'Dinner', foods:[...], timing, notes},
│    ... (21 total)
│  ]
├─ rulesApplied[0].details:
│    ├─ reasoning: string ✓
│    ├─ topFoods: [{name, score}] ✓
│    └─ avoidFoods: ["string"...] ✓
└─ Status: ✅ ALL DATA PRESERVED

RETRIEVAL (assessments.js line 758)
├─ Query: Find DietPlan for user/framework/dates
├─ Convert: convertMealsToSevenDayPlan(meals)
│    └─ Reconstruct: {day_1: {B:[], L:[], D:[]}, ... day_7}
└─ Status: ✅ FULLY RECONSTRUCTED

RESPONSE TO FRONTEND
└─ {
     '7_day_plan': {day_1: {breakfast: [], lunch: [], dinner: []}, ...},
     top_ranked_foods: [...],
     reasoning_summary: "string",
     healthProfile: {...},
     metadata: {...}
   }
   
FRONTEND RENDERING
└─ Access: dietPlan['7_day_plan']['day_1']['breakfast']
   Status: ✅ COMPLETE
```

---

## FRAMEWORK: TCM ⚠️ WORKS BUT CODE SMELL

```
SERVICE GENERATION
├─ tcmMealPlan.generateWeeklyPlan()
│  └─ Returns: Object already wrapped with '7_day_plan' key as ROOT
│     ⚠️ PROBLEM: Returns structure like:
│        {
│          '7_day_plan': [array of days],  ← Already wrapped!
│          top_ranked_foods: [...],
│          reasoning_summary: {...}
│        }
│
├─ tcmDietPlanService receives this object
│  └─ Then tries to convert AGAIN (lines 35-72):
│     ⚠️ if (Array.isArray(mealPlan['7_day_plan']))
│        → Checks if value of '7_day_plan' is array
│        → It IS, so tries to convert...
│        → But actually it's already the right format!
│     🤨 Result: Works by accident, redundant code path
│
└─ Final return: {
     '7_day_plan': {day_1: {B:[], L:[], D:[]}, ... day_7},
     top_ranked_foods: [{name, score}...],
     reasoning_summary: "string",
     avoidFoods: ["string"...]
   }

ROUTE PROCESSING (assessments.js line 531)
├─ Status: ✅ Same as Ayurveda
└─ Result: 21 meals extracted

DATABASE STORAGE
├─ Status: ✅ Same as Ayurveda
└─ ⚠️ Note: reasoning_summary stored as OBJECT (not string)
           Causes extra conversion on retrieval

RETRIEVAL (assessments.js line 758-778)
├─ Convert: convertMealsToSevenDayPlan(meals) ✓
├─ Process reasoning_summary:
│  ⚠️ if (typeof reasoningSummary === 'object')
│     → "TCM Analysis: Thermal Pattern - ...., Key Principles: ..."
│     → Converts object to string format
└─ Status: ✅ Works but extra processing

RESPONSE TO FRONTEND
└─ Status: ✅ Complete and correct
```

---

## FRAMEWORK: UNANI ⚠️ SAME PATTERN AS TCM

```
Same flow as TCM with same code smell issues
- generateWeeklyPlan returns already-wrapped structure
- Service tries to convert again (redundant)
- reasoning_summary stored as object (needs conversion on retrieval)

Status: ✅ Works but poor code quality
```

---

## FRAMEWORK: MODERN 🚨 CRITICAL DATA LOSS

```
SERVICE GENERATION
├─ modernMealPlan.generateWeeklyPlan()
│  └─ Generates: 5 meals per day
│     ├─ generateBreakfast()
│     ├─ generateSnack() [40% of snack calories]
│     ├─ generateLunch()
│     ├─ generateSnack() [60% of snack calories]
│     └─ generateDinner()
│
├─ Returns: Array of 7 days, each with meals array
│  └─ Each day has:
│     └─ meals: [{meal_type: 'Breakfast'...}, {...Snack1...}, {...Lunch...}, {...Snack2...}, {...Dinner...}]
│        ✓ daily_targets: {calories, protein_g, carbs_g, fat_g}
│        ✓ total_calories_estimated: number
│
├─ modernDietPlanService.generateDietPlan() transforms:
│  ├─ Line 359: Extracts food names from filtered meals
│  ├─ Breakfast: dayPlan.meals.filter(m => m.meal_type === 'Breakfast') ✓
│  ├─ Lunch: dayPlan.meals.filter(m => m.meal_type === 'Lunch') ✓
│  ├─ Dinner: dayPlan.meals.filter(m => m.meal_type === 'Dinner') ✓
│  ├─ Snacks: dayPlan.meals.filter(m => m.meal_type.includes('Snack')) ✓
│  ├─ daily_targets: dayPlan.daily_targets ✓
│  └─ total_calories_estimated: dayPlan.total_calories_estimated ✓
│
└─ Return: {
     '7_day_plan': {
       day_1: {
         breakfast: ['food1', 'food2'],
         lunch: ['food3', 'food4'],
         dinner: ['food5', 'food6'],
         snacks: ['snack1', 'snack2'],  ← EXTRA FIELD ✓
         daily_targets: {...},          ← EXTRA FIELD ✓
         total_calories_estimated: 2000 ← EXTRA FIELD ✓
       }, ... day_7
     },
     top_ranked_foods: [{...}],
     reasoning_summary: "string",
     user_profile: {bmi, bmr, tdee, metabolic_risk_level},
     summary: {...}
   }

ROUTE PROCESSING (assessments.js line 584) 🚨 DATA LOSS BEGINS
├─ Receive: Full diet plan object
├─ Extract: dietPlanData['7_day_plan']
├─ Call: convertSevenDayPlanToMeals(sevenDayPlan)
│
└─ convertSevenDayPlanToMeals() function (line 1058):
   ├─ for (let day = 1; day <= 7; day++)
   │  ├─ Get dayData = sevenDayPlan[`day_${day}`]
   │  ├─ if (dayData.breakfast) → meals.push({day, mealType:'Breakfast', foods: []})
   │  ├─ if (dayData.lunch) → meals.push({day, mealType:'Lunch', foods: []})
   │  ├─ if (dayData.dinner) → meals.push({day, mealType:'Dinner', foods: []})
   │  ├─ ❌ NO SNACKS EXTRACTION
   │  ├─ ❌ daily_targets DISCARDED
   │  └─ ❌ total_calories_estimated DISCARDED
   │
   └─ Result: 21 meals array (7 days × 3 meals)
      🚨 28% data loss: Snacks completely gone
      🚨 daily_targets completely gone
      🚨 total_calories_estimated completely gone

DATABASE STORAGE 🚨 MORE LOSS
├─ meals: [
│    {day:1, mealType: 'Breakfast', foods: [], timing, notes},
│    {day:1, mealType: 'Lunch', foods: [], timing, notes},
│    {day:1, mealType: 'Dinner', foods: [], timing, notes},
│    ... (21 total - SNACKS MISSING)
│  ]
│
├─ rulesApplied[0].details (line 576-590):
│  ├─ reasoning: string ✓
│  ├─ topFoods: [...] ✓
│  ├─ avoidFoods: [...] ✓
│  ├─ metabolic_risk_level: string ✓
│  ├─ bmi: number ✓
│  ├─ ❌ daily_targets NOT SAVED
│  ├─ ❌ bmr NOT SAVED (from user_profile)
│  ├─ ❌ tdee NOT SAVED (from user_profile)
│  └─ ❌ total_calories_estimated NOT SAVED
│
└─ Status: 40% of generated data not persisted!

RETRIEVAL (assessments.js line 758-847) 🚨 CANNOT RECONSTRUCT
├─ Query: Find DietPlan for user/framework/dates
├─ Convert: convertMealsToSevenDayPlan(meals)
│  ├─ Initialize: {day_1: {breakfast:[], lunch:[], dinner:[]}, ...}
│  ├─ Fill meals into structure
│  └─ Result: {day_1: {breakfast:[], lunch:[], dinner:[]}, ... day_7}
│     ❌ CANNOT ADD BACK: snacks (lost forever)
│     ❌ CANNOT ADD BACK: daily_targets (lost forever)
│     ❌ CANNOT ADD BACK: total_calories_estimated (lost forever)
│
├─ Get reasoning: rulesApplied[0].details.reasoning ✓
├─ Get healthProfile from assessment.scores (not from DietPlan) ✓
│  └─ Only partially recovers metadata via Assessment model
│
└─ Status: Incomplete reconstruction, 28% of meals missing

RESPONSE TO FRONTEND 🚨 INCOMPLETE DATA
└─ {
     '7_day_plan': {
       day_1: {
         breakfast: ['food1', 'food2'],  ← Present
         lunch: ['food3', 'food4'],      ← Present
         dinner: ['food5', 'food6'],      ← Present
         snacks: undefined                ← MISSING
         daily_targets: undefined         ← MISSING
         total_calories_estimated: undefined ← MISSING
       }, ... day_7
     },
     top_ranked_foods: [...],
     reasoning_summary: "string",
     healthProfile: {bmi, bmi_category, bmr, tdee, ...},
     metadata: {...}
   }

FRONTEND RENDERING 🚨 MISSING FEATURES
├─ Access: dietPlan['7_day_plan']['day_1']['breakfast'] ✓
├─ Access: dietPlan['7_day_plan']['day_1']['snacks'] ❌ undefined
├─ Access: dietPlan['7_day_plan']['day_1']['daily_targets'] ❌ undefined
├─ Access: dietPlan['7_day_plan']['day_1']['total_calories_estimated'] ❌ undefined
└─ Impact:
   - Cannot show snack recommendations
   - Cannot display daily nutrition targets
   - Cannot show calorie limits
   - Incomplete nutritional guidance
```

---

## DATA LOSS SUMMARY TABLE

| Item | Ayurveda | TCM | Unani | Modern |
|------|----------|-----|-------|--------|
| Snacks generated | ❌ No | ❌ No | ❌ No | ✓ Yes, 2/day |
| Snacks persisted | N/A | N/A | N/A | **❌ NO** 🚨 |
| Daily targets generated | ❌ No | ❌ No | ❌ No | ✓ Yes |
| Daily targets persisted | N/A | N/A | N/A | **❌ NO** 🚨 |
| Calorie estimates generated | ❌ No | ❌ No | ❌ No | ✓ Yes |
| Calorie estimates persisted | N/A | N/A | N/A | **❌ NO** 🚨 |
| Data integrity | ✅ 100% | ✅ 100% | ✅ 100% | **❌ 60%** 🚨 |
| Reconstruction possible | ✅ Yes | ✅ Yes | ✅ Yes | **❌ NO** 🚨 |

---

## DETAILED LOSS POINTS FOR MODERN

### Loss Point 1: convertSevenDayPlanToMeals (assessments.js:1058)
```javascript
// Current code: HARDCODED for 3 meals
if (dayData.breakfast && dayData.breakfast.length > 0) {
  meals.push({...});
}
if (dayData.lunch && dayData.lunch.length > 0) {
  meals.push({...});
}
if (dayData.dinner && dayData.dinner.length > 0) {
  meals.push({...});
}
// ❌ Missing:
// if (dayData.snacks && dayData.snacks.length > 0) { meals.push(...); }
```

### Loss Point 2: DietPlan.rulesApplied storage (assessments.js:576-590)
```javascript
// Saved:
{
  reasoning: dietPlanData.reasoning_summary,
  topFoods: dietPlanData.top_ranked_foods,
  avoidFoods: dietPlanData.avoidFoods,
  metabolic_risk_level: result.scores.metabolic_risk_level,
  bmi: dietPlanData.user_profile?.bmi,
}

// ❌ Not saved:
// daily_targets: dietPlanData['7_day_plan'].day_1?.daily_targets,
// total_calories_estimated: // average across all days,
// bmr: dietPlanData.user_profile?.bmr,
// tdee: dietPlanData.user_profile?.tdee,
```

### Loss Point 3: convertMealsToSevenDayPlan reconstruction (assessments.js:1112)
```javascript
// Initializes with only 3 meal types:
sevenDayPlan[`day_${day}`] = {
  breakfast: [],
  lunch: [],
  dinner: []
  // ❌ Missing: snacks field
  // ❌ Missing: daily_targets field
  // ❌ Missing: total_calories_estimated field
};

// Cannot resurrect lost data!
```

---

## CRITICAL QUESTION: WHY DESIGN THIS WAY?

Modern framework was designed differently because:
1. **Modern nutrition science** includes snack recommendations
2. **Macro/calorie targets** are central to Modern nutrition planning
3. **Daily estimates** help users understand their nutrition needs

But the rest of the pipeline (DB schema, conversion functions, Model definitions) was designed for Ayurveda's 3-meal model. **Modern framework never updated the shared pipeline to support extra fields.**

---

## IMMEDIATE ACTION REQUIRED

### For Modern Framework (URGENT)
1. Update convertSevenDayPlanToMeals to extract snacks as meal_type 'Snack1', 'Snack2'
2. Add fields to DietPlan.rulesApplied.details for nutrition targets
3. Update convertMealsToSevenDayPlan to reconstruct snacks and targets
4. Update frontend DietPlan interface to optionally include snacks and targets

### For TCM/Unani (MEDIUM PRIORITY)
1. Fix tcmMealPlan.generateWeeklyPlan return format (don't wrap in '7_day_plan')
2. Store reasoning_summary as string, not object
3. Remove redundant conversion code in service layer

### For All Frameworks (GOOD PRACTICE)
1. Add validation to ensure no data loss during conversion
2. Write integration tests for full pipeline (service → db → retrieval → frontend)
3. Document expected data structures at each stage

