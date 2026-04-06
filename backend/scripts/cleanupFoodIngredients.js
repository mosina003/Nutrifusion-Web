/**
 * Remove pure ingredients (oils, spices) from food frameworks
 * These should not appear as separate meal items
 */

const fs = require('fs');
const path = require('path');

const frameworks = [
  { file: 'ayurveda_food_constitution.json', name: 'Ayurveda' },
  { file: 'tcm_food_constitution.json', name: 'TCM' },
  { file: 'unani_food_constitution.json', name: 'Unani' },
  { file: 'modern_food_constitution.json', name: 'Modern' }
];

const INGREDIENTS_TO_REMOVE = ['spice', 'oil', 'condiment', 'ingredient'];

frameworks.forEach(framework => {
  const filePath = path.join(__dirname, `../data/${framework.file}`);
  
  console.log(`\n📄 Processing ${framework.name}...`);
  
  try {
    // Read the file
    const data = fs.readFileSync(filePath, 'utf8');
    const foods = JSON.parse(data);
    
    console.log(`   Total foods before: ${foods.length}`);
    
    // Filter out ingredients
    const filtered = foods.filter(food => {
      const category = (food.category || '').toLowerCase();
      return !INGREDIENTS_TO_REMOVE.includes(category);
    });
    
    const removed = foods.length - filtered.length;
    console.log(`   Removed: ${removed} (spices, oils, condiments)`);
    console.log(`   Total foods after: ${filtered.length}`);
    
    // Write back
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf8');
    
    // Show what was removed
    const removedItems = foods.filter(food => {
      const category = (food.category || '').toLowerCase();
      return INGREDIENTS_TO_REMOVE.includes(category);
    });
    
    if (removedItems.length > 0) {
      console.log(`   ✅ Removed items:`);
      removedItems.forEach(item => {
        console.log(`      - ${item.food_name} (${item.category})`);
      });
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${framework.name}:`, error.message);
  }
});

console.log('\n✨ Cleanup complete!');
