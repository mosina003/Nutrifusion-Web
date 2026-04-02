const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const ActivitySession = require('../models/ActivitySession');
const { generateRecommendations } = require('../services/activities/recommendationEngine');

/**
 * GET /api/activities/recommendations
 * Fetch personalized yoga, exercise, and breathing recommendations
 * based on user's latest assessment
 */
router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user's latest active assessment
    const assessment = await Assessment.findOne({
      userId,
      isActive: true
    }).sort({ createdAt: -1 });

    // Fetch user profile for additional context
    const user = await User.findById(userId).select('age gender height weight medicinePreference');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'No active assessment found. Please complete an assessment first.',
      });
    }

    // Generate recommendations using the engine
    const recommendations = generateRecommendations(assessment, user);

    // Format the response
    const response = {
      success: true,
      data: {
        yoga: recommendations.yoga.map(item => ({
          ...item,
          category: 'yoga',
          id: `yoga-${item.name.toLowerCase().replace(/'/g, '').replace(/\s+/g, '_')}`,
        })),
        exercise: recommendations.exercise.map(item => ({
          ...item,
          category: 'exercise',
          id: `exercise-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
        })),
        breathing: recommendations.breathing.map(item => ({
          ...item,
          category: 'breathing',
          id: `breathing-${item.name.toLowerCase().replace(/\s+/g, '_')}`,
        })),
      },
      metadata: {
        framework: assessment.framework,
        constitution: recommendations.constitution,
        assessmentDate: assessment.completedAt,
        generatedAt: new Date(),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message,
    });
  }
});

/**
 * POST /api/activities/start-session
 * Record the start of an activity session
 */
router.post('/start-session', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { activities } = req.body;

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Activities array is required and must not be empty',
      });
    }

    // Create a session record
    const activitySession = new ActivitySession({
      userId,
      sessionType: 'mixed',
      activities,
      startedAt: new Date(),
      status: 'in-progress',
      totalDuration: calculateTotalDuration(activities),
    });

    await activitySession.save();

    res.json({
      success: true,
      data: {
        sessionId: activitySession._id,
        activities,
        startedAt: activitySession.startedAt,
      },
      message: 'Activity session started',
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting activity session',
      error: error.message,
    });
  }
});

/**
 * POST /api/activities/complete-session
 * Record session completion
 */
router.post('/complete-session', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, completedActivities } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    // Find and update the session
    const session = await ActivitySession.findByIdAndUpdate(
      sessionId,
      {
        status: 'completed',
        completedAt: new Date(),
        completedActivities: completedActivities || [],
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: session,
      message: 'Activity session completed',
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing activity session',
      error: error.message,
    });
  }
});

/**
 * GET /api/activities/session-history
 * Fetch user's activity session history
 */
router.get('/session-history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const sessions = await ActivitySession.find({
      userId
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await ActivitySession.countDocuments({
      userId
    });

    res.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session history',
      error: error.message,
    });
  }
});

/**
 * GET /api/activities/stats
 * Fetch user's activity statistics
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const stats = await ActivitySession.getUserStats(userId, days);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity statistics',
      error: error.message,
    });
  }
});

/**
 * POST /api/activities/complete
 * Mark an activity as completed
 */
router.post('/complete', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { activityName, category, duration } = req.body;

    if (!activityName || !category) {
      return res.status(400).json({
        success: false,
        message: 'Activity name and category are required'
      });
    }

    // Get or create today's session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let session = await ActivitySession.findOne({
      userId,
      startedAt: { $gte: today, $lt: tomorrow },
      sessionType: category
    });

    if (!session) {
      session = new ActivitySession({
        userId,
        sessionType: category,
        activities: [],
        completedActivities: [],
        startedAt: new Date(),
        status: 'in-progress',
        assessmentFramework: 'modern'
      });
    }

    // Add to completed activities
    const completedActivity = {
      name: activityName,
      displayName: activityName,
      duration: duration || '0 min',
      category: category,
      completedAt: new Date()
    };

    // Check if already completed to avoid duplicates
    const alreadyCompleted = session.completedActivities.some(
      activity => activity.name === activityName && 
                   new Date(activity.completedAt).toDateString() === new Date().toDateString()
    );

    if (!alreadyCompleted) {
      session.completedActivities.push(completedActivity);
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Activity marked as completed',
      data: {
        completedActivities: session.completedActivities,
        totalCompleted: session.completedActivities.length
      }
    });
  } catch (error) {
    console.error('Error marking activity as completed:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking activity as completed',
      error: error.message
    });
  }
});

/**
 * GET /api/activities/daily-completion
 * Get today's activity completion status
 */
router.get('/daily-completion', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all sessions for today
    const todaySessions = await ActivitySession.find({
      userId,
      startedAt: { $gte: today, $lt: tomorrow }
    });

    // Aggregate completion data
    const yogaSessions = todaySessions.filter(s => s.sessionType === 'yoga' || s.sessionType === 'mixed');
    const exerciseSessions = todaySessions.filter(s => s.sessionType === 'exercise' || s.sessionType === 'mixed');
    const breathingSessions = todaySessions.filter(s => s.sessionType === 'breathing' || s.sessionType === 'mixed');

    const yogaCompleted = yogaSessions.some(s => s.completedActivities.length > 0);
    const exerciseCompleted = exerciseSessions.some(s => s.completedActivities.length > 0);
    const breathingCompleted = breathingSessions.some(s => s.completedActivities.length > 0);

    // All completed if at least one activity from each category is done
    const allActivitiesCompleted = yogaCompleted && exerciseCompleted;

    const completionStatus = {
      yoga: {
        completed: yogaCompleted,
        count: yogaSessions.reduce((sum, s) => sum + s.completedActivities.length, 0),
        activities: yogaSessions.flatMap(s => s.completedActivities)
      },
      exercise: {
        completed: exerciseCompleted,
        count: exerciseSessions.reduce((sum, s) => sum + s.completedActivities.length, 0),
        activities: exerciseSessions.flatMap(s => s.completedActivities)
      },
      breathing: {
        completed: breathingCompleted,
        count: breathingSessions.reduce((sum, s) => sum + s.completedActivities.length, 0),
        activities: breathingSessions.flatMap(s => s.completedActivities)
      },
      allActivitiesCompleted: allActivitiesCompleted,
      completionPercentage: Math.round(
        ((yogaCompleted ? 1 : 0) + (exerciseCompleted ? 1 : 0)) / 2 * 100
      )
    };

    res.status(200).json({
      success: true,
      data: completionStatus
    });
  } catch (error) {
    console.error('Error fetching daily completion status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily completion status',
      error: error.message
    });
  }
});

/**
 * Helper function to calculate total duration from activities array
 */
function calculateTotalDuration(activities) {
  if (!Array.isArray(activities)) return 0;
  
  return activities.reduce((total, activity) => {
    const duration = activity.duration || '0 min';
    const minutes = parseInt(duration.match(/\d+/)?.[0] || 0);
    return total + minutes;
  }, 0);
}

module.exports = router;
