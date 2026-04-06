# Assessment Data Sync - Verification Guide

**Commit:** `2e98422`  
**Status:** ✅ Ready for testing

---

## Problem Fixed

Edit Profile modal remained empty after users completed health assessments. The assessment data wasn't being synced from the Assessment model to the User and HealthProfile models that the frontend reads from.

---

## What Was Corrected

### 1. **Response Key Mapping** (Critical Fix)

#### Modern Framework
- ❌ Was looking for: `food_allergies` → ✅ Now: `allergies`
- ❌ Was looking for: `sleep_hours` (direct number) → ✅ Now: `sleep_duration` with range parsing
- ✅ Correctly maps: `age`, `gender`, `height`, `weight`, `dietary_preference`, `digestive_issues`

#### Ayurveda Framework
- Extracts from question IDs: `ay_q1` through `ay_q19`
- Pulls `agni` type from result scores for digestive capacity

#### Unani Framework
- Extracts from question IDs: `un_q1` through `un_q21`
- Pulls `thermal_tendency` from result scores

#### TCM Framework
- Extracts from question IDs: `tcm_q1` through `tcm_q21`
- Pulls `cold_heat` pattern from result scores

#### Modern Clinical Framework
- Uses numeric IDs: `age`, `gender`, `height`, `weight`, etc.
- Extracts calculated values: `bmi`, `bmr`, `tdee`
- Parses range responses: `<5`, `5-6`, `6-7`, `7-8`, `8-9`, `>9` → midpoints

### 2. **New Helper Functions**

#### `parseSleepDuration(sleepDurationStr)`
Converts Modern framework's range responses to numeric hours:
- `'<5'` → 4 hours
- `'5-6'` → 5.5 hours
- `'6-7'` → 6.5 hours
- `'7-8'` → 7.5 hours
- `'8-9'` → 8.5 hours
- `'>9'` → 9.5 hours

#### `extractActivityLevel(framework, responses)`
Normalizes activity level across all frameworks:
- Input (Modern): `'sedentary'`, `'lightly_active'`, `'moderately_active'`, `'very_active'`, `'extremely_active'`
- Output: `'Sedentary'`, `'Moderate'`, or `'Active'` (HealthProfile schema enum)

### 3. **Schema Expansion**

Added to `HealthProfile` model:
```javascript
bmr: { type: Number, min: 0 }
tdee: { type: Number, min: 0 }
metabolicRiskLevel: { 
  type: String, 
  enum: ['Low', 'Moderate', 'High'],
  default: 'Moderate'
}
```

### 4. **Removed Broken Extraction**

- ❌ REMOVED: `getResponse('name')` - Names are NOT collected in any framework assessment
- ❌ REMOVED: Direct calls expecting wrong field names across frameworks

---

## Testing Checklist

### Step 1: Verify Backend Endpoint Responds

**Test:** Submit assessment for any framework (Modern, Ayurveda, Unani, or TCM)

**Expected:**
- ✅ Assessment saves successfully
- ✅ Status 200 returned
- No errors in server logs about "syncAssessmentDataToProfile"

**Check Logs:**
```
✅ User profile updated with assessment data: ['age', 'gender', 'height', 'weight', ...]
✅ New HealthProfile created with assessment framework: modern
```

### Step 2: Verify Data in User Model

**After submission**, check user profile:

**Frontend:** Profile page should show:
- ✅ Age, Gender, Height, Weight populated
- ✅ Dietary preference displayed
- ✅ Allergies listed (if any)

**Backend (MongoDB):**
```javascript
// Check user document
db.users.findOne({ _id: ObjectId("...") })

// Look for:
{
  age: 30,
  gender: "male",
  height: 175.5,
  weight: 75.2,
  dietaryPreference: "Vegetarian",
  allergies: ["gluten", "dairy"]  // or empty array
}
```

### Step 3: Verify HealthProfile Creation

**Check database:**
```javascript
db.healthprofiles.findOne({ userId: ObjectId("...") })

// Should have:
{
  bmi: 24.5,
  bmr: 1750,      // Modern only
  tdee: 2625,     // Modern only
  metabolicRiskLevel: "Low",   // Modern only
  lifestyle: {
    activityLevel: "Moderate",
    sleepHours: 7.5,
    stressLevel: "High"
  },
  digestionIndicators: {
    appetite: "Normal",
    bowelRegularity: "Regular",
    bloating: false,
    acidReflux: false
  }
}
```

### Step 4: Test Modern Framework Specifically

**Submit Modern Assessment with:**
- Age: 30
- Gender: Female
- Height: 165 cm
- Weight: 62 kg
- Sleep: "7-8 hours"
- Stress: "moderate"
- Allergies: ["gluten"]
- Dietary preference: "vegetarian"
- Digestive issues: ["bloating", "heartburn"]

**Expected HealthProfile Output:**
```javascript
{
  bmi: 22.8,
  bmr: ~1380,
  tdee: ~2070,
  lifestyle: {
    sleepHours: 7.5,      // Parsed from "7-8"
    stressLevel: "Medium",
    activityLevel: "Moderate"
  },
  digestionIndicators: {
    bloating: true,       // From digestive_issues: ["bloating", ...]
    acidReflux: true      // From digestive_issues: ["heartburn", ...]
  }
}
```

### Step 5: Test Edit Profile Modal

**After completing assessment:**

1. Go to Edit Profile page
2. Modal should show:
   - ✅ Age filled in
   - ✅ Gender selected
   - ✅ Height populated
   - ✅ Weight populated
   - ✅ Sleep hours displayed (converted from range)
   - ✅ Activity level shown
   - ✅ Stress level displayed

3. **Should NOT be empty anymore** ❌→✅

### Step 6: Test All 4 Frameworks

Complete assessment for each:

#### Ayurveda (`framework: 'ayurveda'`)
✅ Should extract: dosha scores, agni type, dietary recommendations
✅ Should populate User: age, height, weight, gender
✅ Should create HealthProfile with digest indicators

#### Unani (`framework: 'unani'`)
✅ Should extract: mizaj scores, thermal tendency
✅ Should populate User: basic metrics
✅ Should create HealthProfile with thermal tendency

#### TCM (`framework: 'tcm'`)
✅ Should extract: pattern scores, cold/heat dominance
✅ Should populate User: demographics
✅ Should create HealthProfile with cold/heat pattern

#### Modern (`framework: 'modern'`)
✅ Should extract: BMI, BMR, TDEE, metabolic risk
✅ Should populate User: all fields including allergies/preferences
✅ Should create HealthProfile with calculated metrics

---

## Common Issues & Troubleshooting

### Issue: "syncAssessmentDataToProfile is not defined"
**Cause:** Function not properly defined in assessments.js
**Fix:** Check file has helper functions BEFORE the router.post endpoint

### Issue: HealthProfile fields missing/null
**Cause:** getResponse() not finding the response keys
**Fix:** Check response object structure in console.log before calling sync

### Issue: "Cannot read property 'value' of undefined"
**Cause:** Response keys don't match framework's question IDs
**Fix:** Verify response keys match questionBanks.js IDs (e.g., `allergies`, not `food_allergies`)

### Issue: Sleep hours always 7 (default)
**Cause:** Sleep range not parsed correctly
**Fix:** Verify sleep_duration returns strings like "7-8", not numbers

---

## Deployment Checklist

Before redeploying to Render:

- [ ] All 4 frameworks tested locally
- [ ] Edit Profile modal shows populated fields
- [ ] MongoDB HealthProfile has correct data
- [ ] No "undefined" values in HealthProfile
- [ ] Sleep hours are numeric not strings
- [ ] Activity levels match enum values: `Sedentary`, `Moderate`, `Active`
- [ ] Stress levels match enum values: `Low`, `Medium`, `High`
- [ ] Digestive issues parsed correctly (true/false, not strings)

---

## Files Modified

1. **backend/routes/assessments.js**
   - Added `parseSleepDuration()` 
   - Added `extractActivityLevel()`
   - Rewrote `syncAssessmentDataToProfile()` with framework awareness
   - All response key mappings corrected

2. **backend/models/HealthProfile.js**
   - Added `bmr` field
   - Added `tdee` field
   - Added `metabolicRiskLevel` enum field

---

## Success Indicators ✅

1. **User data populates immediately after assessment**
   - No need to refresh page
   - Check MongoDB shows all fields

2. **HealthProfile has complete data**
   - All calculated metrics for Modern
   - Framework-specific extracted data
   - Proper data types (numbers, booleans, strings)

3. **Edit Profile Modal works**
   - Shows all fields
   - Can edit and save changes
   - Changes persist

4. **No errors in deployment logs**
   - No "Cannot read property" errors
   - No "undefined" in responses
   - No model reference errors

---

## When Ready to Deploy

1. Test all 4 frameworks locally ✅
2. Verify HTTP endpoint returns 200 for all frameworks ✅
3. Check MongoDB documents populate correctly ✅
4. Test Edit Profile modal on each framework ✅
5. Re-deploy to Render (single deployment cycle)

**Commit:** `2e98422` is production-ready after local verification.
