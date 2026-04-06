const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

const frameworks = {
  'Ayurveda': 'ayurveda_food_constitution.json',
  'TCM': 'tcm_food_constitution.json',
  'Modern Nutrition': 'modern_food_constitution.json',
  'Unani': 'unani_food_constitution.json'
};

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║          CURRENT MEAL DISTRIBUTION BY FRAMEWORK           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

Object.entries(frameworks).forEach(([name, file]) => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  
  const breakfast = data.filter(f => f.meal_type && f.meal_type.includes('breakfast'));
  const lunch = data.filter(f => f.meal_type && f.meal_type.includes('lunch'));
  const dinner = data.filter(f => f.meal_type && f.meal_type.includes('dinner'));
  
  const total = data.length;
  const untagged = total - breakfast.length - lunch.length - dinner.length;
  
  console.log(`${name}:`);
  console.log(`  Breakfast: ${breakfast.length} items`);
  console.log(`  Lunch:     ${lunch.length} items`);
  console.log(`  Dinner:    ${dinner.length} items`);
  console.log(`  Untagged:  ${untagged} items`);
  console.log(`  ─────────────────────`);
  console.log(`  TOTAL:     ${total} items`);
  console.log('');
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                      SUMMARY TABLE                        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Framework          │ Breakfast │  Lunch  │ Dinner  │ Total');
console.log('─'.repeat(65));

Object.entries(frameworks).forEach(([name, file]) => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  const b = data.filter(f => f.meal_type && f.meal_type.includes('breakfast')).length;
  const l = data.filter(f => f.meal_type && f.meal_type.includes('lunch')).length;
  const d = data.filter(f => f.meal_type && f.meal_type.includes('dinner')).length;
  const total = data.length;
  
  console.log(`${name.padEnd(18)}│${String(b).padStart(10)}│${String(l).padStart(8)}│${String(d).padStart(8)}│${String(total).padStart(6)}`);
});

console.log('\n');
