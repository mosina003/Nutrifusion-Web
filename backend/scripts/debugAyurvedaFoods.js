const fs = require('fs');
const foods = JSON.parse(fs.readFileSync('./data/ayurveda_food_constitution.json', 'utf8'));

console.log('Sample foods:\n');
foods.slice(0, 10).forEach(f => {
  console.log(`${f.food_name}: digestibility=${f.digestibility_score}, ama=${f.ama_forming_potential}, role=${f.role}, guna=${JSON.stringify(f.guna)}`);
});

console.log('\n\nBreakfast suitable foods:\n');
const breakfast = foods.filter(f => {
  const dig = f.digestibility_score || 3;
  const ama = f.ama_forming_potential !== 'high';
  const guna = !(f.guna && (f.guna.includes('Heavy') || f.guna.includes('Oily')));
  return dig <= 3 && ama && guna;
});
console.log(`Total: ${breakfast.length}\n`);
breakfast.slice(0, 15).forEach(f => {
  console.log(`  • ${f.food_name} (digestibility=${f.digestibility_score}, guna=${f.guna})`);
});

console.log('\n\nAll categories in foods:\n');
const categories = new Set(foods.map(f => f.category));
console.log(Array.from(categories));

console.log('\n\nBeverage foods:\n');
const beverages = foods.filter(f => f.category === 'Beverage');
beverages.forEach(f => {
  console.log(`  • ${f.food_name}`);
});
