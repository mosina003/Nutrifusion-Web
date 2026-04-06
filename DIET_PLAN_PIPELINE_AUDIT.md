# COMPLETE SYSTEMATIC AUDIT: Diet Plan Pipeline for All 4 Frameworks

**Date**: April 7, 2026  
**Scope**: Full pipeline trace from service generation → database storage → retrieval → frontend display  
**Frameworks**: Ayurveda, TCM, Unani, Modern

---

## COMPREHENSIVE COMPARISON TABLE

| Aspect | Ayurveda | TCM | Unani | Modern |
|--------|----------|-----|-------|--------|
| **SERVICE GENERATION** |
| Service file | ayurvedaDietPlanService.js | tcmDietPlanService.js | unaniDietPlanService.js | modernDietPlanService.js |
| generateWeeklyPlan() returns | Array of 7 dayPlan objects | Object with '7_day_plan' key already | Array of 7 dayPlan objects | Array of 7 dayPlan objects + metadata |
| Generated meals per day | 3 (B/L/D) | 3 (B/L/D) | 3 (B/L/D) | 5 (B/Snack/L/Snack/D) |
| **7_day_plan structure returned** | Object with day_1...day_7 | Object with day_1...day_7 | Object with day_1...day_7 | Object with day_1...day_7 + EXTRAS |
| breakfast field | `string[]` | `string[]` | `string[]` | `string[]` ✓ |
| lunch field | `string[]` | `string[]` | `string[]` | `string[]` ✓ |
| dinner field | `string[]` | `string[]` | `string[]` | `string[]` ✓ |
| **snacks field** | ❌ Not generated | ❌ Not generated | ❌ Not generated | ✓ `string[]` ⚠️ EXTRA |
| **daily_targets field** | ❌ Not generated | ❌ Not generated | ❌ Not generated | ✓ `{calories, protein_g, carbs_g, fat_g}` ⚠️ EXTRA |
| **total_calories_estimated field** | ❌ Not generated | ❌ Not generated | ❌ Not generated | ✓ `number` ⚠️ EXTRA |
| top_ranked_foods format | `Array<{food_name, score}>` | `Array<{food_name, score}>` | `Array<{food_name, score}>` | `Array<{food_name, score}>` ✓ |
| reasoning_summary type | `string` | `string` | `string` | `string` ✓ |
| reasoning_summary populated | ✓ Via generateReasoning() | ✓ Via template/AI | ✓ Via template | ✓ Via _generateReasoning() with AI/template |
| avoidFoods format | `Array<string>` | `Array<string>` | `Array<string>` | `Array<{food_name, score}>` ⚠️ DIFFERENT |
| user_profile returned | ✗ Not included | ✗ Not included | ✗ Not included | ✓ `{bmi, bmr, tdee, metabolic_risk_level}` |
| Extra fields in return | None | None | None | ✓ summary, user_profile |
| **ROUTE PROCESSING (dietPlans.js → assessments.js)** |
| Calls service via | assessments.js:439 | assessments.js:531 | assessments.js:483 | assessments.js:584 |
| Receives from service | Full diet plan object | Full diet plan object | Full diet plan object | Full diet plan object |
| Calls transformWeeklyPlanToMeals() with | dietPlanData['7_day_plan'] | dietPlanData['7_day_plan'] | dietPlanData['7_day_plan'] | dietPlanData['7_day_plan'] |
| Meals converted | ✓ 21 items (7×3) | ✓ 21 items (7×3) | ✓ 21 items (7×3) | **❌ 21 items (7×3) - SNACKS LOST** |
| Snacks extracted | N/A | N/A | N/A | ❌ **DROPPED** - only B/L/D extracted |
| Daily targets saved | N/A | N/A | N/A | ❌ **NOT SAVED** to rulesApplied |
| Calorie estimates saved | N/A | N/A | N/A | ❌ **NOT SAVED** to rulesApplied |
| **DATABASE STORAGE (DietPlan model)** |
| meals array structure | `[{day, mealType, foods, timing, notes}]` | `[{day, mealType, foods, timing, notes}]` | `[{day, mealType, foods, timing, notes}]` | `[{day, mealType, foods, timing, notes}]` |
| meals count | 21 | 21 | 21 | **21 (snacks omitted)** |
| rulesApplied[0].details saved | reasoning, topFoods, avoidFoods | reasoning, topFoods, avoidFoods | reasoning, topFoods, avoidFoods + framework-specific | reasoning, topFoods, avoidFoods, bmi, metabolic_risk_level |
| **fields lost to DB** | None | None | None | **snacks, daily_targets, total_calories_estimated, bmr, tdee** |
| **ROUTE RETRIEVAL (assessments.js:730-880)** |
| Retrieval endpoint | GET /api/assessments/diet-plan/current | GET /api/assessments/diet-plan/current | GET /api/assessments/diet-plan/current | GET /api/assessments/diet-plan/current |
| Fetches from DB | DietPlan collection | DietPlan collection | DietPlan collection | DietPlan collection |
| Converts meals back with | convertMealsToSevenDayPlan(meals) | convertMealsToSevenDayPlan(meals) | convertMealsToSevenDayPlan(meals) | convertMealsToSevenDayPlan(meals) |
| Reconstructed structure | {breakfast: [], lunch: [], dinner: []} | {breakfast: [], lunch: [], dinner: []} | {breakfast: [], lunch: [], dinner: []} | {breakfast: [], lunch: [], dinner: []} ✓ |
| **Reconstruction accuracy** | ✓ Complete | ✓ Complete | ✓ Complete | **⚠️ Incomplete - missing snacks** |
| reasoning_summary source | rulesApplied[0].details.reasoning | rulesApplied[0].details.reasoning (with format conversion) | rulesApplied[0].details.reasoning (with format conversion) | rulesApplied[0].details.reasoning ✓ |
| healthProfile built from | assessment.scores | assessment.scores | assessment.scores | assessment.scores ✓ |
| **fields in healthProfile** | prakriti, vikriti, agni | primary_pattern, secondary_pattern, cold_heat | primary_mizaj, dominant_humor, digestive_strength | bmi, bmi_category, bmr, tdee, recommended_calories, metabolic_risk_level, primary_goal ✓ |
| metadata in response | validFrom, validTo | validFrom, validTo | validFrom, validTo | validFrom, validTo ✓ |
| **FRONTEND EXPECTATIONS (diet-plan-timeline.tsx)** |
| DietPlan interface expects | '7_day_plan': Object | '7_day_plan': Object | '7_day_plan': Object | '7_day_plan': Object ✓ |
| day_N structure expected | {breakfast: [], lunch: [], dinner: []} | {breakfast: [], lunch: [], dinner: []} | {breakfast: [], lunch: [], dinner: []} | {breakfast: [], lunch: [], dinner: []} ✓ |
| **snacks expected** | ❌ Not in interface | ❌ Not in interface | ❌ Not in interface | ❌ **Not in interface** |
| **daily_targets expected** | ❌ Not in interface | ❌ Not in interface | ❌ Not in interface | ❌ **Not in interface** |
| **total_calories_estimated expected** | ❌ Not in interface | ❌ Not in interface | ❌ Not in interface | ❌ **Not in interface** |
| Top ranked foods access | `data.top_ranked_foods` | `data.top_ranked_foods` | `data.top_ranked_foods` | `data.top_ranked_foods` ✓ |
| Reasoning summary access | `data.reasoning_summary` | `data.reasoning_summary` | `data.reasoning_summary` | `data.reasoning_summary` ✓ |
| Typical meal access | `data['7_day_plan']['day_1']['breakfast']` | `data['7_day_plan']['day_1']['breakfast']` | `data['7_day_plan']['day_1']['breakfast']` | `data['7_day_plan']['day_1']['breakfast']` ✓ |
| Frontend compatibility | ✅ FULL | ✅ FULL | ✅ FULL | ⚠️ PARTIAL - missing nutritional data |

---

## CRITICAL ISSUES BY FRAMEWORK

### 🟢 AYURVEDA - FULLY COMPATIBLE
**Status**: ✅ **NO ISSUES**
- [✓] Consistent data flow from service to frontend
- [✓] All 21 meals correctly extracted and stored
- [✓] All returned fields properly saved and retrieved
- [✓] Frontend receives complete data as expected
- [✓] reasoning_summary is string (no conversion needed)

---

### 🟡 TCM - MINOR STRUCTURAL ISSUE
**Status**: ⚠️ **WORKS BUT CODE SMELL**
- [✓] All data reaches frontend correctly
- [✓] Complete meals array (21 items) stored and retrieved
- [⚠️] **ISSUE**: tcmMealPlan.generateWeeklyPlan() wraps result in `'7_day_plan'` key already
  - But tcmDietPlanService then attempts conversion again (lines 35-72)
  - Works by accident but violates abstraction
  - Suggests inconsistent interface design
- [⚠️] reasoning_summary stored as object, needs conversion on retrieval (lines 769-778)
- [✓] Frontend receives correct data despite code issues

---

### 🔴 UNANI - MINOR STRUCTURAL ISSUE
**Status**: ⚠️ **WORKS BUT SAME CODE SMELL AS TCM**
- [✓] All data reaches frontend correctly
- [✓] Complete meals array (21 items) stored and retrieved
- [⚠️] **ISSUE**: Same as TCM - double-conversion attempt in service
- [⚠️] reasoning_summary stored as object, needs conversion on retrieval
- [✓] Frontend receives correct data despite code issues

---

### 🔴 MODERN - CRITICAL DATA LOSS
**Status**: ❌ **MAJOR ISSUES - DATA LOST THROUGHOUT PIPELINE**

**Issue 1: Snacks Generated But Not Stored** 🚨
- Service generates: 5 meals/day (B, Snack1, L, Snack2, D)
- convertSevenDayPlanToMeals extracts: Only B/L/D (3 meals/day)
- **Impact**: Snacks completely omitted from database
- **Result**: Frontend unable to display snack recommendations
- **Data Loss**: ~28% of meal data (2 snacks × 7 days)

**Issue 2: Daily Targets Never Persisted** 🚨
- Service generates: `daily_targets: {calories, protein_g, carbs_g, fat_g}`
- Saved to rulesApplied: ❌ **NOT SAVED**
- **Impact**: No macro/calorie targets available for user guidance
- **Result**: Frontend cannot show nutrition targets

**Issue 3: Calorie Estimates Discarded** 🚨
- Service generates: `total_calories_estimated: number`
- Saved to rulesApplied: ❌ **NOT SAVED**
- **Impact**: Users don't know daily calorie expectations
- **Result**: Lost nutritional planning data

**Issue 4: User Profile Metadata Partial** 🚨
- Service generates: `{bmi, bmr, tdee, metabolic_risk_level}`
- Saved to rulesApplied: Only `{bmi, metabolic_risk_level}`
- **Lost**: bmr, tdee
- **Impact**: Important metabolic metrics not persisted with plan
- **Workaround**: Retrieved from assessment.scores (but not ideal)

**Issue 5: avoidFoods Format Different** ⚠️
- Other frameworks: `Array<string>`
- Modern returns: `Array<{food_name, score}>`
- Frontend handles both but inconsistent across frameworks

---

## ROOT CAUSES

### Modern Framework Problems
1. **Design Mismatch**: Service designed snacks as part of meal plan, but DB schema only supports B/L/D
2. **No Field Mapping**: Extra fields (snacks, daily_targets, etc.) not mapped to DietPlan schema fields
3. **Conversion Function Incomplete**: `convertSevenDayPlanToMeals()` hardcoded for B/L/D only
4. **Missing Data Extension**: No mechanism to store nutrition targets alongside meals

### TCM/Unani Problems
1. **Interface Inconsistency**: generateWeeklyPlan returns different structure than service expects
2. **Redundant Code**: Service tries to convert data that's already been converted
3. **Storage Format Inconsistency**: reasoning_summary stored as object instead of string

---

## RECOMMENDATIONS

### For Modern Framework - CRITICAL
1. **Add snacks to meals array**: Modify convertSevenDayPlanToMeals to handle snacks as meal_type 'Snack1', 'Snack2'
2. **Extend rulesApplied.details**: Save `daily_targets` and `total_calories_estimated` to database
3. **Update schema if needed**: Ensure DietPlan can store all nutrition metadata
4. **Update frontend interface**: Add optional snacks field for Modern framework compatibility
5. **Standardize avoidFoods**: Convert Modern's format to Array<string> to match others

### For TCM/Unani - CODE QUALITY
1. **Fix generateWeeklyPlan return format**: Should return array only, not wrapped in '7_day_plan'
2. **Store reasoning as string**: Convert object format before saving to database
3. **Simplify retrieval conversion**: Remove redundant format conversion logic

### For All Frameworks - CONSISTENCY
1. **Create conversion utility**: Standardize service return formats
2. **Add validation layer**: Verify all frameworks return compatible structures
3. **Document expected formats**: Clear contract between service and route layers

---

## VALIDATION CHECKLIST

- [x] Service generation formats traced for all 4 frameworks
- [x] Database storage identified and verified
- [x] Retrieval logic analyzed
- [x] Frontend expectations documented
- [x] Data loss points identified
- [x] Root causes analyzed
- [x] Recommendations provided
- [ ] **ACTION REQUIRED**: Fix Modern framework data loss
- [ ] **ACTION REQUIRED**: Standardize TCM/Unani code patterns
- [ ] **ACTION REQUIRED**: Test end-to-end for all frameworks after fixes

---

## AUDIT SUMMARY

| Framework | Compatibility | Data Loss | Code Quality | Recommendation |
|-----------|---|----------|---|---|
| Ayurveda | ✅ Full | ✓ None | ✅ Good | No action needed |
| TCM | ✅ Full | ✓ None | ⚠️ Code smell | Refactor for clarity |
| Unani | ✅ Full | ✓ None | ⚠️ Code smell | Refactor for clarity |
| **Modern** | **⚠️ Partial** | **❌ CRITICAL** | **⚠️ Design issue** | **FIXES REQUIRED** |

---

**Generated**: April 7, 2026  
**Audit Type**: Comprehensive pipeline trace  
**Status**: COMPLETE - Ready for remediation
