const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/data/ayurveda_food_constitution.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('\n🔍 CHECKING COMPOUND FOOD CATEGORIES\n');

const compounds = data.filter(f => 
  f.food_name.includes('Khichdi') || 
  f.food_name.includes('Millet') || 
  f.food_name.includes('Oats') ||
  f.food_name.includes('Upma')
);

compounds.forEach(f => {
  console.log(`${f.food_name}`);
  console.log(`  Category: ${f.category}`);
  console.log(`  Meal Type: ${JSON.stringify(f.meal_type)}`);
  console.log('');
});

// Check for duplicate items in single meal
console.log('\n📊 CHECKING LUNCH ITEMS (looking for duplicates)\n');

const lunchFoods = data.filter(f => f.meal_type && f.meal_type.includes('lunch'));
console.log(`Total lunch foods: ${lunchFoods.length}`);

// Find foods with similar names (potential duplicates)
const groupedByName = {};
lunchFoods.forEach(f => {
  const base = f.food_name.split('(')[0].trim();
  if (!groupedByName[base]) groupedByName[base] = [];
  groupedByName[base].push(f);
});

Object.entries(groupedByName).forEach(([name, items]) => {
  if (items.length > 1) {
    console.log(`\n⚠️ DUPLICATE FOUND: "${name}"`);
    items.forEach(item => {
      console.log(`  - ${item.food_name} (${item.category})`);
    });
  }
});
