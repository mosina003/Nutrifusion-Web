/**
 * Script to classify foods by meal_type and role
 * Updates all 4 framework food constitution files
 */

const fs = require('fs');
const path = require('path');

/**
 * Classify a food item based on nutritional properties
 * Framework-aware classification
 */
function classifyFood(food, framework) {
  const mealType = [];
  let role = 'main'; // default

  // Dispatch to framework-specific classifier
  if (framework === 'ayurveda') {
    return classifyAyurveda(food);
  } else if (framework === 'unani') {
    return classifyUnani(food);
  } else if (framework === 'tcm') {
    return classifyTCM(food);
  } else if (framework === 'modern') {
    return classifyModern(food);
  }

  return { meal_type: ['lunch'], role: 'main' };
}

/**
 * AYURVEDA Classification
 */
function classifyAyurveda(food) {
  const mealType = [];
  let role = 'main'; // default

  // ===== MEAL TYPE CLASSIFICATION =====
  
  // BREAKFAST: light, easy to digest, low ama forming
  if (
    food.digestibility_score <= 2 &&
    food.ama_forming_potential === 'low' &&
    food.guna.includes('light')
  ) {
    mealType.push('breakfast');
  }

  // LUNCH: all foods
  mealType.push('lunch');

  // DINNER: light, not heavy for digestion before sleep
  const isHeavyAndOily = food.guna.includes('heavy') && food.guna.includes('oily');
  if (
    food.ama_forming_potential === 'low' &&
    food.digestibility_score <= 2 &&
    !isHeavyAndOily
  ) {
    mealType.push('dinner');
  } else if (
    food.ama_forming_potential === 'low' &&
    food.digestibility_score === 3 &&
    (food.guna.includes('light') || !isHeavyAndOily)
  ) {
    mealType.push('dinner');
  }

  // ===== ROLE CLASSIFICATION =====
  if (food.category === 'beverage') {
    role = 'beverage';
  } else if (food.category === 'spice') {
    role = 'digestive';
  } else if (food.category === 'meat' || food.category === 'legume') {
    role = 'protein';
  } else if (
    food.category === 'dairy' &&
    (food.guna.includes('heavy') || food.guna.includes('oily') || food.food_name.includes('Egg'))
  ) {
    role = 'protein';
  } else if (food.category === 'vegetable' || (food.category === 'fruit' && !food.food_name.includes('Juice'))) {
    role = 'side';
  } else if (food.category === 'oil') {
    role = 'digestive';
  } else if (food.category === 'grain') {
    role = 'main';
  } else if (food.category === 'dairy') {
    if (food.guna.includes('light') || food.food_name === 'Ghee' || food.food_name === 'Milk') {
      role = 'digestive';
    } else {
      role = 'protein';
    }
  }

  return {
    meal_type: [...new Set(mealType)],
    role
  };
}

/**
 * UNANI Classification
 */
function classifyUnani(food) {
  const mealType = [];
  let role = 'main';

  // ===== MEAL TYPE CLASSIFICATION =====
  
  // BREAKFAST: easy digestion, not too hot or cold
  if (
    food.digestion_ease === 'easy' &&
    food.temperament.hot_level <= 1 &&
    food.temperament.cold_level <= 1
  ) {
    mealType.push('breakfast');
  }

  // LUNCH: all foods
  mealType.push('lunch');

  // DINNER: easy/moderate digestion, cooling (cold_level > hot_level)
  if (
    (food.digestion_ease === 'easy' || food.digestion_ease === 'moderate') &&
    food.temperament.cold_level >= food.temperament.hot_level
  ) {
    mealType.push('dinner');
  }

  // ===== ROLE CLASSIFICATION =====
  if (food.category === 'beverage') {
    role = 'beverage';
  } else if (food.category === 'spice') {
    role = 'digestive';
  } else if (food.category === 'meat' || food.category === 'legume') {
    role = 'protein';
  } else if (food.category === 'vegetable' || food.category === 'fruit') {
    role = 'side';
  } else if (food.category === 'oil') {
    role = 'digestive';
  } else if (food.category === 'grain') {
    role = 'main';
  } else if (food.category === 'dairy') {
    // Paneer, cheese = protein; milk/ghee = digestive
    if (food.food_name.includes('Paneer') || food.food_name.includes('Cheese') || food.food_name.includes('Egg')) {
      role = 'protein';
    } else {
      role = 'digestive';
    }
  }

  return {
    meal_type: [...new Set(mealType)],
    role
  };
}

/**
 * TCM Classification
 */
function classifyTCM(food) {
  const mealType = [];
  let role = 'main';

  // ===== MEAL TYPE CLASSIFICATION =====
  
  // BREAKFAST: neutral/cool nature, tonifies qi
  if (
    (food.thermal_nature === 'neutral' || food.thermal_nature === 'cool') &&
    (food.qi_effect === 'tonifies' || food.qi_effect === 'neutral')
  ) {
    mealType.push('breakfast');
  }

  // LUNCH: all foods
  mealType.push('lunch');

  // DINNER: cool/neutral, easy to digest
  if (
    (food.thermal_nature === 'neutral' || food.thermal_nature === 'cool') &&
    food.qi_effect !== 'drains'
  ) {
    mealType.push('dinner');
  }

  // ===== ROLE CLASSIFICATION =====
  if (food.category === 'beverage') {
    role = 'beverage';
  } else if (food.category === 'spice') {
    role = 'digestive';
  } else if (food.category === 'meat' || food.category === 'legume') {
    role = 'protein';
  } else if (food.category === 'vegetable' || food.category === 'fruit') {
    role = 'side';
  } else if (food.category === 'oil') {
    role = 'digestive';
  } else if (food.category === 'grain') {
    role = 'main';
  } else if (food.category === 'dairy') {
    if (food.food_name.includes('Egg')) {
      role = 'protein';
    } else {
      role = 'digestive';
    }
  }

  return {
    meal_type: [...new Set(mealType)],
    role
  };
}

/**
 * MODERN Classification (Clinical/Nutritional)
 */
function classifyModern(food) {
  const mealType = [];
  let role = 'main';

  // ===== MEAL TYPE CLASSIFICATION =====
  
  // BREAKFAST: low calories, low fat, good fiber
  if (
    food.calories < 300 &&
    food.fat < 10 &&
    food.fiber >= 1
  ) {
    mealType.push('breakfast');
  }

  // LUNCH: all foods (main meal)
  mealType.push('lunch');

  // DINNER: moderate calories, low fat, good fiber, lower glycemic impact
  if (
    food.calories < 400 &&
    food.fat < 12 &&
    food.fiber >= 2 &&
    food.glycemic_index < 75
  ) {
    mealType.push('dinner');
  }

  // ===== ROLE CLASSIFICATION =====
  if (food.category === 'beverage') {
    role = 'beverage';
  } else if (food.category === 'spice') {
    role = 'digestive';
  } else if (food.category === 'meat' || food.category === 'legume') {
    role = 'protein';
  } else if (food.category === 'vegetable' || food.category === 'fruit') {
    role = 'side';
  } else if (food.category === 'oil') {
    role = 'digestive';
  } else if (food.category === 'grain') {
    role = 'main';
  } else if (food.category === 'dairy') {
    if (food.protein >= 8 && food.fat >= 5) {
      // High protein dairy items
      role = 'protein';
    } else {
      role = 'digestive';
    }
  }

  return {
    meal_type: [...new Set(mealType)],
    role
  };
}

/**
 * Process a single food constitution file
 */
function processFoodFile(filePath, frameworkName) {
  console.log(`\n📋 Processing ${frameworkName} framework...`);
  
  try {
    // Read file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const foods = JSON.parse(fileContent);

    if (!Array.isArray(foods)) {
      console.error(`❌ File is not an array: ${filePath}`);
      return false;
    }

    console.log(`   📊 Found ${foods.length} foods`);

    // Classify each food
    let classifiedCount = 0;
    const roleStats = {};
    const mealTypeStats = { breakfast: 0, lunch: 0, dinner: 0 };

    const classifiedFoods = foods.map((food) => {
      const classification = classifyFood(food, frameworkName.toLowerCase());
      classifiedCount++;

      // Track statistics
      if (!roleStats[classification.role]) roleStats[classification.role] = 0;
      roleStats[classification.role]++;

      classification.meal_type.forEach(mt => {
        if (!mealTypeStats[mt]) mealTypeStats[mt] = 0;
        mealTypeStats[mt]++;
      });

      return {
        ...food,
        meal_type: classification.meal_type,
        role: classification.role
      };
    });

    // Write back to file with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(classifiedFoods, null, 2));
    console.log(`   ✅ Classified ${classifiedCount} foods`);

    // Print statistics
    console.log(`\n   📊 Role Distribution:`);
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`      - ${role}: ${count} foods`);
    });

    console.log(`\n   📊 Meal Type Distribution:`);
    Object.entries(mealTypeStats).forEach(([mealType, count]) => {
      console.log(`      - ${mealType}: ${count} foods`);
    });

    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    console.error(`   Stack: ${error.stack}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🍽️  Food Classification Script');
  console.log('================================\n');

  const dataDir = path.join(__dirname, '..', 'data');
  const files = [
    { path: path.join(dataDir, 'ayurveda_food_constitution.json'), name: 'Ayurveda' },
    { path: path.join(dataDir, 'unani_food_constitution.json'), name: 'Unani' },
    { path: path.join(dataDir, 'tcm_food_constitution.json'), name: 'TCM' },
    { path: path.join(dataDir, 'modern_food_constitution.json'), name: 'Modern' }
  ];

  let successCount = 0;
  let failureCount = 0;

  files.forEach(({ path: filePath, name }) => {
    if (fs.existsSync(filePath)) {
      if (processFoodFile(filePath, name)) {
        successCount++;
      } else {
        failureCount++;
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
      failureCount++;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`📈 Summary: ${successCount} successful, ${failureCount} failed`);
  
  if (failureCount === 0) {
    console.log('✅ All food files classified successfully!');
  }
}

// Run the script
main();
