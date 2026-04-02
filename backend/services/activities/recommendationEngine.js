/**
 * Activity Recommendation Engine
 * Generates personalized Yoga, Exercise, and Breathing recommendations
 * based on user assessment data (Ayurveda, Unani, TCM, Modern)
 */

// Yoga database for different constitutions/conditions
const yogaDatabaseByFramework = {
  ayurveda: {
    vata: [
      { name: 'Child\'s Pose', displayName: 'Child\'s Pose', duration: '2 min', benefit: 'Calming & Cooling', intensity: 'low' },
      { name: 'Warrior I', displayName: 'Warrior I', duration: '1 min each side', benefit: 'Grounding & Strengthening', intensity: 'medium' },
      { name: 'Mountain Pose', displayName: 'Mountain Pose', duration: '3 min', benefit: 'Grounding & Stability', intensity: 'low' },
      { name: 'Easy Pose', displayName: 'Easy Pose', duration: '5 min', benefit: 'Restorative & Grounding', intensity: 'low' },
      { name: 'Reclining Bound Angle Pose', displayName: 'Reclining Bound Angle Pose', duration: '3 min', benefit: 'Grounding & Stability', intensity: 'low' },
    ],
    pitta: [
      { name: 'Standing Forward Fold', displayName: 'Standing Forward Fold', duration: '5 min', benefit: 'Cooling & Balancing', intensity: 'low' },
      { name: 'Seated Forward Bend', displayName: 'Seated Forward Bend', duration: '3 min', benefit: 'Cooling & Releasing', intensity: 'low' },
      { name: 'Half Lotus Pose', displayName: 'Half Lotus Pose', duration: '2 min', benefit: 'Hip opening', intensity: 'low' },
      { name: 'Tree Pose', displayName: 'Tree Pose', duration: '1 min each side', benefit: 'Balance & Focus', intensity: 'low' },
      { name: 'Corpse Pose', displayName: 'Corpse Pose', duration: '5 min', benefit: 'Rest & Restoration', intensity: 'low' },
    ],
    kapha: [
      { name: 'Chair Pose', displayName: 'Chair Pose', duration: '2 min', benefit: 'Strengthening & Toning', intensity: 'high' },
      { name: 'Warrior II', displayName: 'Warrior II', duration: '1 min each side', benefit: 'Strengthening', intensity: 'high' },
      { name: 'Boat Pose', displayName: 'Boat Pose', duration: '1 min', benefit: 'Core & Strength', intensity: 'high' },
      { name: 'Triangle Pose', displayName: 'Triangle Pose', duration: '1 min each side', benefit: 'Toning & Stretching', intensity: 'medium' },
      { name: 'Locust Pose', displayName: 'Locust Pose', duration: '1 min', benefit: 'Back strength', intensity: 'high' },
    ],
  },
  unani: {
    'Hot-Moist': [
      { name: 'Corpse Pose', displayName: 'Corpse Pose', duration: '5 min', benefit: 'Cooling the body', intensity: 'low' },
      { name: 'Child\'s Pose', displayName: 'Child\'s Pose', duration: '3 min', benefit: 'Calming practice', intensity: 'low' },
      { name: 'Seated Forward Bend', displayName: 'Seated Forward Bend', duration: '3 min', benefit: 'Cooling release', intensity: 'low' },
    ],
    'Hot-Dry': [
      { name: 'Half Lotus Pose', displayName: 'Half Lotus Pose', duration: '3 min', benefit: 'Hip opening', intensity: 'medium' },
      { name: 'Warrior I', displayName: 'Warrior I', duration: '2 min', benefit: 'Grounding flow', intensity: 'medium' },
      { name: 'Mountain Pose', displayName: 'Mountain Pose', duration: '3 min', benefit: 'Centering', intensity: 'low' },
    ],
    'Cold-Moist': [
      { name: 'Warrior II', displayName: 'Warrior II', duration: '2 min', benefit: 'Warmth generation', intensity: 'high' },
      { name: 'Chair Pose', displayName: 'Chair Pose', duration: '2 min', benefit: 'Circulation boost', intensity: 'high' },
      { name: 'Boat Pose', displayName: 'Boat Pose', duration: '1 min', benefit: 'Building strength', intensity: 'medium' },
    ],
    'Cold-Dry': [
      { name: 'Triangle Pose', displayName: 'Triangle Pose', duration: '2 min', benefit: 'Warmth & comfort', intensity: 'high' },
      { name: 'Locust Pose', displayName: 'Locust Pose', duration: '1 min', benefit: 'Heat generation', intensity: 'high' },
      { name: 'Wheel Pose', displayName: 'Wheel Pose', duration: '1 min', benefit: 'Warming opening', intensity: 'high' },
    ],
  },
  tcm: {
    'yin-deficiency': [
      { name: 'Lotus Pose', displayName: 'Lotus Pose', duration: '5 min', benefit: 'Yin restoration', intensity: 'low' },
      { name: 'Seated Forward Bend', displayName: 'Seated Forward Bend', duration: '5 min', benefit: 'Gentle nourishment', intensity: 'low' },
      { name: 'Corpse Pose', displayName: 'Corpse Pose', duration: '5 min', benefit: 'Deep restoration', intensity: 'low' },
    ],
    'yang-deficiency': [
      { name: 'Warrior I', displayName: 'Warrior I', duration: '2 min', benefit: 'Yang enhancement', intensity: 'high' },
      { name: 'Chair Pose', displayName: 'Chair Pose', duration: '2 min', benefit: 'Energy generation', intensity: 'high' },
      { name: 'Locust Pose', displayName: 'Locust Pose', duration: '1 min', benefit: 'Warmth generation', intensity: 'medium' },
    ],
    'qi-stagnation': [
      { name: 'Seated Twist', displayName: 'Seated Twist', duration: '2 min', benefit: 'Qi circulation', intensity: 'medium' },
      { name: 'Half Spinal Twist', displayName: 'Half Spinal Twist', duration: '2 min', benefit: 'Meridian stimulation', intensity: 'medium' },
      { name: 'Revolved Triangle', displayName: 'Revolved Triangle', duration: '1 min', benefit: 'Movement & flow', intensity: 'medium' },
    ],
  },
  modern: {
    normal_weight: [
      { name: 'Warrior II', displayName: 'Warrior II Flow', duration: '3 min', benefit: 'Full body wellness', intensity: 'medium' },
      { name: 'Triangle Pose', displayName: 'Triangle Pose', duration: '2 min', benefit: 'Mobility & ease', intensity: 'low' },
      { name: 'Mountain Pose', displayName: 'Mountain Pose', duration: '2 min', benefit: 'Mind-body connection', intensity: 'low' },
    ],
    overweight: [
      { name: 'Chair Pose', displayName: 'Chair Pose', duration: '2 min', benefit: 'Calorie burn', intensity: 'high' },
      { name: 'Boat Pose', displayName: 'Boat Pose', duration: '1 min', benefit: 'Muscle engagement', intensity: 'high' },
      { name: 'Locust Pose', displayName: 'Locust Pose', duration: '1 min', benefit: 'Cardiovascular health', intensity: 'high' },
    ],
    underweight: [
      { name: 'Child\'s Pose', displayName: 'Child\'s Pose', duration: '3 min', benefit: 'Gentle awakening', intensity: 'low' },
      { name: 'Easy Pose', displayName: 'Easy Pose', duration: '5 min', benefit: 'Restoration', intensity: 'low' },
      { name: 'Corpse Pose', displayName: 'Corpse Pose', duration: '5 min', benefit: 'Stability & ease', intensity: 'low' },
    ],
  },
};

const exerciseDatabaseByFramework = {
  ayurveda: {
    vata: [
      { name: 'Walking', displayName: 'Gentle Walk', duration: '20 min', intensity: 'low', benefit: 'Grounding & circulation' },
      { name: 'Tai Chi', displayName: 'Tai Chi', duration: '30 min', intensity: 'low', benefit: 'Balance & flow' },
      { name: 'Pilates', displayName: 'Mild Pilates', duration: '20 min', intensity: 'low', benefit: 'Core stability' },
    ],
    pitta: [
      { name: 'Swimming', displayName: 'Swimming', duration: '30 min', intensity: 'medium', benefit: 'Cooling & endurance' },
      { name: 'Cycling', displayName: 'Cycling', duration: '30 min', intensity: 'medium', benefit: 'Cardio & cooling' },
      { name: 'Water Aerobics', displayName: 'Water Aerobics', duration: '25 min', intensity: 'medium', benefit: 'Low-impact cardio' },
    ],
    kapha: [
      { name: 'Jogging', displayName: 'Jogging', duration: '30 min', intensity: 'high', benefit: 'Metabolism & vigor' },
      { name: 'HIIT Training', displayName: 'HIIT Training', duration: '20 min', intensity: 'high', benefit: 'Calorie burn' },
      { name: 'Strength Training', displayName: 'Strength Training', duration: '30 min', intensity: 'high', benefit: 'Muscle building' },
    ],
  },
  unani: {
    'Hot-Moist': [
      { name: 'Light Activity', displayName: 'Light Activity', duration: '20 min', intensity: 'low', benefit: 'Cooling movement' },
      { name: 'Leisurely Walk', displayName: 'Leisurely Walk', duration: '25 min', intensity: 'low', benefit: 'Gentle circulation' },
    ],
    'Hot-Dry': [
      { name: 'Moderate Exercise', displayName: 'Moderate Exercise', duration: '25 min', intensity: 'medium', benefit: 'Balanced exertion' },
      { name: 'Swimming', displayName: 'Swimming', duration: '30 min', intensity: 'medium', benefit: 'Moisture & coolness' },
    ],
    'Cold-Moist': [
      { name: 'Energetic Exercise', displayName: 'Energetic Exercise', duration: '30 min', intensity: 'high', benefit: 'Warmth generation' },
      { name: 'Brisk Walking', displayName: 'Brisk Walking', duration: '30 min', intensity: 'high', benefit: 'Heat & circulation' },
    ],
    'Cold-Dry': [
      { name: 'Vigorous Activity', displayName: 'Vigorous Activity', duration: '35 min', intensity: 'high', benefit: 'Heat & moisture' },
      { name: 'Dynamic Exercise', displayName: 'Dynamic Exercise', duration: '30 min', intensity: 'high', benefit: 'Warmth & energy' },
    ],
  },
  tcm: {
    'yin-deficiency': [
      { name: 'Gentle Movement', displayName: 'Gentle Movement', duration: '20 min', intensity: 'low', benefit: 'Yin nourishment' },
      { name: 'Tai Chi', displayName: 'Tai Chi', duration: '30 min', intensity: 'low', benefit: 'Yin cultivation' },
    ],
    'yang-deficiency': [
      { name: 'Vigorous Exercise', displayName: 'Vigorous Exercise', duration: '30 min', intensity: 'high', benefit: 'Yang building' },
      { name: 'Power Training', displayName: 'Power Training', duration: '30 min', intensity: 'high', benefit: 'Energy boost' },
    ],
    'qi-stagnation': [
      { name: 'Flowing Movement', displayName: 'Flowing Movement', duration: '25 min', intensity: 'medium', benefit: 'Qi circulation' },
      { name: 'Dance', displayName: 'Dance', duration: '30 min', intensity: 'medium', benefit: 'Energy movement' },
    ],
  },
  modern: {
    normal_weight: [
      { name: 'Cardio', displayName: 'Moderate Cardio', duration: '30 min', intensity: 'medium', benefit: 'Heart health' },
      { name: 'Strength', displayName: 'Strength Training', duration: '30 min', intensity: 'medium', benefit: 'Muscle tone' },
    ],
    overweight: [
      { name: 'High Cardio', displayName: 'High Intensity Cardio', duration: '35 min', intensity: 'high', benefit: 'Weight management' },
      { name: 'Resistance', displayName: 'Resistance Training', duration: '30 min', intensity: 'high', benefit: 'Calorie burn' },
    ],
    underweight: [
      { name: 'Mild Cardio', displayName: 'Mild Cardio', duration: '20 min', intensity: 'low', benefit: 'Circulation' },
      { name: 'Weight Gain', displayName: 'Strength Building', duration: '25 min', intensity: 'low', benefit: 'Muscle building' },
    ],
  },
};

const breathingDatabaseByFramework = {
  ayurveda: {
    vata: [
      { name: 'Nadi Shodhana', displayName: 'Nadi Shodhana (Alternate Nostril Breathing)', duration: '5 min', benefit: 'Balancing & grounding', intensity: 'low' },
      { name: 'Basic Pranayama', displayName: 'Basic Pranayama', duration: '3 min', benefit: 'Calming', intensity: 'low' },
      { name: 'Extended Exhale', displayName: 'Extended Exhale Breathing', duration: '5 min', benefit: 'Relaxation', intensity: 'low' },
    ],
    pitta: [
      { name: 'Sitali Pranayama', displayName: 'Sitali Pranayama (Cooling Breath)', duration: '5 min', benefit: 'Cooling & calming', intensity: 'low' },
      { name: 'Sitkari Breath', displayName: 'Sitkari Breath', duration: '4 min', benefit: 'Heat reduction', intensity: 'low' },
      { name: 'Moon Breathing', displayName: 'Moon Breathing (Left Nostril)', duration: '5 min', benefit: 'Cooling', intensity: 'low' },
    ],
    kapha: [
      { name: 'Breath of Fire', displayName: 'Breath of Fire (Kapalabhati)', duration: '5 min', benefit: 'Energizing & clearing', intensity: 'high' },
      { name: 'Sun Breathing', displayName: 'Sun Breathing (Right Nostril)', duration: '5 min', benefit: 'Warming & activation', intensity: 'medium' },
      { name: 'Ujjayi Breath', displayName: 'Ujjayi Breath (Ocean Sound)', duration: '5 min', benefit: 'Energizing', intensity: 'medium' },
    ],
  },
  unani: {
    'Hot-Moist': [
      { name: 'Cooling Breath', displayName: 'Cooling Breath Technique', duration: '5 min', benefit: 'Temperature balance', intensity: 'low' },
      { name: 'Relaxation Breath', displayName: 'Relaxation Breathing', duration: '5 min', benefit: 'Calming', intensity: 'low' },
    ],
    'Hot-Dry': [
      { name: 'Balanced Breath', displayName: 'Balanced Breathing', duration: '5 min', benefit: 'Moisture & cool', intensity: 'low' },
      { name: 'Deep Breathing', displayName: 'Deep Breathing', duration: '5 min', benefit: 'Moisture induction', intensity: 'low' },
    ],
    'Cold-Moist': [
      { name: 'Warming Breath', displayName: 'Warming Breath Technique', duration: '5 min', benefit: 'Heat generation', intensity: 'medium' },
      { name: 'Activating Breath', displayName: 'Activating Breathing', duration: '5 min', benefit: 'Warmth', intensity: 'medium' },
    ],
    'Cold-Dry': [
      { name: 'Vigorous Breath', displayName: 'Vigorous Breathing', duration: '5 min', benefit: 'Warming & moisture', intensity: 'high' },
      { name: 'Dynamic Breath', displayName: 'Dynamic Breathing', duration: '5 min', benefit: 'Heat & energy', intensity: 'high' },
    ],
  },
  tcm: {
    'yin-deficiency': [
      { name: 'Nourishing Breath', displayName: 'Nourishing Breath', duration: '8 min', benefit: 'Yin restoration', intensity: 'low' },
      { name: 'Gentle Breathing', displayName: 'Gentle Breathing', duration: '6 min', benefit: 'Yin nourishment', intensity: 'low' },
    ],
    'yang-deficiency': [
      { name: 'Energizing Breath', displayName: 'Energizing Breath', duration: '5 min', benefit: 'Yang building', intensity: 'high' },
      { name: 'Vigorous Breathing', displayName: 'Vigorous Breathing', duration: '5 min', benefit: 'Yang activation', intensity: 'high' },
    ],
    'qi-stagnation': [
      { name: 'Flowing Breath', displayName: 'Flowing Breath', duration: '6 min', benefit: 'Qi movement', intensity: 'medium' },
      { name: 'Rhythmic Breathing', displayName: 'Rhythmic Breathing', duration: '6 min', benefit: 'Qi circulation', intensity: 'medium' },
    ],
  },
  modern: {
    normal_weight: [
      { name: 'Box Breathing', displayName: 'Box Breathing', duration: '5 min', benefit: 'Stress management', intensity: 'low' },
      { name: 'Deep Breathing', displayName: 'Deep Breathing', duration: '5 min', benefit: 'Relaxation', intensity: 'low' },
    ],
    overweight: [
      { name: 'Energizing Breath', displayName: 'Energizing Breath', duration: '5 min', benefit: 'Energy boost', intensity: 'medium' },
      { name: 'Rhythmic Breathing', displayName: 'Rhythmic Breathing', duration: '5 min', benefit: 'Focus', intensity: 'medium' },
    ],
    underweight: [
      { name: 'Gentle Breathing', displayName: 'Gentle Breathing', duration: '5 min', benefit: 'Calming', intensity: 'low' },
      { name: 'Extended Breathwork', displayName: 'Extended Breathwork', duration: '6 min', benefit: 'Relaxation', intensity: 'low' },
    ],
  },
};

/**
 * Generate recommendations based on user assessment
 * @param {Object} assessment - User's latest assessment
 * @param {Object} user - User profile data
 * @returns {Object} Recommendations with yoga, exercise, breathing
 */
function generateRecommendations(assessment, user = {}) {
  if (!assessment) {
    return getDefaultRecommendations();
  }

  const framework = assessment.framework;

  // Determine the constitution key based on framework
  let constitutionKey = getConstitutionKey(assessment, framework);

  // Get recommendations based on framework and constitution
  let yoga = [];
  let exercise = [];
  let breathing = [];

  if (framework === 'ayurveda' && yogaDatabaseByFramework.ayurveda[constitutionKey]) {
    yoga = yogaDatabaseByFramework.ayurveda[constitutionKey];
    exercise = exerciseDatabaseByFramework.ayurveda[constitutionKey];
    breathing = breathingDatabaseByFramework.ayurveda[constitutionKey];
  } else if (framework === 'unani' && yogaDatabaseByFramework.unani[constitutionKey]) {
    yoga = yogaDatabaseByFramework.unani[constitutionKey];
    exercise = exerciseDatabaseByFramework.unani[constitutionKey];
    breathing = breathingDatabaseByFramework.unani[constitutionKey];
  } else if (framework === 'tcm' && yogaDatabaseByFramework.tcm[constitutionKey]) {
    yoga = yogaDatabaseByFramework.tcm[constitutionKey];
    exercise = exerciseDatabaseByFramework.tcm[constitutionKey];
    breathing = breathingDatabaseByFramework.tcm[constitutionKey];
  } else if (framework === 'modern' && yogaDatabaseByFramework.modern[constitutionKey]) {
    yoga = yogaDatabaseByFramework.modern[constitutionKey];
    exercise = exerciseDatabaseByFramework.modern[constitutionKey];
    breathing = breathingDatabaseByFramework.modern[constitutionKey];
  } else {
    return getDefaultRecommendations();
  }

  // Shuffle recommendations to add variety
  yoga = shuffleArray(yoga).slice(0, 3);
  exercise = shuffleArray(exercise).slice(0, 3);
  breathing = shuffleArray(breathing).slice(0, 3);

  return {
    yoga,
    exercise,
    breathing,
    framework,
    constitution: constitutionKey,
    generatedAt: new Date(),
  };
}

/**
 * Extract constitution key from assessment
 * @param {Object} assessment - The assessment object
 * @param {string} framework - The framework type
 * @returns {string} Constitution key
 */
function getConstitutionKey(assessment, framework) {
  if (framework === 'ayurveda') {
    // Use vikriti (current state) if available, else prakriti (constitutional)
    const vikriti = assessment.scores?.vikriti;
    if (vikriti?.dominant) return vikriti.dominant.toLowerCase();
    
    const prakriti = assessment.scores?.prakriti;
    if (prakriti?.primary) return prakriti.primary.toLowerCase();
    
    return 'vata'; // Default
  } else if (framework === 'unani') {
    const mizaj = assessment.scores?.primary_mizaj || assessment.scores?.mizaj || 'Hot-Moist';
    return mizaj;
  } else if (framework === 'tcm') {
    const pattern = assessment.scores?.primary_pattern || 'yin-deficiency';
    return pattern.toLowerCase();
  } else if (framework === 'modern') {
    // For modern framework, use BMI category
    const bmi = assessment.scores?.bmi || 22;
    if (bmi < 18.5) return 'underweight';
    if (bmi >= 25 && bmi < 30) return 'overweight';
    return 'normal_weight';
  }
  return 'vata';
}

/**
 * Utility: Get default recommendations
 */
function getDefaultRecommendations() {
  return {
    yoga: yogaDatabaseByFramework.ayurveda.vata,
    exercise: exerciseDatabaseByFramework.ayurveda.vata,
    breathing: breathingDatabaseByFramework.ayurveda.vata,
    framework: 'ayurveda',
    constitution: 'vata',
    generatedAt: new Date(),
  };
}

/**
 * Utility: Shuffle array
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = {
  generateRecommendations,
  getConstitutionKey,
  getDefaultRecommendations,
};
