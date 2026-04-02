const fs = require('fs');
const path = require('path');

class YogaRecommendationEngine {
  constructor() {
    this.yogaPoses = [];
    this.loadYogaPoses();
  }

  loadYogaPoses() {
    try {
      const yogaPosesPath = path.join(__dirname, '../../data/yoga_poses.json');
      const data = fs.readFileSync(yogaPosesPath, 'utf8');
      this.yogaPoses = JSON.parse(data);
    } catch (error) {
      console.error('Error loading yoga poses:', error);
      this.yogaPoses = [];
    }
  }

  /**
   * Generate personalized yoga pose recommendations based on user assessment
   * @param {Object} userAssessment - User's health assessment with framework info
   * @param {number} topN - Number of top recommendations to return
   * @returns {Array} Ranked yoga poses with scores
   */
  async generateYogaRecommendations(userAssessment, topN = 10) {
    if (!userAssessment || !this.yogaPoses.length) {
      return [];
    }

    const framework = userAssessment.framework?.toLowerCase() || 'modern';
    const scoredPoses = this.yogaPoses.map((pose) => {
      const score = this.scorePoseForFramework(pose, userAssessment, framework);
      return {
        ...pose,
        recommendationScore: score,
      };
    });

    // Sort by score (descending) and return top N
    return scoredPoses
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, topN);
  }

  /**
   * Score a yoga pose based on user's framework and health profile
   */
  scorePoseForFramework(pose, userAssessment, framework) {
    let score = 0;

    if (framework === 'ayurveda') {
      score = this.scoreAyurvedaPose(pose, userAssessment);
    } else if (framework === 'unani') {
      score = this.scoreUnaniPose(pose, userAssessment);
    } else if (framework === 'tcm') {
      score = this.scoreTCMPose(pose, userAssessment);
    } else {
      score = this.scoreModernPose(pose, userAssessment);
    }

    // Adjust score based on difficulty and health conditions
    const difficultyScore = this.getDifficultyScore(pose.difficulty, userAssessment);
    const contraIndicationPenalty = this.getContraIndicationPenalty(
      pose.contraindications,
      userAssessment
    );

    return Math.max(0, score + difficultyScore - contraIndicationPenalty);
  }

  /**
   * Score pose based on Ayurvedic constitution (doshas)
   */
  scoreAyurvedaPose(pose, userAssessment) {
    const constitution = userAssessment.constitution?.toLowerCase() || 'vata';
    const poseFramework = pose.framework?.ayurveda;

    if (!poseFramework || !poseFramework.dosha) {
      return 5; // Default score
    }

    // Get dosha-specific score
    const doshaScore = poseFramework.dosha[constitution]?.score || 5;

    // Get agni-specific score
    const agni = userAssessment.agni || 'normal';
    const agniScore = poseFramework.agni?.[agni] || 5;

    // Weighted average: 70% dosha, 30% agni
    return (doshaScore * 0.7 + agniScore * 0.3) / 10;
  }

  /**
   * Score pose based on Unani mizaj (temperament)
   */
  scoreUnaniPose(pose, userAssessment) {
    const mizaj = userAssessment.mizaj?.toLowerCase().replace(/\s+/g, '_') || 'hot_moist';
    const poseFramework = pose.framework?.unani;

    if (!poseFramework || !poseFramework.mizaj) {
      return 5; // Default score
    }

    // Get mizaj-specific score
    const mizajScore = poseFramework.mizaj[mizaj]?.score || 5;

    return mizajScore / 10;
  }

  /**
   * Score pose based on TCM pattern (syndrome)
   */
  scoreTCMPose(pose, userAssessment) {
    const pattern = userAssessment.pattern?.toLowerCase().replace(/\s+/g, '_') || 'qi_stagnation';
    const poseFramework = pose.framework?.tcm;

    if (!poseFramework || !poseFramework.pattern) {
      return 5; // Default score
    }

    // Get pattern-specific score
    const patternScore = poseFramework.pattern[pattern]?.score || 5;

    return patternScore / 10;
  }

  /**
   * Score pose based on Modern fitness goals
   */
  scoreModernPose(pose, userAssessment) {
    const goal = userAssessment.goal?.toLowerCase() || 'relaxation';
    const poseFramework = pose.framework?.modern;

    if (!poseFramework || !poseFramework.goal) {
      return 5; // Default score
    }

    // Get goal-specific score
    const goalScore = poseFramework.goal[goal]?.score || 5;

    // Consider secondary goals if available
    let secondaryScore = 0;
    if (userAssessment.secondaryGoals && Array.isArray(userAssessment.secondaryGoals)) {
      const secondaryScores = userAssessment.secondaryGoals.map((g) => poseFramework.goal[g.toLowerCase()]?.score || 5);
      secondaryScore = secondaryScores.reduce((a, b) => a + b, 0) / (secondaryScores.length || 1);
    }

    // Weighted: 80% primary, 20% secondary
    return (goalScore * 0.8 + secondaryScore * 0.2) / 10;
  }

  /**
   * Get score adjustment based on difficulty level and user capacity
   */
  getDifficultyScore(difficulty, userAssessment) {
    const userLevel = userAssessment.yogaLevel || 'beginner';

    const difficultyMap = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    const levelMap = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    const poseLevel = difficultyMap[difficulty] || 1;
    const userCapacity = levelMap[userLevel] || 1;

    // Matching difficulty is ideal (+0.3)
    if (poseLevel === userCapacity) return 0.3;
    // One level below is good (+0.1)
    if (poseLevel === userCapacity - 1) return 0.1;
    // One level above is acceptable (+0.05)
    if (poseLevel === userCapacity + 1) return 0.05;
    // Two or more levels mismatch (-0.5)
    if (Math.abs(poseLevel - userCapacity) >= 2) return -0.5;

    return 0;
  }

  /**
   * Get penalty score for contraindications
   */
  getContraIndicationPenalty(contraindications, userAssessment) {
    if (!contraindications || !Array.isArray(contraindications)) {
      return 0;
    }

    const userConditions = userAssessment.medicalConditions || [];
    const injuries = userAssessment.injuries || [];
    const allConditions = [...userConditions, ...injuries].map((c) => c.toLowerCase());

    let penalty = 0;
    contraindications.forEach((contra) => {
      if (allConditions.some((cond) => cond.includes(contra.toLowerCase()))) {
        penalty += 0.5; // Major penalty for contraindication match
      }
    });

    return penalty;
  }

  /**
   * Filter poses by difficulty level
   */
  filterByDifficulty(poses, difficulty) {
    if (!difficulty) return poses;
    return poses.filter((p) => p.difficulty === difficulty.toLowerCase());
  }

  /**
   * Filter poses by duration range (in seconds)
   */
  filterByDuration(poses, minDuration, maxDuration) {
    return poses.filter((p) => p.duration >= minDuration && p.duration <= maxDuration);
  }

  /**
   * Get detailed information about a specific pose
   */
  getPoseDetails(poseId) {
    return this.yogaPoses.find((p) => p.id === poseId.toLowerCase());
  }

  /**
   * Get recommendations for a session (multiple poses)
   */
  async generateSessionRecommendations(userAssessment, sessionType = 'mixed', durationMinutes = 30) {
    const topPoses = await this.generateYogaRecommendations(userAssessment, 15);
    const targetDurationSeconds = durationMinutes * 60;
    const session = [];
    let currentDuration = 0;

    // Warm-up pose
    const warmupPose = topPoses.find((p) => p.difficulty === 'beginner');
    if (warmupPose) {
      session.push({
        ...warmupPose,
        sequenceOrder: 1,
        holdDuration: Math.min(warmupPose.duration, 120),
      });
      currentDuration += warmupPose.duration;
    }

    // Main poses
    const mainPoses = topPoses.filter((p) => p.difficulty !== 'beginner' && p.id !== warmupPose?.id);
    let sequenceOrder = 2;
    for (const pose of mainPoses) {
      if (currentDuration + pose.duration > targetDurationSeconds * 0.85) break; // Save time for cool-down
      session.push({
        ...pose,
        sequenceOrder,
        holdDuration: Math.min(pose.duration, 300),
      });
      currentDuration += pose.duration;
      sequenceOrder++;
    }

    // Cool-down pose (should be very calming)
    const cooldownPose = topPoses.find((p) => p.id === 'legs_up_wall' || p.id === 'corpse_pose');
    if (cooldownPose) {
      session.push({
        ...cooldownPose,
        sequenceOrder,
        holdDuration: Math.min(cooldownPose.duration, (targetDurationSeconds - currentDuration) * 0.8),
      });
    }

    return session;
  }

  /**
   * Get explanation for why a pose is recommended
   */
  getRecommendationExplanation(pose, userAssessment, framework) {
    const poseFramework = pose.framework?.[framework.toLowerCase()];
    if (!poseFramework) return 'This pose supports your overall wellness.';

    if (framework.toLowerCase() === 'ayurveda') {
      const constitution = userAssessment.constitution?.toLowerCase() || 'vata';
      return poseFramework.dosha?.[constitution]?.reason || 'Beneficial for your constitution.';
    }

    if (framework.toLowerCase() === 'unani') {
      const mizaj = userAssessment.mizaj?.toLowerCase().replace(/\s+/g, '_') || 'hot_moist';
      return poseFramework.mizaj?.[mizaj]?.reason || 'Balancing for your mizaj.';
    }

    if (framework.toLowerCase() === 'tcm') {
      const pattern = userAssessment.pattern?.toLowerCase().replace(/\s+/g, '_') || 'qi_stagnation';
      return poseFramework.pattern?.[pattern]?.reason || 'Supports your energy patterns.';
    }

    if (framework.toLowerCase() === 'modern') {
      const goal = userAssessment.goal?.toLowerCase() || 'relaxation';
      return poseFramework.goal?.[goal]?.reason || 'Aligned with your fitness goals.';
    }

    return 'Tailored for your wellness journey.';
  }

  /**
   * Get all available poses
   */
  getAllPoses() {
    return this.yogaPoses;
  }

  /**
   * Get pose count
   */
  getPoseCount() {
    return this.yogaPoses.length;
  }
}

module.exports = new YogaRecommendationEngine();
