# 🧘 Yoga Recommendation Engine - API Documentation

## Overview

The Yoga Recommendation Engine provides personalized yoga pose recommendations based on the user's health assessment and medical framework (Ayurveda, Unani, TCM, or Modern Fitness).

## Base URL
```
http://localhost:5000/api/yoga
```

## Authentication
All endpoints (except public endpoints) require:
- **Header**: `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get Personalized Yoga Recommendations

**Endpoint**: `GET /recommendations`

**Authentication**: Required (Bearer Token)

**Description**: Returns ranked yoga poses based on user's health assessment and framework.

**Query Parameters**:
- `topN` (optional, default: 10): Number of top recommendations to return (1-29)
- `sessionType` (optional, default: 'mixed'): Type of session (mixed, energizing, calming, balancing)

**Response** (200 OK):
```json
{
  "success": true,
  "framework": "ayurveda",
  "recommendations": [
    {
      "id": "child_pose",
      "name": "Child's Pose",
      "sanskritName": "Balasana",
      "difficulty": "beginner",
      "duration": 180,
      "benefits": ["Stress relief", "Hip opening", "Back relaxation"],
      "contraindications": ["Knee injury", "High blood pressure"],
      "recommendationScore": 0.85,
      "explanation": "Calming and grounding - perfect for Vata pacification"
    }
  ],
  "totalCount": 29
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "No assessment found. Please complete your health assessment first."
}
```

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/yoga/recommendations?topN=10&sessionType=calming" \
  -H "Authorization: Bearer your_token_here"
```

---

### 2. Get Specific Pose Details

**Endpoint**: `GET /pose/:poseId`

**Authentication**: Not Required

**Description**: Get detailed information about a specific yoga pose.

**URL Parameters**:
- `poseId` (required): Pose ID (e.g., 'child_pose', 'warrior_i', 'lotus_pose')

**Response** (200 OK):
```json
{
  "success": true,
  "pose": {
    "id": "warrior_i",
    "name": "Warrior I",
    "sanskritName": "Virabhadrasana I",
    "difficulty": "intermediate",
    "duration": 300,
    "benefits": ["Strengthening", "Balance", "Focus"],
    "contraindications": ["Knee problems", "Lower back issues"],
    "framework": {
      "ayurveda": {
        "dosha": {
          "vata": { "score": 8, "reason": "Grounding and stabilizing" },
          "pitta": { "score": 9, "reason": "Building confidence and power" },
          "kapha": { "score": 9, "reason": "Energizing and strengthening" }
        },
        "agni": { "low": 9, "normal": 8, "high": 7 }
      },
      "unani": { ... },
      "tcm": { ... },
      "modern": { ... }
    }
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "message": "Pose not found"
}
```

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/yoga/pose/warrior_i"
```

---

### 3. Get All Yoga Poses

**Endpoint**: `GET /poses`

**Authentication**: Not Required

**Description**: Retrieve all 29 yoga poses with optional filtering.

**Query Parameters**:
- `difficulty` (optional): 'beginner', 'intermediate', or 'advanced'
- `minDuration` (optional): Minimum duration in seconds
- `maxDuration` (optional): Maximum duration in seconds

**Response** (200 OK):
```json
{
  "success": true,
  "count": 29,
  "poses": [
    {
      "id": "child_pose",
      "name": "Child's Pose",
      "sanskritName": "Balasana",
      "difficulty": "beginner",
      "duration": 180,
      "benefits": ["Stress relief", "Hip opening", "Back relaxation"],
      "contraindications": []
    }
  ]
}
```

**Example Request**:
```bash
# Get all beginner poses
curl -X GET "http://localhost:5000/api/yoga/poses?difficulty=beginner"

# Get poses between 2-5 minutes
curl -X GET "http://localhost:5000/api/yoga/poses?minDuration=120&maxDuration=300"
```

---

### 4. Get Complete Session Recommendation

**Endpoint**: `GET /session-recommendation`

**Authentication**: Required (Bearer Token)

**Description**: Get a complete yoga session with sequenced poses tailored to user's assessment.

**Query Parameters**:
- `sessionType` (optional, default: 'mixed'): 'energizing', 'calming', 'balancing', 'mixed'
- `durationMinutes` (optional, default: 30): Desired session duration in minutes

**Response** (200 OK):
```json
{
  "success": true,
  "framework": "ayurveda",
  "sessionType": "calming",
  "estimatedDuration": 1860,
  "poses": [
    {
      "id": "mountain_pose",
      "name": "Mountain Pose",
      "sanskritName": "Tadasana",
      "difficulty": "beginner",
      "sequenceOrder": 1,
      "holdDuration": 120,
      "benefits": ["Grounding", "Alignment", "Foundation"]
    },
    {
      "id": "child_pose",
      "name": "Child's Pose",
      "sanskritName": "Balasana",
      "difficulty": "beginner",
      "sequenceOrder": 2,
      "holdDuration": 180,
      "benefits": ["Stress relief", "Hip opening", "Back relaxation"]
    }
  ]
}
```

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/yoga/session-recommendation?sessionType=calming&durationMinutes=45" \
  -H "Authorization: Bearer your_token_here"
```

---

### 5. Get Yoga Practice Statistics

**Endpoint**: `GET /stats`

**Authentication**: Required (Bearer Token)

**Description**: Get user's yoga practice statistics.

**Query Parameters**:
- `days` (optional, default: 30): Number of days to analyze

**Response** (200 OK):
```json
{
  "success": true,
  "stats": {
    "totalSessions": 12,
    "totalMinutes": 480,
    "completedSessions": 10,
    "avgDuration": 40,
    "mostPracticedType": "yoga",
    "yogaSessions": 12,
    "topPoses": [
      {
        "name": "Child's Pose",
        "count": 8
      },
      {
        "name": "Warrior I",
        "count": 6
      }
    ]
  }
}
```

**Example Request**:
```bash
curl -X GET "http://localhost:5000/api/yoga/stats?days=30" \
  -H "Authorization: Bearer your_token_here"
```

---

### 6. Rate a Yoga Pose

**Endpoint**: `POST /rate-pose`

**Authentication**: Required (Bearer Token)

**Description**: Record user's feedback/rating for a yoga pose.

**Request Body**:
```json
{
  "poseId": "warrior_i",
  "rating": 5,
  "feedback": "Great pose! Really helped with my lower back."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Thank you for your feedback",
  "data": {
    "poseId": "warrior_i",
    "rating": 5,
    "feedback": "Great pose! Really helped with my lower back.",
    "recordedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:5000/api/yoga/rate-pose" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "poseId": "warrior_i",
    "rating": 5,
    "feedback": "Excellent for building strength"
  }'
```

---

## Pose IDs Reference

All 29 yoga poses available in the system:

**Beginner Poses**:
- `child_pose` - Child's Pose (Balasana)
- `mountain_pose` - Mountain Pose (Tadasana)
- `tree_pose` - Tree Pose (Vrksasana)
- `butterfly_pose` - Butterfly Pose (Bhadrásana)
- `triangle_pose` - Triangle Pose (Trikonasana)
- `standing_forward_fold` - Standing Forward Fold (Uttanasana)
- `legs_up_wall` - Legs Up Wall (Viparita Karani)
- `corpse_pose` - Corpse Pose (Savasana)
- `happy_baby` - Happy Baby Pose (Ananda Balasana)
- `staff_pose` - Staff Pose (Dandasana)
- `half_split` - Half Split (Ardha Uttanasana)
- `low_lunge` - Low Lunge (Anjaneyasana)
- `downward_dog` - Downward Dog (Adhomukha Svanasana)
- `cat_cow` - Cat-Cow Pose (Marjaryasana-Bitilasana)

**Intermediate Poses**:
- `warrior_i` - Warrior I (Virabhadrasana I)
- `warrior_ii` - Warrior II (Virabhadrasana II)
- `cobra_pose` - Cobra Pose (Bhujangasana)
- `bridge_pose` - Bridge Pose (Setu Bandha Sarvangasana)
- `sun_salutation_a` - Sun Salutation A (Surya Namaskar A)
- `seated_forward_fold` - Seated Forward Fold (Paschimottanasana)
- `spinal_twist` - Spinal Twist (Ardha Matsyendrasana)
- `pigeon_pose` - Pigeon Pose (Eka Pada Rajakapotasana Prep)
- `hand_to_big_toe` - Hand to Big Toe Pose (Utthita Hasta Padangusthasana)
- `four_limbed_staff` - Four Limbed Staff Pose (Chaturanga Dandasana)

**Advanced Poses**:
- `boat_pose` - Boat Pose (Navasana)
- `plank_pose` - Plank Pose (Phalakasana)
- `lotus_pose` - Lotus Pose (Padmasana)
- `shoulder_stand` - Shoulder Stand (Sarvangasana)
- `headstand` - Headstand (Sirsasana)

---

## Scoring System

### Recommendation Score (0-1 scale)

The engine calculates scores based on:

1. **Framework-Specific Base Score** (70%):
   - **Ayurveda**: Dosha balancing (Vata/Pitta/Kapha) + Agni influence
   - **Unani**: Mizaj impact (Hot-Moist/Hot-Dry/Cold-Moist/Cold-Dry)
   - **TCM**: Pattern alignment (Yin-deficiency/Yang-deficiency/Qi-stagnation)
   - **Modern**: Goal achievement (Flexibility/Strength/Balance/Relaxation/Cardio)

2. **Difficulty Adjustment** (15%):
   - Bonus for matching user's yoga level
   - Penalty for extreme difficulty mismatches

3. **Contraindication Penalty** (15%):
   - Significant penalty if pose contradicts known conditions
   - Factors: Medical conditions, injuries, limitations

### Score Interpretation:
- **0.9-1.0**: Highly recommended - perfect match
- **0.7-0.9**: Strongly recommended
- **0.5-0.7**: Moderately recommended
- **0.3-0.5**: Somewhat suitable
- **<0.3**: Use with caution

---

## Framework-Specific Scoring Details

### Ayurveda Score Components
```
Final Score = (Dosha Score × 0.7 + Agni Score × 0.3) / 10
+ Difficulty Adjustment
- Contraindication Penalty
```

**Dosha Scores** (each 1-10):
- Vata: Grounding, calming, stabilizing poses score highest
- Pitta: Cooling, balanced intensity, focus-building poses
- Kapha: Energizing, mobilizing, strengthening poses

**Agni Scores** (1-10):
- Low agni: Gentle, calming poses
- Normal agni: Balanced poses
- High agni: Can handle more intense practices

### Unani Score Components
```
Final Score = Mizaj-specific Score / 10
+ Difficulty Adjustment
- Contraindication Penalty
```

**Mizaj Scores** (each 1-10):
- Hot-Moist: Cooling, calming poses
- Hot-Dry: Cooling, moistening poses
- Cold-Moist: Warming, mobilizing poses
- Cold-Dry: Warming, activating poses

### TCM Score Components
```
Final Score = Pattern-specific Score / 10
+ Difficulty Adjustment
- Contraindication Penalty
```

**Pattern Scores** (each 1-10):
- Yin-deficiency: Nourishing, restorative poses
- Yang-deficiency: Warming, activating poses
- Qi-stagnation: Dynamic, mobilizing poses

### Modern Score Components
```
Final Score = (Primary Goal Score × 0.8 + Secondary Goals × 0.2) / 10
+ Difficulty Adjustment
- Contraindication Penalty
```

**Goal Scores** (each 1-10):
- Flexibility: Stretching, opening poses
- Strength: Core, resistance poses
- Balance: Stability-challenging poses
- Relaxation: Calming, restorative poses
- Cardio: Dynamic, flowing poses

---

## Error Handling

All endpoints follow standard HTTP status codes:

- **200**: Success
- **400**: Bad request (missing required fields, invalid parameters)
- **401**: Unauthorized (missing/invalid token)
- **404**: Resource not found
- **500**: Server error

**Error Response Format**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info (development only)"
}
```

---

## Rate Limiting

To be implemented: API rate limiting (currently no limits)

---

## Examples & Use Cases

### Use Case 1: Get Morning Energizing Routine
```bash
curl -X GET "http://localhost:5000/api/yoga/session-recommendation?sessionType=energizing&durationMinutes=20" \
  -H "Authorization: Bearer token"
```

### Use Case 2: Find Cooling Poses for Pitta Imbalance
```bash
curl -X GET "http://localhost:5000/api/yoga/recommendations?topN=5" \
  -H "Authorization: Bearer token"
```
Returns top 5 poses (will include cooling poses if user is Pitta-dominant Ayurveda)

### Use Case 3: Check Difficulty Levels
```bash
curl -X GET "http://localhost:5000/api/yoga/poses?difficulty=beginner"
```

### Use Case 4: Build Custom Sequence
1. Get all available poses: `GET /poses`
2. Get individual details: `GET /pose/{poseId}`
3. Build custom sequence in frontend using pose data

---

## Integration with Assessment System

The yoga recommendation engine automatically integrates with user assessments:

1. User completes health assessment (Ayurveda/Unani/TCM/Modern)
2. Assessment data stored in `Assessment` model with:
   - Framework (ayurveda/unani/tcm/modern)
   - Constitution/Mizaj/Pattern/Goal
   - Medical conditions, injuries
   - Yoga level (beginner/intermediate/advanced)
3. Yoga endpoints fetch latest assessment
4. Recommendations generated based on framework

---

## Future Enhancements

- [ ] User pose preferences/favorites
- [ ] Historical recommendation tracking
- [ ] Pose progression recommendations
- [ ] Integration with wearable devices
- [ ] Real-time form correction (computer vision)
- [ ] Community-based pose ratings
- [ ] Seasonal recommendations
- [ ] Time-based recommendations (morning/evening)

---

## Support & Troubleshooting

**Issue**: "No assessment found"
- **Solution**: Complete health assessment first via `/api/assessments`

**Issue**: Empty recommendations
- **Solution**: Verify assessment framework matches your needs

**Issue**: Unexpected scores
- **Solution**: Check user yoga level, medical conditions, and injuries are properly recorded

---

**Last Updated**: 2024
**Version**: 1.0.0
