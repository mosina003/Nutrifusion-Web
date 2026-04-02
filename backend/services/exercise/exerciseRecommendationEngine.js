const fs = require('fs');
const path = require('path');

class ExerciseRecommendationEngine {
  constructor() {
    this.exercises = [];
    this.loadExercises();
  }

  loadExercises() {
    try {
      const exercisesPath = path.join(__dirname, '../../data/exercises.json');
      const data = fs.readFileSync(exercisesPath, 'utf8');
      this.exercises = JSON.parse(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
      this.exercises = [];
    }
  }

  /**
   * Generate personalized exercise recommendations based on user assessment
   * @param {Object} userAssessment - User's health assessment with framework info
   * @param {number} topN - Number of top recommendations to return
   * @returns {Array} Ranked exercises with scores
   */
  async generateExerciseRecommendations(userAssessment, topN = 10) {
    if (!userAssessment || !this.exercises.length) {
      return [];
    }

    const framework = userAssessment.framework?.toLowerCase() || 'modern';
    const scoredExercises = this.exercises.map((exercise) => {
      const score = this.scoreExerciseForFramework(exercise, userAssessment, framework);
      return {
        ...exercise,
        recommendationScore: score,
      };
    });

    // Sort by score (descending) and return top N
    return scoredExercises
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, topN);
  }

  /**
   * Score an exercise based on user's framework and health profile
   */
  scoreExerciseForFramework(exercise, userAssessment, framework) {
    let score = 0;

    if (framework === 'ayurveda') {
      score = this.scoreAyurveda(exercise, userAssessment);
    } else if (framework === 'unani') {
      score = this.scoreUnani(exercise, userAssessment);
    } else if (framework === 'tcm') {
      score = this.scoreTCM(exercise, userAssessment);
    } else {
      score = this.scoreModern(exercise, userAssessment);
    }

    // Adjust score based on difficulty and health conditions
    const difficultyScore = this.getDifficultyScore(exercise.difficulty, userAssessment);
    const contraIndicationPenalty = this.getContraIndicationPenalty(
      exercise.contraindications,
      userAssessment
    );

    return Math.max(0, score + difficultyScore - contraIndicationPenalty);
  }

  /**
   * Score exercise based on Ayurvedic constitution (doshas)
   */
  scoreAyurveda(exercise, userAssessment) {
    const constitution = userAssessment.constitution?.toLowerCase() || 'vata';
    const exerciseFramework = exercise.framework?.ayurveda;

    if (!exerciseFramework || !exerciseFramework.dosha) {
      return 5;
    }

    // Get dosha-specific score
    const doshaScore = exerciseFramework.dosha[constitution]?.score || 5;

    // Get agni-specific score
    const agni = userAssessment.agni || 'normal';
    const agniScore = exerciseFramework.agni?.[agni] || 5;

    // Weighted average: 70% dosha, 30% agni
    return (doshaScore * 0.7 + agniScore * 0.3) / 10;
  }

  /**
   * Score exercise based on Unani mizaj (temperament)
   */
  scoreUnani(exercise, userAssessment) {
    const mizaj = userAssessment.mizaj?.toLowerCase().replace(/\s+/g, '_') || 'hot_moist';
    const exerciseFramework = exercise.framework?.unani;

    if (!exerciseFramework || !exerciseFramework.mizaj) {
      return 5;
    }

    // Get mizaj-specific score
    const mizajScore = exerciseFramework.mizaj[mizaj]?.score || 5;

    return mizajScore / 10;
  }

  /**
   * Score exercise based on TCM pattern (syndrome)
   */
  scoreTCM(exercise, userAssessment) {
    const pattern = userAssessment.pattern?.toLowerCase().replace(/\s+/g, '_') || 'qi_stagnation';
    const exerciseFramework = exercise.framework?.tcm;

    if (!exerciseFramework || !exerciseFramework.pattern) {
      return 5;
    }

    // Get pattern-specific score
    const patternScore = exerciseFramework.pattern[pattern]?.score || 5;

    return patternScore / 10;
  }

  /**
   * Score exercise based on Modern fitness goals
   */
  scoreModern(exercise, userAssessment) {
    const goal = userAssessment.goal?.toLowerCase() || 'relaxation';
    const exerciseFramework = exercise.framework?.modern;

    if (!exerciseFramework || !exerciseFramework.goal) {
      return 5;
    }

    // Get goal-specific score
    const goalScore = exerciseFramework.goal[goal]?.score || 5;

    // Consider secondary goals if available
    let secondaryScore = 0;
    if (userAssessment.secondaryGoals && Array.isArray(userAssessment.secondaryGoals)) {
      const secondaryScores = userAssessment.secondaryGoals.map(
        (g) => exerciseFramework.goal[g.toLowerCase()]?.score || 5
      );
      secondaryScore = secondaryScores.reduce((a, b) => a + b, 0) / (secondaryScores.length || 1);
    }

    // Weighted: 80% primary, 20% secondary
    return (goalScore * 0.8 + secondaryScore * 0.2) / 10;
  }

  /**
   * Get score adjustment based on difficulty level and user capacity
   */
  getDifficultyScore(difficulty, userAssessment) {
    const userLevel = userAssessment.fitnessLevel || 'beginner';

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

    const exerciseLevel = difficultyMap[difficulty] || 1;
    const userCapacity = levelMap[userLevel] || 1;

    // Matching difficulty is ideal (+0.3)
    if (exerciseLevel === userCapacity) return 0.3;
    // One level below is good (+0.1)
    if (exerciseLevel === userCapacity - 1) return 0.1;
    // One level above is acceptable (+0.05)
    if (exerciseLevel === userCapacity + 1) return 0.05;
    // Two or more levels mismatch (-0.5)
    if (Math.abs(exerciseLevel - userCapacity) >= 2) return -0.5;

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
        penalty += 0.5;
      }
    });

    return penalty;
  }

  /**
   * Filter exercises by category
   */
  filterByCategory(exercises, category) {
    if (!category) return exercises;
    return exercises.filter((e) => e.category === category.toLowerCase());
  }

  /**
   * Filter exercises by difficulty level
   */
  filterByDifficulty(exercises, difficulty) {
    if (!difficulty) return exercises;
    return exercises.filter((e) => e.difficulty === difficulty.toLowerCase());
  }

  /**
   * Filter exercises by intensity
   */
  filterByIntensity(exercises, intensity) {
    if (!intensity) return exercises;
    return exercises.filter((e) => e.intensity === intensity.toLowerCase());
  }

  /**
   * Get detailed information about a specific exercise
   */
  getExerciseDetails(exerciseId) {
    return this.exercises.find((e) => e.id === exerciseId.toLowerCase());
  }

  /**
   * Get workout recommendations for a session
   */
  async generateWorkoutSession(userAssessment, workoutType = 'balanced', durationMinutes = 30) {
    const topExercises = await this.generateExerciseRecommendations(userAssessment, 20);

    // Filter by workout type
    let selectedExercises = topExercises;
    if (workoutType === 'cardio') {
      selectedExercises = topExercises.filter((e) => e.category === 'cardio');
    } else if (workoutType === 'strength') {
      selectedExercises = topExercises.filter((e) => e.category === 'strength');
    } else if (workoutType === 'hiit') {
      selectedExercises = topExercises.filter((e) => e.category === 'hiit');
    } else if (workoutType === 'recovery') {
      selectedExercises = topExercises.filter((e) => e.category === 'recovery');
    }

    const targetDurationSeconds = durationMinutes * 60;
    const workout = [];
    let currentDuration = 0;
    let sequenceOrder = 1;

    // Warm-up
    const warmup = selectedExercises.find((e) => e.difficulty === 'beginner');
    if (warmup) {
      workout.push({
        ...warmup,
        sequenceOrder,
        holdDuration: Math.min(warmup.duration, 300),
      });
      currentDuration += warmup.duration;
      sequenceOrder++;
    }

    // Main exercises
    for (const exercise of selectedExercises) {
      if (
        currentDuration + exercise.duration > targetDurationSeconds * 0.8 ||
        exercise.id === warmup?.id
      )
        break;
      workout.push({
        ...exercise,
        sequenceOrder,
        holdDuration: Math.min(exercise.duration, 600),
      });
      currentDuration += exercise.duration;
      sequenceOrder++;
    }

    // Cool-down (recovery)
    const cooldown = selectedExercises.find(
      (e) => e.category === 'recovery' || e.id === 'light_walking'
    );
    if (cooldown) {
      workout.push({
        ...cooldown,
        sequenceOrder,
        holdDuration: Math.min(cooldown.duration, (targetDurationSeconds - currentDuration) * 0.8),
      });
    }

    return workout;
  }

  /**
   * Get explanation for why an exercise is recommended
   */
  getRecommendationExplanation(exercise, userAssessment, framework) {
    const exerciseFramework = exercise.framework?.[framework.toLowerCase()];
    if (!exerciseFramework) return 'This exercise supports your overall fitness.';

    if (framework.toLowerCase() === 'ayurveda') {
      const constitution = userAssessment.constitution?.toLowerCase() || 'vata';
      return exerciseFramework.dosha?.[constitution]?.reason || 'Beneficial for your constitution.';
    }

    if (framework.toLowerCase() === 'unani') {
      const mizaj = userAssessment.mizaj?.toLowerCase().replace(/\s+/g, '_') || 'hot_moist';
      return exerciseFramework.mizaj?.[mizaj]?.reason || 'Balancing for your mizaj.';
    }

    if (framework.toLowerCase() === 'tcm') {
      const pattern = userAssessment.pattern?.toLowerCase().replace(/\s+/g, '_') || 'qi_stagnation';
      return exerciseFramework.pattern?.[pattern]?.reason || 'Supports your energy patterns.';
    }

    if (framework.toLowerCase() === 'modern') {
      const goal = userAssessment.goal?.toLowerCase() || 'relaxation';
      return exerciseFramework.goal?.[goal]?.reason || 'Aligned with your fitness goals.';
    }

    return 'Tailored for your fitness journey.';
  }

  /**
   * Get all available exercises
   */
  getAllExercises() {
    return this.exercises;
  }

  /**
   * Get exercise count
   */
  getExerciseCount() {
    return this.exercises.length;
  }

  /**
   * Get exercises by category
   */
  getExercisesByCategory(category) {
    return this.exercises.filter((e) => e.category === category.toLowerCase());
  }
}

module.exports = new ExerciseRecommendationEngine();
