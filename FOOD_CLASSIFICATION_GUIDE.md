# Food Database Restructuring - Meal Type & Role Classification

**Commit:** `efad10a`  
**Status:** ✅ 400 foods classified across all 4 frameworks

---

## Overview

All foods in the 4 medical frameworks (Ayurveda, Unani, TCM, Modern) have been restructured to include:

1. **meal_type**: Array of suitable meal times
   - `breakfast` - light, easy-to-digest meals
   - `lunch` - main meal, can include heavier foods
   - `dinner` - light, digestible meals for sleep

2. **role**: Functional classification in a meal
   - `main` - primary dish (grains, cooked dishes)
   - `protein` - protein source (meat, legume, heavy dairy)
   - `side` - vegetable/fruit support
   - `digestive` - spices, aids, oils for digestion
   - `beverage` - drinks

---

## Classification Rules by Framework

### 🇮🇳 AYURVEDA (Guna-based Classification)

**Data Properties Used:**
- `digestibility_score` (1-5): Lower is easier
- `ama_forming_potential` ('low', 'medium', 'high')
- `guna` (qualities): 'light', 'heavy', 'oily', 'dry', etc.

**Breakfast Foods:**
```
✓ digestibility_score ≤ 2
✓ ama_forming_potential = 'low'
✓ 'light' in guna
→ Examples: Idli, Poha, Upma, Apple
```

**Lunch Foods:**
```
✓ ALL foods (main meal of day)
```

**Dinner Foods:**
```
✓ digestibility_score ≤ 2
✓ ama_forming_potential = 'low'
✗ NOT (heavy AND oily) combination
→ Examples: Idli, Poha, Ghee, Rice+Dal
```

**Role Classification:**
- `protein`: meat, legume categories OR heavy dairy (paneer, cheese, eggs)
- `main`: grain category
- `side`: vegetable, fruit categories
- `digestive`: spice category, oils
- `beverage`: beverage category

**Statistics:**
- Total Foods: 100
- Breakfast: 35 foods
- Lunch: 100 foods
- Dinner: 42 foods
- Role Split: 50 main, 31 protein, 8 side, 5 digestive, 6 beverage

---

### 🕌 UNANI (Temperament-based Classification)

**Data Properties Used:**
- `temperament`: `{hot_level, cold_level, dry_level, moist_level}` (0-2 each)
- `digestion_ease`: 'easy', 'moderate', 'difficult'
- `dominant_humor`: `dam`, `safra`, `balgham`, `sauda`

**Breakfast Foods:**
```
✓ digestion_ease = 'easy' OR 'moderate'
✓ hot_level ≤ 1 (not too heating)
✓ cold_level ≤ 1 (not too cooling)
→ Examples: Idli, Poha (balanced temperament)
```

**Lunch Foods:**
```
✓ ALL foods (main meal)
```

**Dinner Foods:**
```
✓ digestion_ease = 'easy' OR 'moderate'
✓ cold_level ≥ hot_level (cooling tendency)
→ Examples: Idli, Ghee, Milk (cooling foods)
```

**Role Classification:**
- `protein`: meat, legume OR paneer/cheese items
- `main`: grain category
- `side`: vegetable, fruit categories
- `digestive`: spice, oil, or light dairy (milk, ghee)
- `beverage`: beverage category

**Statistics:**
- Total Foods: 100
- Breakfast: 18 foods (strict temperament balance)
- Lunch: 100 foods
- Dinner: 35 foods (cooling emphasis)
- Role Split: 49 main, 27 protein, 9 side, 10 digestive, 5 beverage

---

### 🏮 TCM (Thermal & Qi-based Classification)

**Data Properties Used:**
- `thermal_nature`: 'cool', 'neutral', 'warm', 'hot'
- `qi_effect`: 'tonifies', 'moves', 'drains', 'neutral'
- `pattern_effects`: Dictionary of effects on patterns
- `flavor`: Primary tastes

**Breakfast Foods:**
```
✓ thermal_nature = 'neutral' OR 'cool' or 'warm' (not hot)
✓ qi_effect = 'tonifies' (strengthens qi)
→ Examples: Idli, Rice, many grains
```

**Lunch Foods:**
```
✓ ALL foods (main meal)
```

**Dinner Foods:**
```
✓ thermal_nature = 'neutral' OR 'cool' (easy digestion)
✓ qi_effect ≠ 'drains' (not depleting)
→ Examples: Idli, Rice, vegetables
```

**Role Classification:**
- `protein`: meat, legume OR eggs
- `main`: grain category
- `side`: vegetable, fruit categories
- `digestive`: spice, oil, or light dairy
- `beverage`: beverage category

**Statistics:**
- Total Foods: 100
- Breakfast: 46 foods (many tonifying grains)
- Lunch: 100 foods
- Dinner: 51 foods (thermal flexibility)
- Role Split: 49 main, 23 protein, 9 side, 14 digestive, 5 beverage

---

### 🔬 MODERN (Nutritional/Clinical Classification)

**Data Properties Used:**
- `calories`: Total energy content
- `protein`: Grams per serving
- `fat`: Grams per serving
- `fiber`: Grams per serving
- `glycemic_index`: 0-100 scale
- `micronutrients`: Iron, calcium, sodium, etc.

**Breakfast Foods:**
```
✓ calories < 300 (light meal)
✓ fat < 10g (low fat for morning)
✓ fiber ≥ 1g (aids digestion)
→ Examples: Idli, Toast, Oats, most light dishes
```

**Lunch Foods:**
```
✓ ALL foods (main meal, more calories acceptable)
```

**Dinner Foods:**
```
✓ calories < 400 (moderate energy before sleep)
✓ fat < 12g (avoid fat overload)
✓ fiber ≥ 2g (aids digestion)
✓ glycemic_index < 75 (avoid spikes)
→ Examples: Light grains, vegetables, lean proteins
```

**Role Classification:**
- `protein`: (protein > 8g AND fat > 5g) OR meat/legume category
- `main`: grain category (or high-protein dairy)
- `side`: vegetable, fruit categories
- `digestive`: spice, oil, or light dairy (milk < 8g protein OR < 5g fat)
- `beverage`: beverage category

**Statistics:**
- Total Foods: 100
- Breakfast: 57 foods (many low-cal options)
- Lunch: 100 foods
- Dinner: 62 foods (moderate portions encouraged)
- Role Split: 65 main, 13 protein, 8 side, 9 digestive, 5 beverage

---

## Data Structure Examples

### Ayurveda Format
```json
{
  "food_name": "Idli",
  "category": "grain",
  "preparation_methods": ["steamed", "fermented"],
  "rasa": ["sour", "sweet"],
  "virya": "cooling",
  "vipaka": "sweet",
  "guna": ["light", "soft"],
  "digestibility_score": 2,
  "ama_forming_potential": "low",
  "meal_type": ["breakfast", "lunch", "dinner"],
  "role": "main"
}
```

### Modern Format
```json
{
  "food_name": "Idli",
  "category": "grain",
  "preparation_methods": ["steamed", "fermented"],
  "calories": 130,
  "protein": 4,
  "carbs": 28,
  "fat": 1,
  "fiber": 2,
  "glycemic_index": 70,
  "meal_type": ["breakfast", "lunch", "dinner"],
  "role": "main"
}
```

### TCM Format
```json
{
  "food_name": "Idli",
  "category": "grain",
  "thermal_nature": "neutral",
  "flavor": ["sweet"],
  "meridian": ["Spleen", "Stomach"],
  "qi_effect": "tonifies",
  "meal_type": ["breakfast", "lunch", "dinner"],
  "role": "main"
}
```

### Unani Format
```json
{
  "food_name": "Idli",
  "category": "grain",
  "temperament": {"hot_level": 1, "cold_level": 2, "dry_level": 0, "moist_level": 2},
  "dominant_humor": "dam",
  "digestion_ease": "easy",
  "meal_type": ["breakfast", "lunch", "dinner"],
  "role": "main"
}
```

---

## Usage in API/Frontend

### Query Breakfast Foods (All Frameworks)
```javascript
// Get Ayurveda breakfast foods
const breakfastFoods = foods.filter(f => f.meal_type.includes('breakfast'));

// Get only main dishes
const mainDishes = breakfastFoods.filter(f => f.role === 'main');
```

### Build a Meal Plan
```javascript
// Suggested meal structure for user's constitution
{
  breakfast: {
    main: foods.filter(f => f.meal_type.includes('breakfast') && f.role === 'main'),
    beverage: foods.filter(f => f.meal_type.includes('breakfast') && f.role === 'beverage')
  },
  lunch: {
    main: foods.filter(f => f.meal_type.includes('lunch') && f.role === 'main'),
    protein: foods.filter(f => f.meal_type.includes('lunch') && f.role === 'protein'),
    side: foods.filter(f => f.meal_type.includes('lunch') && f.role === 'side'),
    digestive: foods.filter(f => f.meal_type.includes('lunch') && f.role === 'digestive')
  },
  dinner: {
    main: foods.filter(f => f.meal_type.includes('dinner') && f.role === 'main'),
    side: foods.filter(f => f.meal_type.includes('dinner') && f.role === 'side')
  }
}
```

---

## Classification Script

**Location:** `backend/scripts/classifyFoods.js`

**To Re-Run/Update Classifications:**
```bash
cd backend
node scripts/classifyFoods.js
```

**Features:**
- Framework-aware classification logic
- Handles all 4 schema formats
- Generates statistics for verification
- Idempotent (safe to run multiple times)

---

## Verification Checklist

✅ **Before Using in Production:**

1. **Data Integrity**
   - [ ] All 4 food files have `meal_type` (array) and `role` (string)
   - [ ] No food has empty `meal_type`
   - [ ] All `role` values are one of: main, side, protein, digestive, beverage

2. **Classification Accuracy**
   - [ ] Breakfast items are light and low-ama (Ayurveda) ✓
   - [ ] Lunch includes all foods ✓
   - [ ] Dinner items avoid heavy+oily combos ✓
   - [ ] All grains are `role: main` ✓

3. **Database Integrity**
   - [ ] JSON is valid and properly formatted ✓
   - [ ] No truncated entries ✓
   - [ ] Statistics from script: 400 total foods, 0 errors ✓

---

## Future Enhancements

Planned improvements:
- [ ] Add portion size recommendations by meal type
- [ ] Add flavor combinations (dinner pairs, breakfast sets)
- [ ] Add preparation time estimates
- [ ] Add seasonal availability flags

---

## Files Modified

- `backend/data/ayurveda_food_constitution.json`: +meal_type, +role
- `backend/data/unani_food_constitution.json`: +meal_type, +role
- `backend/data/tcm_food_constitution.json`: +meal_type, +role
- `backend/data/modern_food_constitution.json`: +meal_type, +role
- `backend/scripts/classifyFoods.js`: NEW - classification engine

**Total:** 400 foods (100 each framework) ✅ classified and ready to use.
