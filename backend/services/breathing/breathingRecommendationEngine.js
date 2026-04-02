const fs = require('fs');
const path = require('path');

class BreathingRecommendationEngine {
  constructor() {
    this.breathingTechniques = [];
    this.breathingExercises = [];
    this.loadBreathingTechniques();
    this.loadBreathingExercises();
  }

  loadBreathingTechniques() {
    try {
      const breathingPath = path.join(__dirname, '../../data/breathing_techniques.json');
      const data = fs.readFileSync(breathingPath, 'utf8');
      this.breathingTechniques = JSON.parse(data);
    } catch (error) {
      console.error('Error loading breathing techniques:', error);
      this.breathingTechniques = [];
    }
  }

  loadBreathingExercises() {
    try {
      const exercisesPath = path.join(__dirname, '../../data/breathing_exercises.json');
      const data = fs.readFileSync(exercisesPath, 'utf8');
      this.breathingExercises = JSON.parse(data);
    } catch (error) {
      console.error('Error loading breathing exercises:', error);
      this.breathingExercises = [];
    }
  }

  /**
   * Get breathing exercise details by ID
   * @param {string} exerciseId - The breathing exercise ID
   * @returns {Object} Breathing exercise details with full instructions
   */
  getBreathingDetails(exerciseId) {
    return this.breathingExercises.find(exercise => exercise.id === exerciseId);
  }

  /**
   * Generate personalized breathing recommendations
   * @param {Object} userAssessment - User's health assessment
   * @param {number} topN - Number of top recommendations
   * @returns {Array} Ranked breathing techniques
   */
  async generateBreathingRecommendations(userAssessment, topN = 10) {
    if (!userAssessment || !this.breathingTechniques.length) {
      return [];
    }

    const framework = userAssessment.framework?.toLowerCase() || 'modern';
    const scoredTechniques = this.breathingTechniques.map((technique) => {
      const score = this.scoreBreathingForFramework(technique, userAssessment, framework);
      return {
        ...technique,
        recommendationScore: score,
      };
    });

    return scoredTechniques
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, topN);
  }

  /**
   * Score breathing technique based on framework
   */
  scoreBreathingForFramework(technique, userAssessment, framework) {
    let score = 0;

    if (framework === 'ayurveda') {
      score = this.scoreAyurveda(technique, userAssessment);
    } else if (framework === 'unani') {
      score = this.scoreUnani(technique, userAssessment);
    } else if (framework === 'tcm') {
      score = this.scoreTCM(technique, userAssessment);
    } else {
      score = this.scoreModern(technique, userAssessment);
    }

    // Adjust for difficulty
    const difficultyScore = this.getDifficultyScore(technique.difficulty, userAssessment);
    const contraIndicationPenalty = this.getContraIndicationPenalty(
      technique.contraindications,
      userAssessment
    );

    return Math.max(0, score + difficultyScore - contraIndicationPenalty);
  }

  /**
   * Score based on Ayurvedic constitution
   */
  scoreAyurveda(technique, userAssessment) {
    const constitution = userAssessment.constitution?.toLowerCase() || 'vata';
    const framework = technique.framework?.ayurveda;

    if (!framework || !framework.dosha) {
      return 5;
    }

    const doshaScore = framework.dosha[constitution]?.score || 5;
    const agni = userAssessment.agni || 'normal';
    const agniScore = framework.agni?.[agni] || 5;

    return (doshaScore * 0.7 + agniScore * 0.3) / 10;
  }

  /**
   * Score based on Unani mizaj
   */
  scoreUnani(technique, userAssessment) {
    const mizaj = userAssessment.mizaj?.toLowerCase().replace(/\s+/g, '_') || 'hot_moist';
    const framework = technique.framework?.unani;

    if (!framework || !framework.mizaj) {
      return 5;
    }

    const mizajScore = framework.mizaj[mizaj]?.score || 5;
    return mizajScore / 10;
  }

  /**
   * Score based on TCM pattern
   */
  scoreTCM(technique, userAssessment) {
    const pattern = userAssessment.pattern?.toLowerCase().replace(/\s+/g, '_') || 'qi_stagnation';
    const framework = technique.framework?.tcm;

    if (!framework || !framework.pattern) {
      return 5;
    }

    const patternScore = framework.pattern[pattern]?.score || 5;
    return patternScore / 10;
  }

  /**
   * Score based on Modern breathing goals
   */
  scoreModern(technique, userAssessment) {
    const goal = userAssessment.goal?.toLowerCase() || 'relaxation';
    const framework = technique.framework?.modern;

    if (!framework || !framework.goal) {
      return 5;
    }

    const goalScore = framework.goal[goal]?.score || 5;

    let secondaryScore = 0;
    if (userAssessment.secondaryGoals && Array.isArray(userAssessment.secondaryGoals)) {
      const secondaryScores = userAssessment.secondaryGoals.map(
        (g) => framework.goal[g.toLowerCase()]?.score || 5
      );
      secondaryScore = secondaryScores.reduce((a, b) => a + b, 0) / (secondaryScores.length || 1);
    }

    return (goalScore * 0.8 + secondaryScore * 0.2) / 10;
  }

  /**
   * Get difficulty score adjustment
   */
  getDifficultyScore(difficulty, userAssessment) {
    const userLevel = userAssessment.breathingLevel || 'beginner';

    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const levelMap = { beginner: 1, intermediate: 2, advanced: 3 };

    const techniqueLevel = difficultyMap[difficulty] || 1;
    const userCapacity = levelMap[userLevel] || 1;

    if (techniqueLevel === userCapacity) return 0.3;
    if (techniqueLevel === userCapacity - 1) return 0.1;
    if (techniqueLevel === userCapacity + 1) return 0.05;
    if (Math.abs(techniqueLevel - userCapacity) >= 2) return -0.5;

    return 0;
  }

  /**
   * Get contraindication penalty
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
        penalty += 0.5;
      }
    });

    return penalty;
  }

  /**
   * Filter by category
   */
  filterByCategory(techniques, category) {
    if (!category) return techniques;
    return techniques.filter((t) => t.category === category.toLowerCase());
  }

  /**
   * Filter by difficulty
   */
  filterByDifficulty(techniques, difficulty) {
    if (!difficulty) return techniques;
    return techniques.filter((t) => t.difficulty === difficulty.toLowerCase());
  }

  /**
   * Get breathing session (sequence of techniques)
   */
  async generateBreathingSession(userAssessment, sessionType = 'balanced', durationMinutes = 20) {
    const topTechniques = await this.generateBreathingRecommendations(userAssessment, 15);

    let selectedTechniques = topTechniques;
    if (sessionType === 'cooling') {
      selectedTechniques = topTechniques.filter((t) => t.category === 'cooling');
    } else if (sessionType === 'heating') {
      selectedTechniques = topTechniques.filter((t) => t.category === 'heating');
    } else if (sessionType === 'calming') {
      selectedTechniques = topTechniques.filter((t) => t.category === 'calming');
    } else if (sessionType === 'energizing') {
      selectedTechniques = topTechniques.filter((t) => t.category === 'heating' || t.category === 'focus');
    }

    const targetDurationSeconds = durationMinutes * 60;
    const session = [];
    let currentDuration = 0;
    let sequenceOrder = 1;

    // Warm-up with gentle breathing
    const warmup = selectedTechniques.find((t) => t.difficulty === 'beginner');
    if (warmup) {
      session.push({
        ...warmup,
        sequenceOrder,
        reps: 1,
        cycles: Math.ceil((warmup.duration / 60) * 2),
      });
      currentDuration += warmup.duration;
      sequenceOrder++;
    }

    // Main techniques
    for (const technique of selectedTechniques) {
      if (currentDuration + technique.duration > targetDurationSeconds * 0.8 || technique.id === warmup?.id)
        break;
      session.push({
        ...technique,
        sequenceOrder,
        reps: 1,
        cycles: Math.ceil((technique.duration / 60) * 2),
      });
      currentDuration += technique.duration;
      sequenceOrder++;
    }

    // Cool-down
    const cooldown = selectedTechniques.find((t) => t.category === 'calming');
    if (cooldown) {
      session.push({
        ...cooldown,
        sequenceOrder,
        reps: 1,
        cycles: Math.ceil(((targetDurationSeconds - currentDuration) / 60) * 2),
      });
    }

    return session;
  }

  /**
   * Get recommendation explanation
   */
  getRecommendationExplanation(technique, userAssessment, framework) {
    const techniqueFramework = technique.framework?.[framework.toLowerCase()];
    if (!techniqueFramework) return 'This breathing technique supports your wellness.';

    if (framework.toLowerCase() === 'ayurveda') {
      const constitution = userAssessment.constitution?.toLowerCase() || 'vata';
      return techniqueFramework.dosha?.[constitution]?.reason || 'Beneficial for your constitution.';
    }

    if (framework.toLowerCase() === 'unani') {
      const mizaj = userAssessment.mizaj?.toLowerCase().replace(/\s+/g, '_') || 'hot_moist';
      return techniqueFramework.mizaj?.[mizaj]?.reason || 'Balancing for your mizaj.';
    }

    if (framework.toLowerCase() === 'tcm') {
      const pattern = userAssessment.pattern?.toLowerCase().replace(/\s+/g, '_') || 'qi_stagnation';
      return techniqueFramework.pattern?.[pattern]?.reason || 'Supports your energy patterns.';
    }

    if (framework.toLowerCase() === 'modern') {
      const goal = userAssessment.goal?.toLowerCase() || 'relaxation';
      return techniqueFramework.goal?.[goal]?.reason || 'Aligned with your goals.';
    }

    return 'Tailored for your wellness journey.';
  }

  /**
   * Get all techniques
   */
  getAllTechniques() {
    return this.breathingTechniques;
  }

  /**
   * Get technique count
   */
  getTechniqueCount() {
    return this.breathingTechniques.length;
  }

  /**
   * Get techniques by category
   */
  getTechniquesByCategory(category) {
    return this.breathingTechniques.filter((t) => t.category === category.toLowerCase());
  }
}

module.exports = new BreathingRecommendationEngine();
