/**
 * Notifications Service
 * Generates personalized notifications based on user data and activity
 */

class NotificationsService {
  constructor() {
    this.notificationTypes = {
      MEAL_REMINDER: 'meal_reminder',
      ACTIVITY_REMINDER: 'activity_reminder',
      HEALTH_ALERT: 'health_alert',
      ASSESSMENT_REMINDER: 'assessment_reminder',
      WEEKLY_SUMMARY: 'weekly_summary',
      PRACTITIONER_MESSAGE: 'practitioner_message',
      PROGRESS_MILESTONE: 'progress_milestone'
    };

    this.icons = {
      meal_reminder: '🍽️',
      activity_reminder: '🧘',
      health_alert: '⚠️',
      assessment_reminder: '📋',
      weekly_summary: '📊',
      practitioner_message: '👨‍⚕️',
      progress_milestone: '🎉'
    };
  }

  /**
   * Generate all relevant notifications for a user
   */
  async generateNotifications(user, latestAssessment, mealCompletions, yogaSessions, dietPlan, calorieTarget, caloriesConsumed) {
    const notifications = [];

    // 1. Meal Reminders
    const mealReminders = this._generateMealReminders(mealCompletions, dietPlan);
    notifications.push(...mealReminders);

    // 2. Activity Reminders
    const activityReminders = this._generateActivityReminders(yogaSessions);
    notifications.push(...activityReminders);

    // 3. Health Alerts
    const healthAlerts = this._generateHealthAlerts(user, mealCompletions, calorieTarget, caloriesConsumed);
    notifications.push(...healthAlerts);

    // 4. Assessment Reminders
    const assessmentReminders = this._generateAssessmentReminders(latestAssessment);
    notifications.push(...assessmentReminders);

    // 5. Weekly Summary
    const weeklySummary = this._generateWeeklySummary(yogaSessions);
    if (weeklySummary) notifications.push(weeklySummary);

    // 6. Progress Milestones
    const milestones = this._generateProgressMilestones(yogaSessions);
    notifications.push(...milestones);

    return notifications;
  }

  /**
   * Generate meal reminders
   */
  _generateMealReminders(mealCompletions, dietPlan) {
    const reminders = [];
    const now = new Date();
    const hour = now.getHours();

    // Check meal timing and generate reminders
    const mealtimes = {
      breakfast: { hour: 7, meal: 'breakfast' },
      lunch: { hour: 12, meal: 'lunch' },
      dinner: { hour: 19, meal: 'dinner' }
    };

    Object.entries(mealtimes).forEach(([mealKey, mealData]) => {
      // If within 1 hour of meal time and not completed
      if (Math.abs(hour - mealData.hour) <= 1) {
        const today = new Date().toISOString().split('T')[0];
        const isCompleted = mealCompletions?.completedMeals?.some(
          m => m.mealType.toLowerCase() === mealData.meal
        );

        if (!isCompleted) {
          const recommendedFoods = this._getRecommendedFoodsForMeal(mealData.meal, dietPlan);
          reminders.push({
            id: `meal_${mealData.meal}_${Date.now()}`,
            type: this.notificationTypes.MEAL_REMINDER,
            icon: this.icons.meal_reminder,
            title: `Time for ${mealData.meal.charAt(0).toUpperCase() + mealData.meal.slice(1)}!`,
            message: `Recommended: ${recommendedFoods.join(', ') || 'Check your diet plan'}`,
            timestamp: now,
            priority: 'medium',
            actionUrl: '/dashboard'
          });
        }
      }
    });

    return reminders;
  }

  /**
   * Generate activity reminders
   */
  _generateActivityReminders(yogaSessions) {
    const reminders = [];
    const now = new Date();
    const hour = now.getHours();

    // Morning yoga reminder (around 6-7 AM)
    if (hour >= 6 && hour <= 8) {
      const today = new Date().toISOString().split('T')[0];
      const completedToday = yogaSessions?.some(s => 
        new Date(s.startedAt).toISOString().split('T')[0] === today
      );

      if (!completedToday) {
        reminders.push({
          id: `yoga_reminder_${Date.now()}`,
          type: this.notificationTypes.ACTIVITY_REMINDER,
          icon: this.icons.activity_reminder,
          title: 'Your yoga session is ready!',
          message: 'Start your morning yoga practice to energize your day',
          timestamp: now,
          priority: 'medium',
          actionUrl: '/activities'
        });
      }
    }

    // Evening exercise reminder (around 5-6 PM)
    if (hour >= 17 && hour <= 19) {
      const today = new Date().toISOString().split('T')[0];
      const completedToday = yogaSessions?.some(s => 
        new Date(s.startedAt).toISOString().split('T')[0] === today &&
        s.sessionType === 'exercise'
      );

      if (!completedToday) {
        reminders.push({
          id: `exercise_reminder_${Date.now()}`,
          type: this.notificationTypes.ACTIVITY_REMINDER,
          icon: this.icons.activity_reminder,
          title: 'Time for your evening workout!',
          message: 'Keep up your fitness momentum with today\'s exercise routine',
          timestamp: now,
          priority: 'medium',
          actionUrl: '/activities'
        });
      }
    }

    return reminders;
  }

  /**
   * Generate health alerts
   */
  _generateHealthAlerts(user, mealCompletions, calorieTarget, caloriesConsumed) {
    const alerts = [];
    const now = new Date();

    // Check if consumed meets, exceeds, or is below target
    if (caloriesConsumed !== undefined && calorieTarget) {
      if (caloriesConsumed < calorieTarget * 0.7) {
        // Below 70% of target
        alerts.push({
          id: `health_alert_low_${Date.now()}`,
          type: this.notificationTypes.HEALTH_ALERT,
          icon: this.icons.health_alert,
          title: '⬇️ Below Daily Calorie Target',
          message: `You've consumed ${caloriesConsumed} cal of your ${calorieTarget} cal target. Don't skip meals!`,
          timestamp: now,
          priority: 'high',
          actionUrl: '/dashboard'
        });
      } else if (caloriesConsumed > calorieTarget * 1.1) {
        // Exceeded by 10%
        alerts.push({
          id: `health_alert_high_${Date.now()}`,
          type: this.notificationTypes.HEALTH_ALERT,
          icon: this.icons.health_alert,
          title: '⬆️ Exceeded Daily Calorie Target',
          message: `You've consumed ${caloriesConsumed} cal, exceeding your ${calorieTarget} cal target by ${Math.round((caloriesConsumed - calorieTarget))}cal.`,
          timestamp: now,
          priority: 'medium',
          actionUrl: '/dashboard'
        });
      }
    }

    return alerts;
  }

  /**
   * Generate assessment reminders
   */
  _generateAssessmentReminders(latestAssessment) {
    const reminders = [];
    const now = new Date();

    if (!latestAssessment) {
      // No assessment yet
      reminders.push({
        id: `assessment_first_${Date.now()}`,
        type: this.notificationTypes.ASSESSMENT_REMINDER,
        icon: this.icons.assessment_reminder,
        title: '📋 Complete Your Health Assessment',
        message: 'Let\'s understand your constitution to provide personalized recommendations',
        timestamp: now,
        priority: 'high',
        actionUrl: '/assessment'
      });
    } else {
      // Check if 30 days have passed
      const assessmentDate = new Date(latestAssessment.completedAt);
      const daysSinceAssessment = Math.floor((now - assessmentDate) / (1000 * 60 * 60 * 24));

      if (daysSinceAssessment >= 30) {
        reminders.push({
          id: `assessment_retake_${Date.now()}`,
          type: this.notificationTypes.ASSESSMENT_REMINDER,
          icon: this.icons.assessment_reminder,
          title: '📋 Time to Retake Your Assessment',
          message: `It's been ${daysSinceAssessment} days. Retake your assessment for updated recommendations`,
          timestamp: now,
          priority: 'medium',
          actionUrl: '/assessment'
        });
      }
    }

    return reminders;
  }

  /**
   * Generate weekly summary (only on Sundays)
   */
  _generateWeeklySummary(yogaSessions) {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Only generate on Sunday (0)
    if (dayOfWeek !== 0) return null;

    // Count completed sessions this week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weeklyCount = yogaSessions?.filter(s => 
      new Date(s.startedAt) >= weekStart
    ).length || 0;

    const totalSessions = 7; // Target

    return {
      id: `weekly_summary_${Date.now()}`,
      type: this.notificationTypes.WEEKLY_SUMMARY,
      icon: this.icons.weekly_summary,
      title: '📊 Weekly Summary',
      message: `You completed ${weeklyCount}/${totalSessions} yoga sessions this week. ${weeklyCount >= 5 ? 'Great job! 🌟' : 'Keep it up! 💪'}`,
      timestamp: now,
      priority: 'low',
      actionUrl: '/dashboard'
    };
  }

  /**
   * Generate progress milestones
   */
  _generateProgressMilestones(yogaSessions) {
    const milestones = [];
    const now = new Date();

    if (!yogaSessions || yogaSessions.length === 0) return milestones;

    // Sort by date
    const sortedSessions = yogaSessions.sort((a, b) => 
      new Date(b.startedAt) - new Date(a.startedAt)
    );

    // Check for consecutive days streak
    let streak = 1;
    for (let i = 0; i < sortedSessions.length - 1; i++) {
      const currDate = new Date(sortedSessions[i].startedAt).toISOString().split('T')[0];
      const nextDate = new Date(sortedSessions[i + 1].startedAt).toISOString().split('T')[0];
      
      const curr = new Date(currDate);
      const next = new Date(nextDate);
      const dayDiff = (curr - next) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        streak++;
        if (streak === 7 || streak === 14 || streak === 30) {
          milestones.push({
            id: `milestone_streak_${streak}_${Date.now()}`,
            type: this.notificationTypes.PROGRESS_MILESTONE,
            icon: this.icons.progress_milestone,
            title: `🎉 ${streak}-Day Streak!`,
            message: `Incredible! You've completed ${streak} consecutive days of yoga. Keep the momentum going!`,
            timestamp: now,
            priority: 'low',
            actionUrl: '/dashboard'
          });
        }
      } else {
        break;
      }
    }

    // Check for total session milestones
    const totalSessions = yogaSessions.length;
    if (totalSessions === 10 || totalSessions === 25 || totalSessions === 50 || totalSessions === 100) {
      milestones.push({
        id: `milestone_total_${totalSessions}_${Date.now()}`,
        type: this.notificationTypes.PROGRESS_MILESTONE,
        icon: this.icons.progress_milestone,
        title: `🏆 ${totalSessions} Sessions Complete!`,
        message: `You've completed ${totalSessions} yoga sessions. You're a wellness warrior!`,
        timestamp: now,
        priority: 'low',
        actionUrl: '/dashboard'
      });
    }

    return milestones;
  }

  /**
   * Get recommended foods for a meal from diet plan
   */
  _getRecommendedFoodsForMeal(mealType, dietPlan) {
    if (!dietPlan || !dietPlan.meals) return [];
    
    const mealFoods = dietPlan.meals
      .filter(m => m.mealType.toLowerCase() === mealType.toLowerCase())
      .slice(0, 3)
      .map(m => m.foods?.[0] || m.recipeId)
      .filter(Boolean);
    
    return mealFoods;
  }
}

module.exports = new NotificationsService();
