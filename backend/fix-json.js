const fs = require('fs');

try {
  let data = fs.readFileSync('./data/yoga_poses.json', 'utf8');
  const sizeBefore = data.length;
  console.log('File size before:', sizeBefore);
  
  // Fix: Add missing comma after imagePath (handle various newline types)
  data = data.replace(
    /("imagePath": "\/images\/yoga\/Garudasana \(Eagle Pose\)\.png")(\r?\n\s*"benefits")/,
    '$1,$2'
  );
  
  fs.writeFileSync('./data/yoga_poses.json', data);
  console.log('File size after:', data.length);
  console.log('Bytes changed:', data.length - sizeBefore);
  
  // Verify JSON is valid now
  JSON.parse(data);
  console.log('✅ JSON is now valid!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
