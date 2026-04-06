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

// ===== AYURVEDA BALANCING =====
function balanceAyurveda(userDosha) {
  const { vata, pitta, kapha } = userDosha;
  const dominantDosha = Object.keys(userDosha).reduce((a, b) => 
    userDosha[a] > userDosha[b] ? a : b
  );
  
  // Score foods based on dosha balance
  function scoreFoodForDosha(food) {
    let score = 0;
    
    if (dominantDosha === 'vata') {
      // Reduce foods that increase vata (light, dry, cold)
      score -= (food.vata_effect || 0) * 10;
      // Prefer foods that reduce vata (warming, grounding)
      score += (food.pitta_effect || 0) * 3;
      score += (food.kapha_effect || 0) * 2;
    } else if (dominantDosha === 'pitta') {
      // Reduce foods that increase pitta (heating, oily)
      score -= (food.pitta_effect || 0) * 10;
      // Prefer cooling foods
      score += (food.vata_effect || 0) * 2;
      score += (food.kapha_effect || 0) * 3;
    } else if (dominantDosha === 'kapha') {
      // Reduce foods that increase kapha (heavy, oily, moist)
      score -= (food.kapha_effect || 0) * 10;
      // Prefer light, stimulating foods
      score += (food.vata_effect || 0) * 3;
      score += (food.pitta_effect || 0) * 2;
    }
    
    // Digestibility bonus
    score += (food.digestibility_score || 0) * 2;
    
    // Ama reducing bonus
    if (food.ama_forming_potential === 'low') score += 5;
    
    return score;
  }
  
  // Filter breakfast for Ayurveda
  const ayurveda_breakfast = [];
  mealCombinations.breakfast.forEach(meal => {
    const mainFood = databases.ayurveda.find(f => f.food_name === meal.main);
    const sideFood = databases.ayurveda.find(f => f.food_name === meal.side);
    const beverageFood = databases.ayurveda.find(f => f.food_name === meal.beverage);
    
    if (mainFood && sideFood && beverageFood) {
      const mainScore = scoreFoodForDosha(mainFood);
      const sideScore = scoreFoodForDosha(sideFood);
      const bevScore = scoreFoodForDosha(beverageFood);
      
      const totalScore = mainScore + sideScore + bevScore;
      
      if (totalScore > -5) { // Accept if reasonably aligned
        const reason = getReason(dominantDosha, mainFood, sideFood, beverageFood);
        ayurveda_breakfast.push({
          meal: [meal.main, meal.side, meal.beverage],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  // Filter lunch
  const ayurveda_lunch = [];
  mealCombinations.lunch.forEach(meal => {
    const grainFood = databases.ayurveda.find(f => f.food_name === meal.grain);
    const proteinFood = databases.ayurveda.find(f => f.food_name === meal.protein);
    const vegFood = databases.ayurveda.find(f => f.food_name === meal.vegetable);
    
    if (grainFood && proteinFood && vegFood) {
      const grainScore = scoreFoodForDosha(grainFood);
      const proteinScore = scoreFoodForDosha(proteinFood);
      const vegScore = scoreFoodForDosha(vegFood);
      
      const totalScore = grainScore + proteinScore + vegScore;
      
      if (totalScore > -5) {
        const reason = `${meal.grain} (${getDosha(grainFood, dominantDosha)}) + ${meal.protein} (${getDosha(proteinFood, dominantDosha)}) balances ${dominantDosha}`;
        ayurveda_lunch.push({
          meal: [meal.grain, meal.protein, meal.vegetable],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  // Filter dinner
  const ayurveda_dinner = [];
  mealCombinations.dinner.forEach(meal => {
    const mainFood = databases.ayurveda.find(f => f.food_name === meal.main);
    const sideFood = databases.ayurveda.find(f => f.food_name === meal.side && meal.side !== 'Optional');
    
    if (mainFood && sideFood) {
      const mainScore = scoreFoodForDosha(mainFood);
      const sideScore = scoreFoodForDosha(sideFood);
      
      const totalScore = mainScore + sideScore;
      
      if (totalScore > -5) {
        const reason = `Light ${meal.main} with ${meal.side} - reduces ${dominantDosha} aggravation`;
        ayurveda_dinner.push({
          meal: [meal.main, meal.side],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  return { ayurveda_breakfast, ayurveda_lunch, ayurveda_dinner };
}

function getDosha(food, currentDosha) {
  const effects = {
    vata: food.vata_effect || 0,
    pitta: food.pitta_effect || 0,
    kapha: food.kapha_effect || 0
  };
  
  if (effects[currentDosha] < 0) return `balances ${currentDosha}`;
  if (effects[currentDosha] === 0) return `neutral to ${currentDosha}`;
  return `increases ${currentDosha}`;
}

function getReason(dosha, mainFood, sideFood, bevFood) {
  return `${mainFood.food_name} (${mainFood.virya}) + ${sideFood.food_name} + ${bevFood.food_name} supports ${dosha} balance`;
}

// ===== UNANI BALANCING =====
function balanceUnani(userHumor = { dam: 0.25, safra: 0.25, balgham: 0.25, sauda: 0.25 }) {
  const dominantHumor = Object.keys(userHumor).reduce((a, b) => 
    userHumor[a] > userHumor[b] ? a : b
  );
  
  const targetHumor = dominantHumor;
  
  function scoreFoodForUnani(food) {
    let score = 0;
    
    // Reduce foods that increase the dominant humor
    score -= (food.humor_effects[targetHumor] || 0) * 10;
    
    // Prefer foods that balance
    Object.keys(food.humor_effects).forEach(humor => {
      if (humor !== targetHumor) {
        score += (food.humor_effects[humor] || 0) * 2;
      }
    });
    
    // Digestion ease bonus
    if (food.digestion_ease === 'easy') score += 5;
    
    return score;
  }
  
  const unani_breakfast = [];
  mealCombinations.breakfast.forEach(meal => {
    const mainFood = databases.unani.find(f => f.food_name === meal.main);
    const sideFood = databases.unani.find(f => f.food_name === meal.side);
    const beverageFood = databases.unani.find(f => f.food_name === meal.beverage);
    
    if (mainFood && sideFood && beverageFood) {
      const totalScore = scoreFoodForUnani(mainFood) + scoreFoodForUnani(sideFood) + scoreFoodForUnani(beverageFood);
      
      if (totalScore > -5) {
        const reason = `${meal.main} (${mainFood.dominant_humor}) + ${meal.side} + ${meal.beverage} - reduces excess ${dominantHumor} humor`;
        unani_breakfast.push({
          meal: [meal.main, meal.side, meal.beverage],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  const unani_lunch = [];
  mealCombinations.lunch.forEach(meal => {
    const grainFood = databases.unani.find(f => f.food_name === meal.grain);
    const proteinFood = databases.unani.find(f => f.food_name === meal.protein);
    const vegFood = databases.unani.find(f => f.food_name === meal.vegetable);
    
    if (grainFood && proteinFood && vegFood) {
      const totalScore = scoreFoodForUnani(grainFood) + scoreFoodForUnani(proteinFood) + scoreFoodForUnani(vegFood);
      
      if (totalScore > -5) {
        const reason = `Balanced meal: ${meal.grain} + ${meal.protein} reduces excess ${targetHumor}`;
        unani_lunch.push({
          meal: [meal.grain, meal.protein, meal.vegetable],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  const unani_dinner = [];
  mealCombinations.dinner.forEach(meal => {
    const mainFood = databases.unani.find(f => f.food_name === meal.main);
    const sideFood = databases.unani.find(f => f.food_name === meal.side && meal.side !== 'Optional');
    
    if (mainFood && sideFood) {
      const totalScore = scoreFoodForUnani(mainFood) + scoreFoodForUnani(sideFood);
      
      if (totalScore > -5) {
        const reason = `Easy to digest: ${meal.main} + ${meal.side} - balances ${targetHumor}`;
        unani_dinner.push({
          meal: [meal.main, meal.side],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  return { unani_breakfast, unani_lunch, unani_dinner };
}

// ===== TCM BALANCING =====
function balanceTCM(userDosha) {
  const { vata, pitta, kapha } = userDosha;
  const dominantDosha = Object.keys(userDosha).reduce((a, b) => 
    userDosha[a] > userDosha[b] ? a : b
  );
  
  // Map dosha to TCM patterns
  const doshaToPattern = {
    vata: 'qi_deficiency',    // Movement/wind
    pitta: 'heat',             // Fire/heat
    kapha: 'dampness'          // Water/heaviness
  };
  
  const targetPattern = doshaToPattern[dominantDosha];
  
  function scoreFoodForTCM(food) {
    let score = 0;
    
    // Prefer foods that help the target pattern
    score += (food.pattern_effects[targetPattern] || 0) * 10;
    
    // Tonify qi for overall balance
    if (food.qi_effect === 'tonifies') score += 5;
    
    // Thermal nature appropriate for pattern
    if (targetPattern === 'heat' && (food.thermal_nature === 'cool' || food.thermal_nature === 'cold')) {
      score += 8;
    } else if (targetPattern === 'qi_deficiency' && (food.thermal_nature === 'warm' || food.thermal_nature === 'hot')) {
      score += 8;
    } else if (targetPattern === 'dampness' && food.thermal_nature === 'warm') {
      score += 8;
    }
    
    return score;
  }
  
  const tcm_breakfast = [];
  mealCombinations.breakfast.forEach(meal => {
    const mainFood = databases.tcm.find(f => f.food_name === meal.main);
    const sideFood = databases.tcm.find(f => f.food_name === meal.side);
    const beverageFood = databases.tcm.find(f => f.food_name === meal.beverage);
    
    if (mainFood && sideFood && beverageFood) {
      const totalScore = scoreFoodForTCM(mainFood) + scoreFoodForTCM(sideFood) + scoreFoodForTCM(beverageFood);
      
      if (totalScore > 0) {
        const reason = `${meal.main} (${mainFood.thermal_nature}) + ${meal.side} supports TCM pattern balance`;
        tcm_breakfast.push({
          meal: [meal.main, meal.side, meal.beverage],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  const tcm_lunch = [];
  mealCombinations.lunch.forEach(meal => {
    const grainFood = databases.tcm.find(f => f.food_name === meal.grain);
    const proteinFood = databases.tcm.find(f => f.food_name === meal.protein);
    const vegFood = databases.tcm.find(f => f.food_name === meal.vegetable);
    
    if (grainFood && proteinFood && vegFood) {
      const totalScore = scoreFoodForTCM(grainFood) + scoreFoodForTCM(proteinFood) + scoreFoodForTCM(vegFood);
      
      if (totalScore > 0) {
        const reason = `${meal.grain} tonifies + ${meal.protein} balances ${targetPattern} pattern`;
        tcm_lunch.push({
          meal: [meal.grain, meal.protein, meal.vegetable],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  const tcm_dinner = [];
  mealCombinations.dinner.forEach(meal => {
    const mainFood = databases.tcm.find(f => f.food_name === meal.main);
    const sideFood = databases.tcm.find(f => f.food_name === meal.side && meal.side !== 'Optional');
    
    if (mainFood && sideFood) {
      const totalScore = scoreFoodForTCM(mainFood) + scoreFoodForTCM(sideFood);
      
      if (totalScore > 0) {
        const reason = `Light dinner supports ${targetPattern} healing`;
        tcm_dinner.push({
          meal: [meal.main, meal.side],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  return { tcm_breakfast, tcm_lunch, tcm_dinner };
}

// ===== MODERN BALANCING =====
function balanceModern(userDosha) {
  const { vata, pitta, kapha } = userDosha;
  const dominantDosha = Object.keys(userDosha).reduce((a, b) => 
    userDosha[a] > userDosha[b] ? a : b
  );
  
  function scoreFoodForModern(food) {
    let score = 0;
    
    // Base digestibility
    if (food.health_conditions.digestive_issues > 1) score += 8;
    
    if (dominantDosha === 'vata') {
      // Prefer warm, grounding, protein-rich
      if (food.fat > 2 && food.fat < 15) score += 5;
      if (food.protein > 5) score += 4;
      if (food.category === 'grain' || food.category === 'legume') score += 5;
    } else if (dominantDosha === 'pitta') {
      // Prefer cooling, low fat
      if (food.fat < 8) score += 8;
      if (food.category === 'vegetable' || food.category === 'fruit') score += 6;
      if (food.health_conditions.inflammation > 0) score += 5;
    } else if (dominantDosha === 'kapha') {
      // Prefer light, stimulating, low calorie
      if (food.calories < 150) score += 8;
      if (food.fat < 5) score += 8;
      if (food.fiber > 2) score += 5;
    }
    
    return score;
  }
  
  const modern_breakfast = [];
  mealCombinations.breakfast.forEach(meal => {
    const mainFood = databases.modern.find(f => f.food_name === meal.main);
    const sideFood = databases.modern.find(f => f.food_name === meal.side);
    const beverageFood = databases.modern.find(f => f.food_name === meal.beverage);
    
    if (mainFood && sideFood && beverageFood) {
      const totalScore = scoreFoodForModern(mainFood) + scoreFoodForModern(sideFood) + scoreFoodForModern(beverageFood);
      
      if (totalScore > 5) {
        const reason = getDoshaReason(dominantDosha, mainFood, sideFood);
        modern_breakfast.push({
          meal: [meal.main, meal.side, meal.beverage],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  const modern_lunch = [];
  mealCombinations.lunch.forEach(meal => {
    const grainFood = databases.modern.find(f => f.food_name === meal.grain);
    const proteinFood = databases.modern.find(f => f.food_name === meal.protein);
    const vegFood = databases.modern.find(f => f.food_name === meal.vegetable);
    
    if (grainFood && proteinFood && vegFood) {
      const totalScore = scoreFoodForModern(grainFood) + scoreFoodForModern(proteinFood) + scoreFoodForModern(vegFood);
      
      if (totalScore > 5) {
        const reason = `Nutritionally balanced for ${dominantDosha}: ${meal.grain} + ${meal.protein} + ${meal.vegetable}`;
        modern_lunch.push({
          meal: [meal.grain, meal.protein, meal.vegetable],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  const modern_dinner = [];
  mealCombinations.dinner.forEach(meal => {
    const mainFood = databases.modern.find(f => f.food_name === meal.main);
    const sideFood = databases.modern.find(f => f.food_name === meal.side && meal.side !== 'Optional');
    
    if (mainFood && sideFood) {
      const totalScore = scoreFoodForModern(mainFood) + scoreFoodForModern(sideFood);
      
      if (totalScore > 2) {
        const reason = `${dominantDosha} appropriate dinner: low digestive burden, supports ${dominantDosha} needs`;
        modern_dinner.push({
          meal: [meal.main, meal.side],
          reason,
          score: totalScore
        });
      }
    }
  });
  
  return { modern_breakfast, modern_lunch, modern_dinner };
}

function getDoshaReason(dosha, food1, food2) {
  const reasons = {
    vata: `Warm, grounding ${food1.food_name} + ${food2.food_name} stabilizes Vata`,
    pitta: `Cooling ${food1.food_name} + ${food2.food_name} cools Pitta excess`,
    kapha: `Light ${food1.food_name} + ${food2.food_name} stimulates sluggish Kapha`
  };
  return reasons[dosha];
}

// Main function
function generateDoshaBalancedMeals(userDosha = { vata: 0.6, pitta: 0.3, kapha: 0.1 }) {
  const ayurveda = balanceAyurveda(userDosha);
  const unani = balanceUnani(userDosha);
  const tcm = balanceTCM(userDosha);
  const modern = balanceModern(userDosha);
  
  const result = {
    user_dosha: userDosha,
    dominant_dosha: Object.keys(userDosha).reduce((a, b) => userDosha[a] > userDosha[b] ? a : b),
    frameworks: {
      ayurveda,
      unani,
      tcm,
      modern
    },
    generated_at: new Date().toISOString()
  };
  
  return result;
}

// Execute with sample dosha
const sampleDosha = { vata: 0.6, pitta: 0.3, kapha: 0.1 };
const recommendation = generateDoshaBalancedMeals(sampleDosha);

// Save to file
const outputPath = path.join(__dirname, '../data/dosha_balanced_meals.json');
fs.writeFileSync(outputPath, JSON.stringify(recommendation, null, 2));

console.log('Dosha-balanced meal recommendations generated!');
console.log('Sample output for Vata-dominant constitution:');
console.log(JSON.stringify({
  dominant: 'Vata (0.6)',
  ayurveda_breakfast: recommendation.frameworks.ayurveda.ayurveda_breakfast.slice(0, 2),
  unani_lunch: recommendation.frameworks.unani.unani_lunch.slice(0, 2),
  tcm_dinner: recommendation.frameworks.tcm.tcm_dinner.slice(0, 2),
  modern_breakfast: recommendation.frameworks.modern.modern_breakfast.slice(0, 2)
}, null, 2));

module.exports = generateDoshaBalancedMeals;
