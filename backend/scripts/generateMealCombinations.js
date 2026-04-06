const fs = require('fs');
const path = require('path');

// Read food database
const foodDatabase = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../data/modern_food_constitution.json'),
  'utf8'
));

// Calculate digestibility score
function calculateDigestibilityScore(food) {
  let score = 0;
  
  // Health conditions for digestive issues (higher is better)
  score += (food.health_conditions.digestive_issues || 0) * 15;
  
  // Fiber content (higher is better)
  score += (food.fiber || 0) * 5;
  
  // Fat penalization (lower fat is better, especially for breakfast/dinner)
  score -= (food.fat || 0) * 2;
  
  // Preparation method scoring
  const prep = food.preparation_methods[0]?.toLowerCase() || '';
  if (prep.includes('steamed') || prep.includes('fermented') || prep.includes('boiled')) {
    score += 20;
  } else if (prep.includes('roasted') || prep.includes('grilled')) {
    score += 10;
  } else if (prep.includes('fried')) {
    score -= 25;
  }
  
  // Glycemic index (lower is better for balanced meals)
  if (food.glycemic_index && food.glycemic_index > 0) {
    score -= (food.glycemic_index - 50) * 0.5;
  }
  
  return score;
}

// Check if two foods have incompatible combinations
function areCompatible(food1, food2) {
  // No dairy + meat
  if ((food1.category === 'dairy' && food2.category === 'meat') ||
      (food1.category === 'meat' && food2.category === 'dairy')) {
    return false;
  }
  
  // Multiple fruits together is okay (just one per meal is preferred)
  // Raw + heavy: fruit/raw salad + heavy curry
  if ((food1.preparation_methods.includes('raw') && food2.fat > 15) ||
      (food2.preparation_methods.includes('raw') && food1.fat > 15)) {
    return false;
  }
  
  return true;
}

// Group foods by category and meal type
function groupFoodsByCategory() {
  const groups = {
    breakfast_mains: [],
    breakfast_sides: [],
    breakfast_beverages: [],
    lunch_grains: [],
    lunch_proteins: [],
    lunch_vegetables: [],
    lunch_digestives: [],
    dinner_light_mains: [],
    dinner_sides: []
  };
  
  foodDatabase.forEach(food => {
    const { category, role, meal_type, health_conditions, fat, protein } = food;
    
    // Breakfast
    if (meal_type.includes('breakfast')) {
      if (role === 'main' && category !== 'meat') {
        groups.breakfast_mains.push(food);
      }
      if (role === 'side' && category !== 'meat') {
        groups.breakfast_sides.push(food);
      }
      if (role === 'beverage') {
        groups.breakfast_beverages.push(food);
      }
    }
    
    // Lunch
    if (meal_type.includes('lunch')) {
      if (category === 'grain' && role === 'main') {
        groups.lunch_grains.push(food);
      }
      if (category === 'meat' || (category === 'legume' && protein > 7)) {
        groups.lunch_proteins.push(food);
      }
      if (category === 'vegetable') {
        groups.lunch_vegetables.push(food);
      }
      if ((category === 'legume' && role === 'main' && protein > 8) || 
          (category === 'dairy' && health_conditions.digestive_issues > 0)) {
        groups.lunch_digestives.push(food);
      }
    }
    
    // Dinner (light, low fat, easy to digest)
    if (meal_type.includes('dinner')) {
      if (fat < 8 && health_conditions.digestive_issues >= 1) {
        if (role === 'main') {
          groups.dinner_light_mains.push(food);
        }
      }
      if (role === 'side' && category === 'vegetable') {
        groups.dinner_sides.push(food);
      }
    }
  });
  
  return groups;
}

// Generate breakfast combinations
function generateBreakfastCombinations(groups) {
  const combinations = [];
  const maxCombinations = 5;
  const usedMains = new Set();
  
  groups.breakfast_mains.forEach(main => {
    if (usedMains.has(main.food_name) || combinations.length >= maxCombinations) return;
    
    const compatibleSides = groups.breakfast_sides.filter(side => 
      areCompatible(main, side)
    );
    
    if (compatibleSides.length > 0) {
      const side = compatibleSides[Math.floor(Math.random() * compatibleSides.length)];
      const beverage = groups.breakfast_beverages[Math.floor(Math.random() * groups.breakfast_beverages.length)];
      
      combinations.push({
        main: main.food_name,
        side: side.food_name,
        beverage: beverage.food_name,
        rationale: `${main.therapeutic_use} + ${side.therapeutic_use}. ${beverage.therapeutic_use}`
      });
      
      usedMains.add(main.food_name);
    }
  });
  
  return combinations;
}

// Generate lunch combinations
function generateLunchCombinations(groups) {
  const combinations = [];
  const maxCombinations = 5;
  const usedCombos = new Set();
  
  groups.lunch_grains.forEach(grain => {
    if (combinations.length >= maxCombinations) return;
    
    const compatibleProteins = groups.lunch_proteins.filter(protein => 
      areCompatible(grain, protein)
    );
    
    if (compatibleProteins.length > 0) {
      const protein = compatibleProteins[Math.floor(Math.random() * compatibleProteins.length)];
      const vegetable = groups.lunch_vegetables[Math.floor(Math.random() * groups.lunch_vegetables.length)];
      const digestive = groups.lunch_digestives.filter(dig => 
        areCompatible(protein, dig)
      )[0] || groups.lunch_digestives[0];
      
      const comboKey = `${grain.food_name}-${protein.food_name}-${vegetable.food_name}`;
      
      if (!usedCombos.has(comboKey)) {
        combinations.push({
          grain: grain.food_name,
          protein: protein.food_name,
          vegetable: vegetable.food_name,
          digestive: digestive.food_name,
          rationale: `Complete meal: ${grain.food_name} (carbs) + ${protein.food_name} (protein) + ${vegetable.food_name} (fiber) + ${digestive.food_name} (digestion support)`
        });
        
        usedCombos.add(comboKey);
      }
    }
  });
  
  return combinations;
}

// Generate dinner combinations
function generateDinnerCombinations(groups) {
  const combinations = [];
  const maxCombinations = 5;
  const usedMains = new Set();
  
  // Filter for truly light and digestible dinners
  const lightMains = groups.dinner_light_mains.filter(food => 
    food.fat < 8 && food.health_conditions.digestive_issues >= 1
  );
  
  lightMains.forEach(main => {
    if (usedMains.has(main.food_name) || combinations.length >= maxCombinations) return;
    
    const compatibleSides = groups.dinner_sides.filter(side => 
      areCompatible(main, side) && side.fat < 5
    );
    
    const side = compatibleSides.length > 0 
      ? compatibleSides[Math.floor(Math.random() * compatibleSides.length)]
      : null;
    
    combinations.push({
      main: main.food_name,
      side: side ? side.food_name : 'Optional',
      rationale: `Light dinner: ${main.therapeutic_use}${side ? ` with ${side.food_name} for fiber` : ''}`
    });
    
    usedMains.add(main.food_name);
  });
  
  return combinations;
}

// Main function
function generateMealCombinations() {
  const groups = groupFoodsByCategory();
  
  const mealCombinations = {
    breakfast: generateBreakfastCombinations(groups),
    lunch: generateLunchCombinations(groups),
    dinner: generateDinnerCombinations(groups),
    metadata: {
      total_foods: foodDatabase.length,
      generated_at: new Date().toISOString(),
      breakfast_count: generateBreakfastCombinations(groups).length,
      lunch_count: generateLunchCombinations(groups).length,
      dinner_count: generateDinnerCombinations(groups).length
    }
  };
  
  return mealCombinations;
}

// Generate and output
const mealPlan = generateMealCombinations();

// Output to file
const outputPath = path.join(__dirname, '../data/generated_meal_combinations.json');
fs.writeFileSync(outputPath, JSON.stringify(mealPlan, null, 2));

console.log('Meal combinations generated successfully!');
console.log(JSON.stringify(mealPlan, null, 2));

module.exports = generateMealCombinations;
