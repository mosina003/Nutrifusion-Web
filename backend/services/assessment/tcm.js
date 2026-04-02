/**
 * Traditional Chinese Medicine (TCM) Assessment Engine
 * Pattern-based diagnosis focusing on:
 * - Cold/Heat patterns
 * - Qi deficiency/excess
 * - Dampness/Dryness
 * - Liver Qi stagnation/Heat
 */

class TCMEngine {
  constructor() {
    this.patternTypes = [
      'Cold Pattern',
      'Heat Pattern',
      'Qi Deficiency',
      'Qi Excess',
      'Dampness',
      'Dryness',
      'Liver Qi Stagnation',
      'Liver Heat',
      'Yin Deficiency',
      'Yang Deficiency'
    ];
  }

  /**
   * Score TCM assessment responses based on pattern recognition
   * @param {Object} responses - User responses with question IDs and answers
   * @param {Object} questionBank - Optional question bank for resolving response values
   * @returns {Object} Pattern analysis with primary/secondary patterns
   */
  score(responses, questionBank = null) {
    const patternCounts = {
      cold: 0,
      heat: 0,
      qi_deficiency: 0,
      qi_excess: 0,
      dampness: 0,
      dryness: 0,
      qi_stagnation: 0,
      liver_heat: 0,
      balanced: 0
    };

    const sectionScores = {
      A: { cold: 0, heat: 0, balanced: 0 },
      B: { qi_deficiency: 0, qi_excess: 0, heat: 0, balanced: 0 },
      C: { dampness: 0, heat: 0, balanced: 0 },
      D: { qi_stagnation: 0, heat: 0, qi_deficiency: 0, cold: 0, balanced: 0 }
    };

    // Process each response
    Object.entries(responses).forEach(([questionId, answer]) => {
      if (!answer || !answer.pattern || !answer.weight) return;

      const pattern = answer.pattern;
      const weight = answer.weight;
      const section = answer.section || this._getSection(questionId);

      // Increment pattern count
      if (patternCounts.hasOwnProperty(pattern)) {
        patternCounts[pattern] += weight;
      }

      // Track by section for detailed analysis
      if (section && sectionScores[section]) {
        if (sectionScores[section].hasOwnProperty(pattern)) {
          sectionScores[section][pattern] += weight;
        }
      }
    });

    // Determine Cold/Heat tendency (Section A)
    const coldHeatResult = this._determineColdHeat(sectionScores.A);

    // Determine Qi pattern (Section B)
    const qiPattern = this._determineQiPattern(sectionScores.B);

    // Determine Dampness pattern (Section C)
    const dampnessPattern = this._determineDampnessPattern(sectionScores.C);

    // Determine Liver pattern (Section D)
    const liverPattern = this._determineLiverPattern(sectionScores.D);

    // Aggregate all patterns to find primary and secondary
    // Only include patterns with actual scores, avoid duplicate counting
    const aggregatedPatterns = {
      'Cold Pattern': patternCounts.cold,
      'Heat Pattern': patternCounts.heat,
      'Qi Deficiency': patternCounts.qi_deficiency,
      'Qi Excess': patternCounts.qi_excess,
      'Dampness': patternCounts.dampness,
      'Dryness': patternCounts.dryness,
      'Liver Qi Stagnation': patternCounts.qi_stagnation,
      'Liver Heat': patternCounts.liver_heat,
      // Derived patterns - only show if significant
      'Yin Deficiency': patternCounts.heat > 5 && patternCounts.dryness > 0 ? Math.floor(patternCounts.heat * 0.5) : 0,
      'Yang Deficiency': patternCounts.cold > 5 && patternCounts.qi_deficiency > 0 ? Math.floor((patternCounts.cold + patternCounts.qi_deficiency) * 0.5) : 0
    };

    // Sort patterns by score
    const sortedPatterns = Object.entries(aggregatedPatterns)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0);

    const primaryPattern = sortedPatterns[0] ? sortedPatterns[0][0] : 'Balanced';
    const primaryScore = sortedPatterns[0] ? sortedPatterns[0][1] : 0;
    const secondaryPattern = sortedPatterns[1] ? sortedPatterns[1][0] : null;
    const secondaryScore = sortedPatterns[1] ? sortedPatterns[1][1] : 0;

    // Calculate severity (1-3 scale)
    const scoreDifference = primaryScore - secondaryScore;
    let severity = 1; // Mild
    if (scoreDifference >= 5) severity = 3; // Strong
    else if (scoreDifference >= 3) severity = 2; // Moderate

    // Generate description
    let pattern_description = `Your assessment reveals a ${primaryPattern} pattern`;
    if (secondaryPattern) {
      pattern_description += ` with ${secondaryPattern} tendencies`;
    }
    pattern_description += `. Your overall thermal tendency is ${coldHeatResult}.`;

    return {
      primary_pattern: primaryPattern,
      secondary_pattern: secondaryPattern,
      cold_heat: coldHeatResult,
      severity: severity,
      pattern_scores: aggregatedPatterns,
      section_analysis: {
        cold_heat: coldHeatResult,
        qi: qiPattern,
        dampness: dampnessPattern,
        liver: liverPattern
      },
      score_difference: scoreDifference,
      balance_indicator: this._getSeverityLabel(severity),
      pattern_description: pattern_description
    };
  }

  /**
   * Get section from question ID
   */
  _getSection(questionId) {
    const qNum = parseInt(questionId.replace('tcm_q', ''));
    if (qNum >= 1 && qNum <= 5) return 'A';
    if (qNum >= 6 && qNum <= 10) return 'B';
    if (qNum >= 11 && qNum <= 15) return 'C';
    if (qNum >= 16 && qNum <= 20) return 'D';
    return null;
  }

  /**
   * Determine Cold/Heat pattern from Section A
   */
  _determineColdHeat(sectionA) {
    const { cold, heat, balanced } = sectionA;
    
    if (balanced > cold && balanced > heat) return 'Balanced';
    if (cold > heat) return 'Cold';
    if (heat > cold) return 'Heat';
    return 'Balanced';
  }

  /**
   * Determine Qi pattern from Section B
   */
  _determineQiPattern(sectionB) {
    const { qi_deficiency, heat, balanced } = sectionB;
    const qi_excess = heat; // Heat symptoms in section B indicate Qi excess
    
    if (balanced > qi_deficiency && balanced > qi_excess) return 'Balanced';
    if (qi_deficiency > qi_excess) return 'Qi Deficiency';
    if (qi_excess > qi_deficiency) return 'Qi Excess';
    return 'Balanced';
  }

  /**
   * Determine Dampness pattern from Section C
   */
  _determineDampnessPattern(sectionC) {
    const { dampness, heat, balanced } = sectionC;
    
    if (balanced > dampness && balanced > heat) return 'Balanced';
    if (dampness > heat) return 'Dampness';
    if (heat > dampness) return 'Heat/Dryness';
    return 'Balanced';
  }

  /**
   * Determine Liver pattern from Section D
   */
  _determineLiverPattern(sectionD) {
    const { qi_stagnation, heat, balanced } = sectionD;
    
    if (balanced > qi_stagnation && balanced > heat) return 'Balanced';
    if (qi_stagnation > heat) return 'Liver Qi Stagnation';
    if (heat > qi_stagnation) return 'Liver Heat';
    return 'Balanced';
  }

  /**
   * Get severity label
   */
  _getSeverityLabel(severity) {
    const labels = { 1: 'mild', 2: 'moderate', 3: 'strong' };
    return labels[severity] || 'mild';
  }

  /**
   * Generate health profile from scores
   */
  generateHealthProfile(scores, userInfo) {
    const profile = {
      framework: 'tcm',
      pattern: {
        primary: scores.primary_pattern,
        secondary: scores.secondary_pattern,
        cold_heat_tendency: scores.cold_heat,
        severity: scores.severity,
        balance_status: scores.balance_indicator
      },
      section_analysis: scores.section_analysis,
      detailed_patterns: scores.pattern_scores,
      recommendations: this._generateRecommendations(scores),
      pattern_description: this._generatePatternDescription(scores),
      balancing_strategy: this._generateBalancingStrategy(scores),
      timestamp: new Date().toISOString()
    };

    return profile;
  }

  /**
   * Generate pattern description
   */
  _generatePatternDescription(scores) {
    let description = `Your TCM assessment reveals a ${scores.primary_pattern} pattern`;
    
    if (scores.secondary_pattern) {
      description += ` with ${scores.secondary_pattern} tendencies`;
    }
    
    description += `. Your overall thermal tendency is ${scores.cold_heat}.`;
    
    if (scores.severity === 3) {
      description += ' This pattern is quite pronounced and would benefit from consistent dietary and lifestyle adjustments.';
    } else if (scores.severity === 2) {
      description += ' This pattern is moderate and can be balanced with appropriate food choices.';
    } else {
      description += ' This pattern is mild and can be easily balanced with minor dietary adjustments.';
    }
    
    return description;
  }

  /**
   * Generate balancing strategy
   */
  _generateBalancingStrategy(scores) {
    let strategy = '';
    
    if (scores.cold_heat === 'Cold') {
      strategy = 'Your body needs warming support. Focus on cooked meals, warming spices like ginger and cinnamon, and avoid raw or cold foods. Regular warm soups and stews are ideal.';
    } else if (scores.cold_heat === 'Heat') {
      strategy = 'Your body needs cooling support. Include fresh vegetables, cooling fruits, and minimize spicy, fried, or heating foods. Green tea and cucumber are beneficial.';
    } else {
      strategy = 'Your thermal balance is good. Maintain a varied diet with seasonal foods and listen to your body\'s signals.';
    }
    
    if (scores.primary_pattern === 'Qi Deficiency') {
      strategy += ' Additionally, eat Qi-tonifying foods like whole grains, sweet potatoes, and well-cooked proteins to build your energy.';
    } else if (scores.primary_pattern === 'Dampness') {
      strategy += ' Also focus on reducing dampness through avoiding greasy foods and including aromatic herbs like oregano and thyme.';
    }
    
    return strategy;
  }

  /**
   * Generate basic recommendations based on patterns
   */
  _generateRecommendations(scores) {
    const recommendations = [];

    // Cold/Heat recommendations
    if (scores.cold_heat === 'Cold') {
      recommendations.push('Focus on warming foods and avoid cold/raw foods');
      recommendations.push('Prefer cooked, warm meals over salads and cold beverages');
    } else if (scores.cold_heat === 'Heat') {
      recommendations.push('Focus on cooling foods and avoid hot/spicy foods');
      recommendations.push('Include more cool-natured vegetables and fruits');
    }

    // Qi recommendations
    if (scores.primary_pattern === 'Qi Deficiency') {
      recommendations.push('Eat Qi-tonifying foods like whole grains, root vegetables, and lean proteins');
      recommendations.push('Avoid overeating and eat regular, moderate meals');
    }

    // Dampness recommendations
    if (scores.primary_pattern === 'Dampness') {
      recommendations.push('Reduce sweet, greasy, and dairy-heavy foods');
      recommendations.push('Increase dampness-resolving foods like barley, adzuki beans, and bitter greens');
    }

    // Liver recommendations
    if (scores.section_analysis.liver === 'Liver Qi Stagnation') {
      recommendations.push('Include Qi-moving foods like citrus, radish, and aromatic herbs');
      recommendations.push('Practice stress management and regular physical activity');
    }

    return recommendations;
  }

  /**
   * Generate nutrition inputs for recommendation engine
   */
  generateNutritionInputs(scores, healthProfile) {
    const inputs = {
      primary_pattern: scores.primary_pattern,
      secondary_pattern: scores.secondary_pattern,
      cold_heat: scores.cold_heat,
      severity: scores.severity,
      food_temperature: this._getFoodTemperature(scores.cold_heat),
      food_flavors: this._getBalancingFlavors(scores.primary_pattern),
      avoid_foods: this._getAvoidFoods(scores.cold_heat, scores.primary_pattern),
      cooking_methods: this._getCookingMethods(scores.cold_heat),
      meal_timing: this._getMealTiming(scores)
    };

    return inputs;
  }

  /**
   * Get food temperature recommendations
   */
  _getFoodTemperature(coldHeat) {
    if (coldHeat === 'Cold') {
      return ['warm', 'hot', 'heating'];
    } else if (coldHeat === 'Heat') {
      return ['cool', 'cold', 'cooling'];
    }
    return ['neutral', 'balanced'];
  }

  /**
   * Get balancing flavors based on pattern
   */
  _getBalancingFlavors(pattern) {
    const flavorMap = {
      'Cold Pattern': ['pungent', 'sweet', 'salty'],
      'Heat Pattern': ['bitter', 'sour', 'salty'],
      'Qi Deficiency': ['sweet', 'pungent'],
      'Qi Excess': ['bitter', 'sour'],
      'Dampness': ['pungent', 'bitter'],
      'Dryness': ['sweet', 'sour', 'salty'],
      'Liver Qi Stagnation': ['pungent', 'sour'],
      'Liver Heat': ['bitter', 'sour'],
      'Yin Deficiency': ['sweet', 'salty', 'sour'],
      'Yang Deficiency': ['pungent', 'sweet', 'salty']
    };
    return flavorMap[pattern] || ['sweet', 'pungent'];
  }

  /**
   * Get foods to avoid
   */
  _getAvoidFoods(coldHeat, pattern) {
    const avoidList = [];
    
    if (coldHeat === 'Cold') {
      avoidList.push('raw foods', 'cold beverages', 'iced foods', 'excessive salads');
    } else if (coldHeat === 'Heat') {
      avoidList.push('spicy foods', 'hot spices', 'fried foods', 'alcohol', 'red meat');
    }

    if (pattern === 'Dampness') {
      avoidList.push('greasy foods', 'dairy', 'sweets', 'fried foods');
    }

    if (pattern === 'Liver Qi Stagnation' || pattern === 'Liver Heat') {
      avoidList.push('alcohol', 'coffee', 'spicy foods', 'greasy foods');
    }

    return avoidList;
  }

  /**
   * Get cooking methods
   */
  _getCookingMethods(coldHeat) {
    if (coldHeat === 'Cold') {
      return ['stewing', 'braising', 'roasting', 'baking', 'stir-frying'];
    } else if (coldHeat === 'Heat') {
      return ['steaming', 'boiling', 'light sautéing', 'blanching'];
    }
    return ['steaming', 'boiling', 'sautéing', 'baking'];
  }

  /**
   * Get meal timing recommendations
   */
  _getMealTiming(scores) {
    return {
      breakfast: '7-9am (warm, nourishing)',
      lunch: '11am-1pm (main meal of the day)',
      dinner: '5-7pm (light, easy to digest)',
      note: 'Eat regular meals, avoid late-night eating'
    };
  }

  /**
   * Validate responses before scoring
   */
  validateResponses(responses, requiredQuestions) {
    const errors = [];

    // Check if all required questions are answered
    requiredQuestions.forEach(qId => {
      if (!responses[qId]) {
        errors.push(`Question ${qId} is required`);
      }
    });

    // Validate answer format (skip goal questions)
    Object.entries(responses).forEach(([qId, answer]) => {
      // Skip validation for goal question (uses 'goal' property)
      if (qId === 'tcm_q21' || answer.goal) {
        return;
      }
      
      if (!answer.pattern) {
        errors.push(`Missing pattern value for question ${qId}`);
      }
      if (answer.weight === undefined || answer.weight === null) {
        errors.push(`Missing weight value for question ${qId}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new TCMEngine();
