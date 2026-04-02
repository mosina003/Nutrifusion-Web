const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const ActivitySession = require('../models/ActivitySession');
const yogaRecommendationEngine = require('../services/yoga/yogaRecommendationEngine');

/**
 * GET /api/yoga/recommendations
 * Get personalized yoga pose recommendations based on user's health assessment
 */
router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topN = 10, sessionType = 'mixed' } = req.query;

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
      agni: assessment.assessment?.agni, // Ayurveda - digestive fire
      yogaLevel: assessment.assessment?.yogaLevel || 'beginner',
      medicalConditions: assessment.medicalConditions || [],
      injuries: assessment.injuries || [],
    };

    // Generate yoga recommendations
    const recommendations = await yogaRecommendationEngine.generateYogaRecommendations(
      assessmentData,
      parseInt(topN, 10)
    );

    // Enhance recommendations with explanations
    const enhancedRecommendations = recommendations.map((pose) => ({
      ...pose,
      explanation: yogaRecommendationEngine.getRecommendationExplanation(
        pose,
        assessmentData,
        assessment.framework
      ),
    }));

    res.json({
      success: true,
      framework: assessment.framework,
      recommendations: enhancedRecommendations,
      totalCount: yogaRecommendationEngine.getPoseCount(),
    });
  } catch (error) {
    console.error('Error generating yoga recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message,
    });
  }
});

/**
 * GET /api/yoga/pose/:poseId
 * Get detailed information about a specific yoga pose
 */
router.get('/pose/:poseId', async (req, res) => {
  try {
    const { poseId } = req.params;
    const pose = yogaRecommendationEngine.getPoseDetails(poseId);

    if (!pose) {
      return res.status(404).json({
        success: false,
        message: 'Pose not found',
      });
    }

    res.json({
      success: true,
      pose,
    });
  } catch (error) {
    console.error('Error retrieving pose details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pose details',
      error: error.message,
    });
  }
});

/**
 * GET /api/yoga/poses
 * Get all available yoga poses (with optional filtering)
 */
router.get('/poses', async (req, res) => {
  try {
    const { difficulty, minDuration, maxDuration } = req.query;

    let poses = yogaRecommendationEngine.getAllPoses();

    // Apply filters
    if (difficulty) {
      poses = yogaRecommendationEngine.filterByDifficulty(poses, difficulty);
    }

    if (minDuration && maxDuration) {
      const min = parseInt(minDuration, 10);
      const max = parseInt(maxDuration, 10);
      poses = yogaRecommendationEngine.filterByDuration(poses, min, max);
    }

    res.json({
      success: true,
      count: poses.length,
      poses,
    });
  } catch (error) {
    console.error('Error retrieving poses:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving poses',
      error: error.message,
    });
  }
});

/**
 * GET /api/yoga/session-recommendation
 * Get a complete yoga session with sequenced poses
 */
router.get('/session-recommendation', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionType = 'mixed', durationMinutes = 30 } = req.query;

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
      secondaryGoals: assessment.assessment?.secondaryGoals || [],
      agni: assessment.assessment?.agni,
      yogaLevel: assessment.assessment?.yogaLevel || 'beginner',
      medicalConditions: assessment.medicalConditions || [],
      injuries: assessment.injuries || [],
    };

    // Generate session
    const session = await yogaRecommendationEngine.generateSessionRecommendations(
      assessmentData,
      sessionType,
      parseInt(durationMinutes, 10)
    );

    res.json({
      success: true,
      framework: assessment.framework,
      sessionType,
      estimatedDuration: session.reduce((acc, pose) => acc + pose.holdDuration, 0),
      poses: session,
    });
  } catch (error) {
    console.error('Error generating session recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating session',
      error: error.message,
    });
  }
});

/**
 * GET /api/yoga/stats
 * Get user's yoga practice statistics
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const stats = await ActivitySession.getUserStats(userId, parseInt(days, 10));

    // Filter yoga/asana sessions
    const yogaStats = {
      totalSessions: stats.totalSessions,
      totalMinutes: stats.totalMinutes,
      completedSessions: stats.completedSessions,
      avgDuration: stats.avgDuration,
      mostPracticedType: stats.mostPracticedType,
      yogaSessions: stats.sessions.filter((s) => s.sessionType === 'yoga' || s.sessionType === 'asana'),
    };

    // Get top 5 favorite poses
    const allPoses = stats.sessions
      .filter((s) => s.sessionType === 'yoga' || s.sessionType === 'asana')
      .flatMap((s) => s.activities || [])
      .map((a) => a.name);

    const poseFrequency = {};
    allPoses.forEach((pose) => {
      poseFrequency[pose] = (poseFrequency[pose] || 0) + 1;
    });

    const topPoses = Object.entries(poseFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    yogaStats.topPoses = topPoses;

    res.json({
      success: true,
      stats: yogaStats,
    });
  } catch (error) {
    console.error('Error retrieving yoga stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving stats',
      error: error.message,
    });
  }
});

/**
 * POST /api/yoga/rate-pose
 * Record user's feedback on a yoga pose
 */
router.post('/rate-pose', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { poseId, rating, feedback } = req.body;

    if (!poseId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Pose ID and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // In a production app, you'd save this to a database
    // For now, we'll just acknowledge it
    res.json({
      success: true,
      message: 'Thank you for your feedback',
      data: {
        poseId,
        rating,
        feedback: feedback || '',
        recordedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error rating pose:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording rating',
      error: error.message,
    });
  }
});

module.exports = router;
