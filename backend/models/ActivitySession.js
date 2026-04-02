const mongoose = require('mongoose');

const activitySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionType: {
    type: String,
    enum: ['yoga', 'exercise', 'breathing', 'mixed'],
    default: 'mixed'
  },
  activities: [{
    name: String,
    displayName: String,
    duration: String,
    category: String,
    id: String,
    benefit: String,
    intensity: String
  }],
  completedActivities: [{
    name: String,
    displayName: String,
    duration: String,
    category: String,
    id: String,
    completedAt: Date
  }],
  startedAt: {
    type: Date,
    required: true,
    index: true
  },
  completedAt: {
    type: Date,
    index: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress',
    index: true
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  assessmentFramework: {
    type: String,
    enum: ['ayurveda', 'unani', 'tcm', 'modern'],
    default: 'modern'
  },
  constitution: String,
  notes: String
}, {
  timestamps: true
});

// Index for efficient queries
activitySessionSchema.index({ userId: 1, startedAt: -1 });
activitySessionSchema.index({ userId: 1, status: 1 });

// Static method to get user's session statistics
activitySessionSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sessions = await this.find({
    userId,
    startedAt: { $gte: startDate }
  });

  const completed = sessions.filter(s => s.status === 'completed');
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0);
  const categoryCounts = {};

  sessions.forEach(session => {
    session.activities.forEach(activity => {
      const category = activity.category || 'mixed';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
  });

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    completionRate: sessions.length > 0 ? Math.round((completed.length / sessions.length) * 100) : 0,
    totalTimeSpent: totalMinutes,
    averageSessionDuration: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
    activityCategoryCounts: categoryCounts,
    lastSessionDate: sessions.length > 0 ? sessions[0].startedAt : null
  };
};

module.exports = mongoose.model('ActivitySession', activitySessionSchema);
