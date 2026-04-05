'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Activity, Wind, Zap, Play, Pause, SkipBack, SkipForward, X, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface Activity {
  name: string
  displayName: string
  duration: string
  benefit: string
  intensity?: string
  category: string
  id: string
}

interface SessionPlayerProps {
  activities: Activity[]
  sessionId: string
  onSessionComplete: (completed: Activity[]) => void
}

interface YogaPose {
  id: string
  name: string
  sanskritName: string
  imagePath: string
  instructions: string[]
  benefits: string[]
  difficulty: string
}

interface BreathingExercise {
  id: string
  name: string
  displayName: string
  framework: string
  duration: string
  benefit: string
  intensity: string
  instructions: string[]
}

const categoryConfig = {
  yoga: {
    icon: Wind,
    bgColor: 'from-teal-50 to-emerald-50',
    textColor: 'text-teal-600',
    accentColor: 'bg-teal-500',
  },
  exercise: {
    icon: Activity,
    bgColor: 'from-orange-50 to-amber-50',
    textColor: 'text-orange-600',
    accentColor: 'bg-orange-500',
  },
  breathing: {
    icon: Zap,
    bgColor: 'from-purple-50 to-pink-50',
    textColor: 'text-purple-600',
    accentColor: 'bg-purple-500',
  },
}

export function SessionPlayer({ activities, sessionId, onSessionComplete }: SessionPlayerProps) {
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [completedActivities, setCompletedActivities] = useState<Activity[]>([])
  const [yogaPose, setYogaPose] = useState<YogaPose | null>(null)
  const [breathingExercise, setBreathingExercise] = useState<BreathingExercise | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoadingYogaPose, setIsLoadingYogaPose] = useState(false)
  const [isLoadingBreathingExercise, setIsLoadingBreathingExercise] = useState(false)
  const [dailyCompletion, setDailyCompletion] = useState<any>(null)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const [yogaImageCache, setYogaImageCache] = useState<{ [key: string]: boolean }>({})

  const currentActivity = activities[currentActivityIndex]
  const config = categoryConfig[currentActivity?.category as keyof typeof categoryConfig]
  const IconComponent = config?.icon

  // Function to fetch daily completion status
  const fetchDailyCompletion = useCallback(async () => {
    try {
      const response = await fetch('https://nutrifusion-backend.onrender.com/api/activities/daily-completion', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDailyCompletion(data)
      }
    } catch (error) {
      console.error('Error fetching daily completion:', error)
    }
  }, [])

  // Function to mark activity as complete in the backend
  const markActivityComplete = useCallback(async (activity: Activity) => {
    try {
      setIsMarkingComplete(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.warn('No authentication token found')
        return
      }
      
      const response = await fetch('https://nutrifusion-backend.onrender.com/api/activities/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          activityName: activity.name,
          category: activity.category,
          duration: activity.duration,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Fetch updated completion status
        fetchDailyCompletion()
      } else if (response.status === 401) {
        console.error('Unauthorized - token may be invalid or expired')
      } else {
        console.error('Error marking activity complete:', response.statusText)
      }
    } catch (error) {
      console.error('Error marking activity complete:', error)
    } finally {
      setIsMarkingComplete(false)
    }
  }, [fetchDailyCompletion])

  // Pre-load yoga images on component mount
  useEffect(() => {
    const preLoadYogaImages = async () => {
      try {
        const response = await fetch('https://nutrifusion-backend.onrender.com/api/yoga/poses')
        const data = await response.json()
        
        if (data.success && Array.isArray(data.poses)) {
          const cache: { [key: string]: boolean } = {}
          
          // Pre-load all yoga images from the correct imagePath in database
          data.poses.forEach((pose: any) => {
            const img = new Image()
            img.onload = () => {
              cache[pose.id] = true
            }
            img.onerror = () => {
              console.warn(`Failed to pre-load image for ${pose.name}: ${pose.imagePath}`)
            }
            if (pose.imagePath) {
              img.src = pose.imagePath
            }
          })
          
          setYogaImageCache(cache)
        }
      } catch (error) {
        console.error('Error pre-loading yoga images:', error)
      }
    }
    
    preLoadYogaImages()
  }, [])

  // Clear yoga pose and breathing exercise data when activity index changes (before fetching new data)
  useEffect(() => {
    setYogaPose(null)
    setBreathingExercise(null)
    setImageError(false)
  }, [currentActivityIndex])

  // Fetch yoga pose details when activity changes
  useEffect(() => {
    if (currentActivity?.category === 'yoga' && currentActivity?.id) {
      // Images are pre-loaded, so no loading state needed for the image itself
      const fetchYogaPose = async () => {
        try {
          // Normalize the pose ID: remove 'yoga-' prefix
          // Backend now generates IDs with underscores and removes apostrophes already
          const normalizedId = currentActivity.id.replace(/^yoga-/, '')
          
          const response = await fetch(`https://nutrifusion-backend.onrender.com/api/yoga/pose/${normalizedId}`)
          const data = await response.json()
          if (data.success) {
            setYogaPose(data.pose)
            setImageError(false)
            setIsLoadingYogaPose(false)
          }
        } catch (error) {
          console.error('Error fetching yoga pose:', error)
          setYogaPose(null)
          setIsLoadingYogaPose(false)
        }
      }
      fetchYogaPose()
    } else {
      setYogaPose(null)
      setIsLoadingYogaPose(false)
    }
  }, [currentActivity?.id, currentActivity?.category])

  // Fetch breathing exercise details when activity changes
  useEffect(() => {
    if (currentActivity?.category === 'breathing' && currentActivity?.id) {
      setIsLoadingBreathingExercise(true)
      const fetchBreathingExercise = async () => {
        try {
          // Normalize the breathing exercise ID: remove 'breathing-' prefix
          const normalizedId = currentActivity.id.replace(/^breathing-/, '')
          
          const response = await fetch(`https://nutrifusion-backend.onrender.com/api/breathing/technique/${normalizedId}`)
          const data = await response.json()
          if (data.success) {
            setBreathingExercise(data.technique)
            setIsLoadingBreathingExercise(false)
          }
        } catch (error) {
          console.error('Error fetching breathing exercise:', error)
          setBreathingExercise(null)
          setIsLoadingBreathingExercise(false)
        }
      }
      fetchBreathingExercise()
    } else {
      setBreathingExercise(null)
      setIsLoadingBreathingExercise(false)
    }
  }, [currentActivity?.id, currentActivity?.category])

  // Parse duration to get minutes
  const getDurationInMinutes = (duration: string) => {
    const match = duration.match(/(\d+)/)
    return match ? parseInt(match[1]) : 1
  }

  // Initialize timer
  useEffect(() => {
    if (currentActivity) {
      const minutes = getDurationInMinutes(currentActivity.duration)
      setTimeRemaining(minutes * 60) // Convert to seconds
    }
  }, [currentActivity])

  // Timer effect
  useEffect(() => {
    if (!isPlaying || timeRemaining <= 0) {
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1)
        if (newTime === 0) {
          // Auto-advance to next activity when timer ends
          setCurrentActivityIndex((prevIdx) => {
            if (prevIdx < activities.length - 1) {
              setIsPlaying(false)
              // Mark current activity as complete
              if (currentActivity && !completedActivities.some(a => a.id === currentActivity.id)) {
                markActivityComplete(currentActivity)
              }
              // Set time for next activity
              const nextMinutes = getDurationInMinutes(activities[prevIdx + 1].duration)
              setTimeRemaining(nextMinutes * 60)
              return prevIdx + 1
            } else {
              // Session complete
              setIsPlaying(false)
              if (currentActivity && !completedActivities.some(a => a.id === currentActivity.id)) {
                markActivityComplete(currentActivity)
              }
              onSessionComplete([...completedActivities, currentActivity!])
              return prevIdx
            }
          })
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, activities, completedActivities, currentActivity, onSessionComplete, markActivityComplete])

  const handleNext = useCallback(() => {
    if (currentActivityIndex < activities.length - 1) {
      setCompletedActivities((prev) => {
        if (currentActivity && !prev.some(a => a.id === currentActivity.id)) {
          // Mark activity as complete in backend
          markActivityComplete(currentActivity)
          return [...prev, currentActivity]
        }
        return prev
      })
      setCurrentActivityIndex(currentActivityIndex + 1)
      setIsPlaying(false)
      const nextMinutes = getDurationInMinutes(activities[currentActivityIndex + 1].duration)
      setTimeRemaining(nextMinutes * 60)
    } else {
      // Session complete
      if (currentActivity && !completedActivities.some(a => a.id === currentActivity.id)) {
        markActivityComplete(currentActivity)
      }
      setIsPlaying(false)
      onSessionComplete([...completedActivities, currentActivity!])
    }
  }, [currentActivityIndex, activities, currentActivity, completedActivities, onSessionComplete, markActivityComplete])

  const handlePrevious = useCallback(() => {
    if (currentActivityIndex > 0) {
      // Remove current from completed if it was completed
      let updated = completedActivities
      if (updated.some(a => a.id === currentActivity?.id)) {
        updated = updated.filter(a => a.id !== currentActivity?.id)
        setCompletedActivities(updated)
      }

      setCurrentActivityIndex(currentActivityIndex - 1)
      setIsPlaying(false)
      const prevMinutes = getDurationInMinutes(activities[currentActivityIndex - 1].duration)
      setTimeRemaining(prevMinutes * 60)
    }
  }, [currentActivityIndex, activities, completedActivities, currentActivity])

  const handleSessionComplete = () => {
    setIsPlaying(false)
    onSessionComplete([...completedActivities, currentActivity])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = ((currentActivityIndex + 1) / activities.length) * 100

  // Check if all activities are completed
  const allActivitiesCompleted = completedActivities.length === activities.length && activities.length > 0

  if (!currentActivity) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No activities available</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgColor} p-6`}>
      {/* Completion Success Banner */}
      {allActivitiesCompleted && (
        <div className="fixed top-4 right-4 left-4 z-50 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl shadow-2xl p-6 flex items-center gap-4 animate-bounce">
            <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
            <div>
              <p className="font-bold text-lg">All Activities Completed!</p>
              <p className="text-sm opacity-90">Great job! You've finished your daily wellness routine.</p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-2xl mx-auto">
        {/* Completion Success Screen */}
        {allActivitiesCompleted && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 rounded-3xl">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Congratulations!</h2>
              <p className="text-slate-600 mb-6">You've completed all your daily wellness activities.</p>
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{completedActivities.length}</span> of <span className="font-semibold">{activities.length}</span> activities completed
                </p>
              </div>
              <Button
                onClick={() => onSessionComplete(completedActivities)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
              >
                Continue to Dashboard
              </Button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Activity Session</h1>
          <div className={`text-sm font-semibold ${config.textColor}`}>
            {currentActivityIndex + 1} of {activities.length}
          </div>
        </div>

        {allActivitiesCompleted ? (
          // Don't show the player UI when all activities are completed
          <div className="h-96"></div>
        ) : (
          <>
        {/* Progress Bar */}
        <Progress value={progressPercentage} className="mb-8" />

        {/* Current Activity Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          {/* Activity Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`${config.textColor} bg-white p-3 rounded-full`}>
              {IconComponent && <IconComponent className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${config.textColor} uppercase tracking-wide mb-1`}>
                {currentActivity.category}
              </p>
              <h2 className="text-3xl font-bold text-slate-900">{currentActivity.displayName}</h2>
              <p className="text-slate-600 mt-2">{currentActivity.benefit}</p>
            </div>
          </div>

          {/* Intensity Badge */}
          {currentActivity.intensity && (
            <div className="mb-6 flex gap-2">
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full">
                {currentActivity.intensity.charAt(0).toUpperCase() + currentActivity.intensity.slice(1)} Intensity
              </span>
            </div>
          )}

          {/* Timer Section */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 mb-8 text-center">
            <p className="text-slate-600 text-sm font-semibold mb-2">Time Remaining</p>
            <div className={`text-6xl font-bold ${config.textColor} font-mono mb-4`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-slate-600 text-sm">
              Total Duration: {currentActivity.duration}
            </p>
          </div>

          {/* Yoga Image and Instructions */}
          {currentActivity.category === 'yoga' && (
            <div className="mb-8">
              {/* Yoga Image */}
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-4 mb-6 flex items-center justify-center min-h-64">
                {isLoadingYogaPose ? (
                  <div className="text-center text-slate-500">
                    <div className="w-16 h-16 mx-auto mb-2 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                    <p className="text-sm">Loading pose...</p>
                  </div>
                ) : yogaPose?.imagePath && !imageError ? (
                  <img
                    src={yogaPose.imagePath}
                    alt={yogaPose.name}
                    className="max-h-64 max-w-full rounded-lg object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <Wind className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Image not available</p>
                  </div>
                )}
              </div>

              {/* Pose Details */}
              {yogaPose && !isLoadingYogaPose && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Sanskrit Name</p>
                      <p className="font-semibold text-slate-700">{yogaPose.sanskritName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600 mb-1">Difficulty</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        yogaPose.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                        yogaPose.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {yogaPose.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Benefits */}
                  {yogaPose.benefits && yogaPose.benefits.length > 0 && (
                    <div className="mb-6 bg-teal-50 rounded-lg p-4 border border-teal-100">
                      <p className="text-xs font-semibold text-teal-700 mb-2">Benefits</p>
                      <div className="flex flex-wrap gap-2">
                        {yogaPose.benefits.map((benefit: string, idx: number) => (
                          <span key={idx} className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Instructions Area */}
          {currentActivity.category === 'yoga' ? (
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-slate-900 mb-4">How to Perform</h3>
              {isLoadingYogaPose ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">Loading instructions...</p>
                  </div>
                </div>
              ) : (
                <ol className="space-y-3 text-slate-700">
                  {yogaPose?.instructions && yogaPose.instructions.length > 0 ? (
                    yogaPose.instructions.map((instruction: string, idx: number) => (
                      <li key={idx} className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold min-w-fit`}>{idx + 1}.</span>
                        <span className="leading-relaxed">{instruction.replace(/^\d+\.\s*/, '')}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold`}>1.</span>
                        <span>Find a comfortable space with enough room to move freely.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold`}>2.</span>
                        <span>Start when you're ready by pressing the Play button below.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold`}>3.</span>
                        <span>Focus on the activity and your breathing throughout.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold`}>4.</span>
                        <span>When the timer reaches zero, you'll automatically move to the next activity.</span>
                      </li>
                    </>
                  )}
                </ol>
              )}
            </div>
          ) : currentActivity.category === 'breathing' ? (
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-slate-900 mb-4">How to Perform</h3>
              {isLoadingBreathingExercise ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">Loading instructions...</p>
                  </div>
                </div>
              ) : (
                <ol className="space-y-3 text-slate-700">
                  {breathingExercise?.instructions && breathingExercise.instructions.length > 0 ? (
                    breathingExercise.instructions.map((instruction: string, idx: number) => (
                      <li key={idx} className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold min-w-fit`}>{idx + 1}.</span>
                        <span className="leading-relaxed">{instruction}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold`}>1.</span>
                        <span>Find a comfortable, quiet space.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold`}>2.</span>
                        <span>Sit in a relaxed position with good posture.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold`}>3.</span>
                        <span>Start when you're ready by pressing the Play button below.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className={`${config.textColor} flex-shrink-0 font-bold`}>4.</span>
                        <span>Focus on your breath and follow the exercise duration.</span>
                      </li>
                    </>
                  )}
                </ol>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-slate-900 mb-4">How to Perform</h3>
              <ol className="space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className={`${config.textColor} flex-shrink-0 font-bold`}>1.</span>
                  <span>Find a comfortable space with enough room to move freely.</span>
                </li>
                <li className="flex gap-3">
                  <span className={`${config.textColor} flex-shrink-0 font-bold`}>2.</span>
                  <span>Start when you're ready by pressing the Play button below.</span>
                </li>
                <li className="flex gap-3">
                  <span className={`${config.textColor} flex-shrink-0 font-bold`}>3.</span>
                  <span>Focus on the activity and your breathing throughout.</span>
                </li>
                <li className="flex gap-3">
                  <span className={`${config.textColor} flex-shrink-0 font-bold`}>4.</span>
                  <span>When the timer reaches zero, you'll automatically move to the next activity.</span>
                </li>
              </ol>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentActivityIndex === 0}
              className="h-12 w-12"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`h-14 w-14 rounded-full ${config.accentColor} text-white hover:opacity-90 transition-opacity`}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentActivityIndex === activities.length - 1 && isPlaying}
              className="h-12 w-12"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Session Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Session Summary</h3>
          <div className="space-y-2">
            {activities.map((activity, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  completedActivities.some(a => a.id === activity.id)
                    ? 'bg-green-50 border border-green-200'
                    : idx === currentActivityIndex
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-slate-50'
                }`}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                  {completedActivities.some(a => a.id === activity.id) ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : idx === currentActivityIndex ? (
                    <span className="text-blue-600 font-bold">●</span>
                  ) : (
                    <span className="text-slate-400">○</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{activity.displayName}</p>
                  <p className="text-xs text-slate-600">{activity.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skip Session Button */}
        {isPlaying && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={handleSessionComplete}
              className="text-slate-600 hover:text-slate-900"
            >
              <X className="w-4 h-4 mr-2" />
              Exit Session
            </Button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
