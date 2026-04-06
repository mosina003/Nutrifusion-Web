const fs = require('fs');
const path = require('path');

// Load all food databases
const databases = {
  ayurveda: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/ayurveda_food_constitution.json'), 'utf8')),
  unani: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/unani_food_constitution.json'), 'utf8')),
  tcm: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/tcm_food_constitution.json'), 'utf8')),
  modern: JSON.parse(fs.readFileSync(path.join(__dirname, '../data/modern_food_constitution.json'), 'utf8'))
};

// Load generated meal combinations
const mealCombinations = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/generated_meal_combinations.json'), 'utf8'));

// ===== AYURVEDA BALANCING (using Dosha) =====
function balanceAyurveda(userDosha = { vata: 0.6, pitta: 0.3, kapha: 0.1 }) {
  const dominantDosha = Object.keys(userDosha).reduce((a, b) => 
    userDosha[a] > userDosha[b] ? a : b
  );
  
  function scoreFoodForDosha(food) {
    let score = 0;
    
    if (dominantDosha === 'vata') {
      score -= (food.vata_effect || 0) * 10;
      score += (food.pitta_effect || 0) * 3;
      score += (food.kapha_effect || 0) * 2;
    } else if (dominantDosha === 'pitta') {
      score -= (food.pitta_effect || 0) * 10;
      score += (food.vata_effect || 0) * 2;
      score += (food.kapha_effect || 0) * 3;
    } else if (dominantDosha === 'kapha') {
      score -= (food.kapha_effect || 0) * 10;
      score += (food.vata_effect || 0) * 3;
      score += (food.pitta_effect || 0) * 2;
    }
    
    score += (food.digestibility_score || 0) * 2;
    if (food.ama_forming_potential === 'low') score += 5;
    
    return score;
  }
  
  const breakfast = [];
  mealCombinations.breakfast.forEach((meal, idx) => {
    const mainFood = databases.ayurveda.find(f => f.food_name === meal.main);
    const sideFood = databases.ayurveda.find(f => f.food_name === meal.side);
    const beverageFood = databases.ayurveda.find(f => f.food_name === meal.beverage);
    
    if (mainFood && sideFood && beverageFood) {
      const totalScore = scoreFoodForDosha(mainFood) + scoreFoodForDosha(sideFood) + scoreFoodForDosha(beverageFood);
      if (totalScore > -5) {
        breakfast.push({
          meal: [meal.main, meal.side, meal.beverage],
          reason: `${meal.main} (${mainFood.virya}) + ${meal.side} + ${meal.beverage} - balances ${dominantDosha}. Ama potential: ${mainFood.ama_forming_potential}`,
          score: totalScore
        });
      }
    }
  });
  
  const lunch = [];
  mealCombinations.lunch.forEach((meal, idx) => {
    const grainFood = databases.ayurveda.find(f => f.food_name === meal.grain);
    const proteinFood = databases.ayurveda.find(f => f.food_name === meal.protein);
    const vegFood = databases.ayurveda.find(f => f.food_name === meal.vegetable);
    
    if (grainFood && proteinFood && vegFood) {
      const totalScore = scoreFoodForDosha(grainFood) + scoreFoodForDosha(proteinFood) + scoreFoodForDosha(vegFood);
      if (totalScore > -5) {
        lunch.push({
          meal: [meal.grain, meal.protein, meal.vegetable, meal.digestive],
          reason: `${meal.grain} (${grainFood.virya}) + ${meal.protein} provides balanced digestion for ${dominantDosha}-dominant constitution`,
          score: totalScore
        });
      }
    }
  });
  
  const dinner = [];
  mealCombinations.dinner.forEach((meal, idx) => {
    const mainFood = databases.ayurveda.find(f => f.food_name === meal.main);
    const sideFood = databases.ayurveda.find(f => f.food_name === meal.side && meal.side !== 'Optional');
    
    if (mainFood && sideFood) {
      const totalScore = scoreFoodForDosha(mainFood) + scoreFoodForDosha(sideFood);
      if (totalScore > -5) {
        dinner.push({
          meal: [meal.main, meal.side],
          reason: `Light dinner: ${meal.main} (${mainFood.virya}) reduces ${dominantDosha} aggravation before sleep`,
          score: totalScore
        });
      }
    }
  });
  
  return { breakfast, lunch, dinner };
}

// ===== UNANI BALANCING (using Humors) =====
function balanceUnani(userHumor = { dam: 0.25, safra: 0.25, balgham: 0.25, sauda: 0.25 }) {
  const dominantHumor = Object.keys(userHumor).reduce((a, b) => 
    userHumor[a] > userHumor[b] ? a : b
  );
  
  function scoreFoodForHumor(food) {
    let score = 0;
    score -= (food.humor_effects[dominantHumor] || 0) * 10;
    Object.keys(food.humor_effects).forEach(humor => {
      if (humor !== dominantHumor) {
        score += (food.humor_effects[humor] || 0) * 2;
      }
    });
    if (food.digestion_ease === 'easy') score += 5;
    return score;
  }
  
  const breakfast = [];
  mealCombinations.breakfast.forEach((meal, idx) => {
    const mainFood = databases.unani.find(f => f.food_name === meal.main);
    const sideFood = databases.unani.find(f => f.food_name === meal.side);
    const beverageFood = databases.unani.find(f => f.food_name === meal.beverage);
    
    if (mainFood && sideFood && beverageFood) {
      const totalScore = scoreFoodForHumor(mainFood) + scoreFoodForHumor(sideFood) + scoreFoodForHumor(beverageFood);
      if (totalScore > -5) {
        breakfast.push({
          meal: [meal.main, meal.side, meal.beverage],
          reason: `${meal.main} (${mainFood.temperament.hot_level}H-${mainFood.temperament.cold_level}C) + ${meal.side} reduces excess ${dominantHumor}. Digestion: ${mainFood.digestion_ease}`,
          score: totalScore
        });
      }
    }
  });
  
  const lunch = [];
  mealCombinations.lunch.forEach((meal, idx) => {
    const grainFood = databases.unani.find(f => f.food_name === meal.grain);
    const proteinFood = databases.unani.find(f => f.food_name === meal.protein);
    const vegFood = databases.unani.find(f => f.food_name === meal.vegetable);
    
    if (grainFood && proteinFood && vegFood) {
      const totalScore = scoreFoodForHumor(grainFood) + scoreFoodForHumor(proteinFood) + scoreFoodForHumor(vegFood);
      if (totalScore > -5) {
        lunch.push({
          meal: [meal.grain, meal.protein, meal.vegetable, meal.digestive],
          reason: `Complete meal: ${meal.grain} + ${meal.protein} balances ${dominantHumor} excess. Organ affinity: stomach`,
          score: totalScore
        });
      }
    }
  });
  
  const dinner = [];
  mealCombinations.dinner.forEach((meal, idx) => {
    const mainFood = databases.unani.find(f => f.food_name === meal.main);
    const sideFood = databases.unani.find(f => f.food_name === meal.side && meal.side !== 'Optional');
    
    if (mainFood && sideFood) {
      const totalScore = scoreFoodForHumor(mainFood) + scoreFoodForHumor(sideFood);
      if (totalScore > -5) {
        dinner.push({
          meal: [meal.main, meal.side],
          reason: `Easy to digest: ${meal.main} + ${meal.side} - mild ${dominantHumor} reducing action. Temperament: ${mainFood.temperament.hot_level}H`,
          score: totalScore
        });
      }
    }
  });
  
  return { breakfast, lunch, dinner };
}

// ===== TCM BALANCING (using Patterns) =====
function balanceTCM(userPattern = { qi_deficiency: 0.4, heat: 0.3, dampness: 0.3 }) {
  const dominantPattern = Object.keys(userPattern).reduce((a, b) => 
    userPattern[a] > userPattern[b] ? a : b
  );
  
  function scoreFoodForPattern(food) {
    let score = 0;
    score += (food.pattern_effects[dominantPattern] || 0) * 10;
    if (food.qi_effect === 'tonifies') score += 5;
    
    if (dominantPattern === 'heat' && (food.thermal_nature === 'cool' || food.thermal_nature === 'cold')) {
      score += 8;
    } else if (dominantPattern === 'qi_deficiency' && (food.thermal_nature === 'warm' || food.thermal_nature === 'hot')) {
      score += 8;
    } else if (dominantPattern === 'dampness' && food.thermal_nature === 'warm') {
      score += 8;
    }
    
    return score;
  }
  
  const breakfast = [];
  mealCombinations.breakfast.forEach((meal, idx) => {
    const mainFood = databases.tcm.find(f => f.food_name === meal.main);
    const sideFood = databases.tcm.find(f => f.food_name === meal.side);
    const beverageFood = databases.tcm.find(f => f.food_name === meal.beverage);
    
    if (mainFood && sideFood && beverageFood) {
      const totalScore = scoreFoodForPattern(mainFood) + scoreFoodForPattern(sideFood) + scoreFoodForPattern(beverageFood);
      if (totalScore > 0) {
        breakfast.push({
          meal: [meal.main, meal.side, meal.beverage],
          reason: `${meal.main} (${mainFood.thermal_nature}, ${mainFood.qi_effect}) + ${meal.side} supports ${dominantPattern} pattern healing. Meridian: ${mainFood.meridian[0]}`,
          score: totalScore
        });
      }
    }
  });
  
  const lunch = [];
  mealCombinations.lunch.forEach((meal, idx) => {
    const grainFood = databases.tcm.find(f => f.food_name === meal.grain);
    const proteinFood = databases.tcm.find(f => f.food_name === meal.protein);
    const vegFood = databases.tcm.find(f => f.food_name === meal.vegetable);
    
    if (grainFood && proteinFood && vegFood) {
      const totalScore = scoreFoodForPattern(grainFood) + scoreFoodForPattern(proteinFood) + scoreFoodForPattern(vegFood);
      if (totalScore > 0) {
        lunch.push({
          meal: [meal.grain, meal.protein, meal.vegetable, meal.digestive],
          reason: `${meal.grain} (${grainFood.qi_effect}) + ${meal.protein} fortifies ${dominantPattern} deficiency. Element: ${grainFood.element_affinity}`,
          score: totalScore
        });
      }
    }
  });
  
  const dinner = [];
  mealCombinations.dinner.forEach((meal, idx) => {
    const mainFood = databases.tcm.find(f => f.food_name === meal.main);
    const sideFood = databases.tcm.find(f => f.food_name === meal.side && meal.side !== 'Optional');
    
    if (mainFood && sideFood) {
      const totalScore = scoreFoodForPattern(mainFood) + scoreFoodForPattern(sideFood);
      if (totalScore > 0) {
        dinner.push({
          meal: [meal.main, meal.side],
          reason: `Light dinner (${mainFood.thermal_nature}) supports ${dominantPattern} healing during sleep`,
          score: totalScore
        });
      }
    }
  });
  
  return { breakfast, lunch, dinner };
}

// ===== MODERN BALANCING (using Nutritional Science) =====
function balanceModern(userProfile = { constitution: 'vata-like', needs: ['digestion', 'energy'] }) {
  // Map constitution to nutritional needs
  const needs = {
    'vata-like': { calories: 'moderate', fat: 'moderate', protein: 'high', fiber: 'moderate' },
    'pitta-like': { calories: 'moderate', fat: 'low', protein: 'moderate', fiber: 'high' },
    'kapha-like': { calories: 'low', fat: 'low', protein: 'moderate', fiber: 'high' }
  };
  
  const profile = needs[userProfile.constitution] || needs['vata-like'];
  
  function scoreFoodForModern(food) {
    let score = 0;
    
    if (food.health_conditions.digestive_issues > 1) score += 8;
    
    // Fat requirements
    if (profile.fat === 'moderate' && food.fat > 2 && food.fat < 15) score += 5;
    if (profile.fat === 'low' && food.fat < 8) score += 8;
    
    // Protein needs
    if (profile.protein === 'high' && food.protein > 7) score += 6;
    if (profile.protein === 'moderate' && food.protein > 4) score += 4;
    
    // Fiber needs
    if (profile.fiber === 'high' && food.fiber > 2) score += 5;
    
    // Calorie appropriateness
    if (profile.calories === 'low' && food.calories < 150) score += 5;
    if (profile.calories === 'moderate' && food.calories < 300) score += 3;
    
    return score;
  }
  
  const breakfast = [];
  mealCombinations.breakfast.forEach((meal, idx) => {
    const mainFood = databases.modern.find(f => f.food_name === meal.main);
    const sideFood = databases.modern.find(f => f.food_name === meal.side);
    const beverageFood = databases.modern.find(f => f.food_name === meal.beverage);
    
    if (mainFood && sideFood && beverageFood) {
      const totalScore = scoreFoodForModern(mainFood) + scoreFoodForModern(sideFood) + scoreFoodForModern(beverageFood);
      if (totalScore > 5) {
        breakfast.push({
          meal: [meal.main, meal.side, meal.beverage],
          reason: `${meal.main} (${mainFood.calories}cal, ${mainFood.protein}g protein) + ${meal.side} optimized for ${userProfile.constitution} needs. Health boost: Digestive issues ${mainFood.health_conditions.digestive_issues}`,
          score: totalScore
        });
      }
    }
  });
  
  const lunch = [];
  mealCombinations.lunch.forEach((meal, idx) => {
    const grainFood = databases.modern.find(f => f.food_name === meal.grain);
    const proteinFood = databases.modern.find(f => f.food_name === meal.protein);
    const vegFood = databases.modern.find(f => f.food_name === meal.vegetable);
    
    if (grainFood && proteinFood && vegFood) {
      const totalScore = scoreFoodForModern(grainFood) + scoreFoodForModern(proteinFood) + scoreFoodForModern(vegFood);
      if (totalScore > 5) {
        lunch.push({
          meal: [meal.grain, meal.protein, meal.vegetable, meal.digestive],
          reason: `Balanced nutrition: ${meal.grain} (carbs) + ${meal.protein} (${proteinFood.protein}g protein, ${proteinFood.fat}g fat) + ${meal.vegetable} (fiber). Macros optimized for ${userProfile.constitution}`,
          score: totalScore
        });
      }
    }
  });
  
  const dinner = [];
  mealCombinations.dinner.forEach((meal, idx) => {
    const mainFood = databases.modern.find(f => f.food_name === meal.main);
    const sideFood = databases.modern.find(f => f.food_name === meal.side && meal.side !== 'Optional');
    
    if (mainFood && sideFood) {
      const totalScore = scoreFoodForModern(mainFood) + scoreFoodForModern(sideFood);
      if (totalScore > 2) {
        dinner.push({
          meal: [meal.main, meal.side],
          reason: `Light dinner (${mainFood.calories}cal, ${mainFood.fat}g fat) supports sleep quality and digestion. Glycemic index: ${mainFood.glycemic_index}`,
          score: totalScore
        });
      }
    }
  });
  
  return { breakfast, lunch, dinner };
}

// Main function
function generateFrameworkBalancedMeals(
  ayurvedaDosha = { vata: 0.6, pitta: 0.3, kapha: 0.1 },
  unaniHumor = { dam: 0.25, safra: 0.25, balgham: 0.25, sauda: 0.25 },
  tcmPattern = { qi_deficiency: 0.4, heat: 0.3, dampness: 0.3 },
  modernProfile = { constitution: 'vata-like', needs: ['digestion', 'energy'] }
) {
  const result = {
    frameworks: {
      ayurveda: {
        system: 'Dosha (Vata/Pitta/Kapha)',
        user_constitution: ayurvedaDosha,
        dominant: Object.keys(ayurvedaDosha).reduce((a, b) => ayurvedaDosha[a] > ayurvedaDosha[b] ? a : b),
        meals: balanceAyurveda(ayurvedaDosha)
      },
      unani: {
        system: 'Humors (Dam/Safra/Balgham/Sauda)',
        user_constitution: unaniHumor,
        dominant: Object.keys(unaniHumor).reduce((a, b) => unaniHumor[a] > unaniHumor[b] ? a : b),
        meals: balanceUnani(unaniHumor)
      },
      tcm: {
        system: 'Patterns (Qi/Heat/Dampness/Blood)',
        user_constitution: tcmPattern,
        dominant: Object.keys(tcmPattern).reduce((a, b) => tcmPattern[a] > tcmPattern[b] ? a : b),
        meals: balanceTCM(tcmPattern)
      },
      modern: {
        system: 'Nutritional Science',
        user_constitution: modernProfile,
        dominant: modernProfile.constitution,
        meals: balanceModern(modernProfile)
      }
    },
    generated_at: new Date().toISOString()
  };
  
  return result;
}

// Execute with sample inputs
const recommendation = generateFrameworkBalancedMeals();

// Save to file
const outputPath = path.join(__dirname, '../data/framework_balanced_meals.json');
fs.writeFileSync(outputPath, JSON.stringify(recommendation, null, 2));

console.log('Framework-balanced meal recommendations generated!');
console.log('\n=== SUMMARY ===');
console.log(`Ayurveda (Vata-dominant): ${recommendation.frameworks.ayurveda.meals.breakfast.length} breakfast options`);
console.log(`Unani: ${recommendation.frameworks.unani.meals.breakfast.length} breakfast options`);
console.log(`TCM: ${recommendation.frameworks.tcm.meals.breakfast.length} breakfast options`);
console.log(`Modern: ${recommendation.frameworks.modern.meals.breakfast.length} breakfast options`);
console.log('\nSample Ayurveda Breakfast:');
console.log(JSON.stringify(recommendation.frameworks.ayurveda.meals.breakfast[0], null, 2));

module.exports = generateFrameworkBalancedMeals;
