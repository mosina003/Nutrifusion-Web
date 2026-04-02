const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrifusion', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Import models and services
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const DietPlan = require('../models/DietPlan');
const ayurvedaDietPlanService = require('../services/intelligence/diet/ayurvedaDietPlanService');
const unaniDietPlanService = require('../services/intelligence/diet/unaniDietPlanService');
const tcmDietPlanService = require('../services/intelligence/diet/tcmDietPlanService');
const modernDietPlanService = require('../services/intelligence/diet/modernDietPlanService');

// Helper to convert 7-day plan to meals array
function convertSevenDayPlanToMeals(sevenDayPlan) {
  const meals = [];
  
  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    const dayKey = `day_${dayNum}`;
    const dayPlan = sevenDayPlan[dayKey];
    
    if (!dayPlan) continue;
    
    // Add breakfast
    if (dayPlan.breakfast && dayPlan.breakfast.length > 0) {
      meals.push({
        day: dayNum,
        mealType: 'Breakfast',
        foods: dayPlan.breakfast
      });
    }
    
    // Add lunch  
    if (dayPlan.lunch && dayPlan.lunch.length > 0) {
      meals.push({
        day: dayNum,
        mealType: 'Lunch',
        foods: dayPlan.lunch
      });
    }
    
    // Add dinner
    if (dayPlan.dinner && dayPlan.dinner.length > 0) {
      meals.push({
        day: dayNum,
        mealType: 'Dinner',
        foods: dayPlan.dinner
      });
    }
  }
  
  return meals;
}

// Transform modern scores to clinical profile
function transformModernScoresToClinicalProfile(scores, responses) {
  const getResponseValue = (key) => responses[key]?.value;
  
  const age = parseInt(getResponseValue('age')) || 30;
  const gender = getResponseValue('gender') || 'female';
  const height = parseFloat(getResponseValue('height')) || 165;
  const weight = parseFloat(getResponseValue('weight')) || 65;
  const activityLevel = getResponseValue('activity_level') || 'moderately_active';
  const medicalConditions = getResponseValue('medical_conditions') || [];
  const dietaryPreference = getResponseValue('dietary_preference') || 'balanced';
  const allergies = getResponseValue('allergies') || [];
  const goals = getResponseValue('goals') || [];
  const sleepQuality = getResponseValue('sleep_quality') || 'good';
  const stressLevel = getResponseValue('stress_level') || 'moderate';
  const waterIntake = parseInt(getResponseValue('water_intake')) || 8;
  const mealTiming = getResponseValue('meal_timing') || 'regular';
  const digestionIssues = getResponseValue('digestion_issues') || [];

  return {
    anthropometric: {
      age,
      gender,
      height_cm: height,
      weight_kg: weight,
      bmi: scores.bmi || ((weight / ((height / 100) ** 2))),
      bmi_category: scores.bmi_category || 'normal',
      bmr_kcal: scores.bmr || 1500,
      tdee_kcal: scores.tdee || 2000
    },
    metabolic_risk: {
      level: scores.bmi >= 30 ? 'high' : scores.bmi >= 25 ? 'moderate' : 'low',
      flags: scores.risk_flags || [],
      indicators: {
        bmi_status: scores.bmi_category,
        has_diabetes: medicalConditions.includes('diabetes'),
        has_hypertension: medicalConditions.includes('hypertension'),
        has_metabolic_syndrome: medicalConditions.includes('metabolic_syndrome')
      }
    },
    dietary_restrictions: {
      allergies: allergies.filter(a => a !== 'none'),
      preference: dietaryPreference,
      excluded_foods: [],
      medical_diet: medicalConditions.includes('diabetes') ? 'diabetic' :
                     medicalConditions.includes('kidney_disease') ? 'renal' :
                     medicalConditions.includes('heart_disease') ? 'cardiac' : 'none'
    },
    lifestyle_load: {
      activity_level: activityLevel,
      sleep_quality: sleepQuality,
      stress_level: stressLevel,
      meal_timing: mealTiming,
      hydration_level: waterIntake >= 8 ? 'adequate' : 'low'
    },
    digestive_function: {
      issues: digestionIssues.filter(i => i !== 'none'),
      overall_health: digestionIssues.length === 0 || digestionIssues.includes('none') ? 'good' : 'needs_attention'
    },
    goal_strategy: {
      primary_goals: goals,
      target_calories: scores.recommended_calories || scores.tdee,
      macro_split: scores.macro_split || {
        protein: { percent: 25, grams: 125, calories: 500 },
        carbs: { percent: 45, grams: 225, calories: 900 },
        fats: { percent: 30, grams: 67, calories: 600 }
      },
      calorie_adjustment: scores.recommended_calories ? 
        ((scores.recommended_calories - scores.tdee) / scores.tdee * 100).toFixed(1) + '%' : 
        '0%'
    },
    medical_conditions: medicalConditions,
    metabolic_risk_level: scores.bmi >= 30 ? 'high' : scores.bmi >= 25 ? 'moderate' : 'low'
  };
}

async function regenerateMissingDietPlans() {
  try {
    // Find all users with active assessments but no active diet plans
    const users = await User.find({ hasCompletedAssessment: true });
    
    console.log(`\n🔍 Found ${users.length} users with completed assessments`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    let regeneratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    for (const user of users) {
      console.log(`\n👤 Processing: ${user.name || user.email}`);
      console.log(`   Framework: ${user.preferredMedicalFramework || 'Not set'}`);
      
      // Check if user has an active diet plan
      const activeDietPlan = await DietPlan.findOne({
        userId: user._id,
        status: 'Active',
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() }
      });
      
      if (activeDietPlan) {
        console.log('   ✓ Already has active diet plan, skipping');
        skippedCount++;
        continue;
      }
      
      // Get active assessment
      const assessment = await Assessment.findOne({
        userId: user._id,
        isActive: true
      }).sort({ completedAt: -1 });
      
      if (!assessment) {
        console.log('   ⚠️  No active assessment found, skipping');
        skippedCount++;
        continue;
      }
      
      console.log(`   📊 Found ${assessment.framework} assessment`);
      
      try {
        let dietPlanData;
        
        // Check if assessment has the required data before attempting generation
        let skipReason = null;
        
        if (assessment.framework === 'ayurveda') {
          if (!assessment.scores?.prakriti || !assessment.scores?.vikriti) {
            skipReason = 'Missing prakriti/vikriti data - old assessment format';
          } else {
            dietPlanData = await ayurvedaDietPlanService.generateDietPlan(assessment.scores, {});
          }
        } else if (assessment.framework === 'unani') {
          if (!assessment.scores?.primary_mizaj || !assessment.scores?.dominant_humor) {
            skipReason = 'Missing mizaj data - old assessment format';
          } else {
            dietPlanData = await unaniDietPlanService.generateDietPlan(assessment.scores, {});
          }
        } else if (assessment.framework === 'tcm') {
          if (!assessment.scores?.primary_pattern || !assessment.scores?.cold_heat) {
            skipReason = 'Missing pattern data - old assessment format';
          } else {
            dietPlanData = await tcmDietPlanService.generateDietPlan(assessment.scores, {});
          }
        } else if (assessment.framework === 'modern') {
          const clinicalProfile = transformModernScoresToClinicalProfile(assessment.scores, assessment.responses);
          dietPlanData = await modernDietPlanService.generateDietPlan(clinicalProfile, {});
        } else {
          console.log(`   ⚠️  Unknown framework: ${assessment.framework}`);
          failedCount++;
          continue;
        }
        
        if (skipReason) {
          console.log(`   ⚠️  ${skipReason}`);
          skippedCount++;
          continue;
        }
        
        // Convert to DietPlan schema
        const meals = convertSevenDayPlanToMeals(dietPlanData['7_day_plan']);
        
        // Create diet plan
        const dietPlan = new DietPlan({
          userId: user._id,
          planName: `${assessment.framework.charAt(0).toUpperCase() + assessment.framework.slice(1)} Auto-Generated Plan`,
          planType: assessment.framework,
          meals: meals,
          rulesApplied: [{
            framework: assessment.framework,
            details: {
              reasoning: dietPlanData.reasoning_summary || 'Auto-generated from assessment',
              topFoods: dietPlanData.top_ranked_foods || [],
              avoidFoods: dietPlanData.avoidFoods || [],
              sourceAssessmentId: assessment._id
            }
          }],
          status: 'Active',
          createdBy: user._id,
          createdByModel: 'System',
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          metadata: {
            sourceAssessmentId: assessment._id,
            generatedAt: new Date(),
            regenerated: true
          }
        });
        
        await dietPlan.save();
        console.log(`   ✅ Diet plan created successfully (${meals.length} meals)`);
        regeneratedCount++;
        
      } catch (error) {
        console.log(`   ❌ Failed to generate diet plan: ${error.message}`);
        console.error('   Error details:', error);
        failedCount++;
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('\n📊 SUMMARY:');
    console.log(`   ✅ Regenerated: ${regeneratedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📋 Total processed: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

regenerateMissingDietPlans();
