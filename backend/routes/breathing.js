const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const breathingRecommendationEngine = require('../services/breathing/breathingRecommendationEngine');

/**
 * GET /api/breathing/recommendations
 * Get personalized breathing recommendations
 */
router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topN = 10 } = req.query;

    const assessment = await Assessment.findOne({ userId }).sort({ createdAt: -1 });

    if (!assessment) {
      return res.status(400).json({
        success: false,
        message: 'No assessment found. Please complete your health assessment first.',
      });
    }

    const assessmentData = {
      framework: assessment.framework,
      constitution: assessment.assessment?.constitution,
      mizaj: assessment.assessment?.mizaj,
      pattern: assessment.assessment?.pattern,
      goal: assessment.assessment?.goal,
      secondaryGoals: assessment.assessment?.secondaryGoals || [],
      agni: assessment.assessment?.agni,
      breathingLevel: assessment.assessment?.breathingLevel || 'beginner',
      medicalConditions: assessment.medicalConditions || [],
      injuries: assessment.injuries || [],
    };

    const recommendations = await breathingRecommendationEngine.generateBreathingRecommendations(
      assessmentData,
      parseInt(topN, 10)
    );

    const enhancedRecommendations = recommendations.map((technique) => ({
      ...technique,
      explanation: breathingRecommendationEngine.getRecommendationExplanation(
        technique,
        assessmentData,
        assessment.framework
      ),
    }));

    res.json({
      success: true,
      framework: assessment.framework,
      recommendations: enhancedRecommendations,
      totalCount: breathingRecommendationEngine.getTechniqueCount(),
    });
  } catch (error) {
    console.error('Error generating breathing recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message,
    });
  }
});

/**
 * GET /api/breathing/technique/:techniqueId
 * Get breathing technique details
 */
router.get('/technique/:techniqueId', async (req, res) => {
  try {
    const { techniqueId } = req.params;
    const technique = breathingRecommendationEngine.getBreathingDetails(techniqueId);

    if (!technique) {
      return res.status(404).json({
        success: false,
        message: 'Breathing technique not found',
      });
    }

    res.json({
      success: true,
      technique,
    });
  } catch (error) {
    console.error('Error retrieving technique details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving technique details',
      error: error.message,
    });
  }
});

/**
 * GET /api/breathing/category/:category
 * Get breathing techniques by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const techniques = breathingRecommendationEngine.getTechniquesByCategory(category);

    if (!techniques || techniques.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No breathing techniques found in this category',
      });
    }

    res.json({
      success: true,
      category,
      techniques,
      count: techniques.length,
    });
  } catch (error) {
    console.error('Error retrieving techniques by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving techniques',
      error: error.message,
    });
  }
});

/**
 * GET /api/breathing/all
 * Get all breathing techniques
 */
router.get('/all', async (req, res) => {
  try {
    const techniques = breathingRecommendationEngine.getAllTechniques();

    res.json({
      success: true,
      techniques,
      totalCount: techniques.length,
    });
  } catch (error) {
    console.error('Error retrieving all techniques:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving techniques',
      error: error.message,
    });
  }
});

/**
 * GET /api/breathing/session
 * Generate a complete breathing session
 */
router.get('/session', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionType = 'balanced', duration = 20 } = req.query;

    const assessment = await Assessment.findOne({ userId }).sort({ createdAt: -1 });

    if (!assessment) {
      return res.status(400).json({
        success: false,
        message: 'No assessment found. Please complete your health assessment first.',
      });
    }

    const assessmentData = {
      framework: assessment.framework,
      constitution: assessment.assessment?.constitution,
      mizaj: assessment.assessment?.mizaj,
      pattern: assessment.assessment?.pattern,
      goal: assessment.assessment?.goal,
      agni: assessment.assessment?.agni,
      breathingLevel: assessment.assessment?.breathingLevel || 'beginner',
      medicalConditions: assessment.medicalConditions || [],
      injuries: assessment.injuries || [],
    };

    const session = await breathingRecommendationEngine.generateBreathingSession(
      assessmentData,
      sessionType,
      parseInt(duration, 10)
    );

    res.json({
      success: true,
      sessionType,
      duration,
      techniques: session,
      totalCount: session.length,
    });
  } catch (error) {
    console.error('Error generating breathing session:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating breathing session',
      error: error.message,
    });
  }
});

module.exports = router;
