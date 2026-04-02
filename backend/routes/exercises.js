const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const exerciseRecommendationEngine = require('../services/exercise/exerciseRecommendationEngine');

/**
 * GET /api/exercises/recommendations
 * Get personalized exercise recommendations based on user's health assessment
 */
router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topN = 10, workoutType = 'balanced' } = req.query;

    // Get user's latest assessment
    const assessment = await Assessment.findOne({ userId }).sort({ createdAt: -1 });

    if (!assessment) {
      return res.status(400).json({
        success: false,
        message: 'No assessment found. Please complete your health assessment first.',
      });
    }

    // Prepare assessment data for recommendation engine
    const assessmentData = {
      framework: assessment.framework,
      constitution: assessment.assessment?.constitution, // Ayurveda
      mizaj: assessment.assessment?.mizaj, // Unani
      pattern: assessment.assessment?.pattern, // TCM
      goal: assessment.assessment?.goal, // Modern
      secondaryGoals: assessment.assessment?.secondaryGoals || [],
      agni: assessment.assessment?.agni, // Ayurveda
      fitnessLevel: assessment.assessment?.fitnessLevel || 'beginner',
      medicalConditions: assessment.medicalConditions || [],
      injuries: assessment.injuries || [],
    };

    // Generate exercise recommendations
    const recommendations = await exerciseRecommendationEngine.generateExerciseRecommendations(
      assessmentData,
      parseInt(topN, 10)
    );

    // Enhance recommendations with explanations
    const enhancedRecommendations = recommendations.map((exercise) => ({
      ...exercise,
      explanation: exerciseRecommendationEngine.getRecommendationExplanation(
        exercise,
        assessmentData,
        assessment.framework
      ),
    }));

    res.json({
      success: true,
      framework: assessment.framework,
      recommendations: enhancedRecommendations,
      totalCount: exerciseRecommendationEngine.getExerciseCount(),
    });
  } catch (error) {
    console.error('Error generating exercise recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message,
    });
  }
});

/**
 * GET /api/exercises/exercise/:exerciseId
 * Get detailed information about a specific exercise
 */
router.get('/exercise/:exerciseId', async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const exercise = exerciseRecommendationEngine.getExerciseDetails(exerciseId);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    res.json({
      success: true,
      exercise,
    });
  } catch (error) {
    console.error('Error retrieving exercise details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving exercise details',
      error: error.message,
    });
  }
});

/**
 * GET /api/exercises/category/:category
 * Get all exercises in a specific category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const exercises = exerciseRecommendationEngine.getExercisesByCategory(category);

    if (!exercises || exercises.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No exercises found in this category',
      });
    }

    res.json({
      success: true,
      category,
      exercises,
      count: exercises.length,
    });
  } catch (error) {
    console.error('Error retrieving exercises by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving exercises',
      error: error.message,
    });
  }
});

/**
 * GET /api/exercises/all
 * Get all available exercises
 */
router.get('/all', async (req, res) => {
  try {
    const exercises = exerciseRecommendationEngine.getAllExercises();

    res.json({
      success: true,
      exercises,
      totalCount: exercises.length,
    });
  } catch (error) {
    console.error('Error retrieving all exercises:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving exercises',
      error: error.message,
    });
  }
});

/**
 * GET /api/exercises/workout-session
 * Generate a complete workout session based on user preferences
 */
router.get('/workout-session', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workoutType = 'balanced', duration = 30 } = req.query;

    // Get user's latest assessment
    const assessment = await Assessment.findOne({ userId }).sort({ createdAt: -1 });

    if (!assessment) {
      return res.status(400).json({
        success: false,
        message: 'No assessment found. Please complete your health assessment first.',
      });
    }

    // Prepare assessment data
    const assessmentData = {
      framework: assessment.framework,
      constitution: assessment.assessment?.constitution,
      mizaj: assessment.assessment?.mizaj,
      pattern: assessment.assessment?.pattern,
      goal: assessment.assessment?.goal,
      agni: assessment.assessment?.agni,
      fitnessLevel: assessment.assessment?.fitnessLevel || 'beginner',
      medicalConditions: assessment.medicalConditions || [],
      injuries: assessment.injuries || [],
    };

    // Generate workout session
    const workout = await exerciseRecommendationEngine.generateWorkoutSession(
      assessmentData,
      workoutType,
      parseInt(duration, 10)
    );

    res.json({
      success: true,
      workoutType,
      duration,
      exercises: workout,
      totalCount: workout.length,
    });
  } catch (error) {
    console.error('Error generating workout session:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating workout session',
      error: error.message,
    });
  }
});

module.exports = router;
