'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Activity, Moon, Wind, ChevronRight, Zap } from 'lucide-react'
import { getToken } from '@/lib/api'
import { ActivityCard } from './activity-card'

export function YogaLifestyle() {
  const router = useRouter()
  const [yoga, setYoga] = useState<any[]>([])
  const [exercise, setExercise] = useState<any[]>([])
  const [breathing, setBreathing] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<any>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      const token = getToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      try {
        const response = await fetch('https://nutrifusion-backend.onrender.com/api/activities/recommendations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success) {
          setYoga(data.data.yoga || [])
          setExercise(data.data.exercise || [])
          setBreathing(data.data.breathing || [])
          setMetadata(data.metadata)
        } else {
          setError(data.message || 'Failed to fetch recommendations')
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setError(err instanceof Error ? err.message : 'Error fetching recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  const handleStartSession = async () => {
    const token = getToken()
    if (!token) return

    try {
      // Combine all activities
      const allActivities = [
        ...yoga,
        ...exercise,
        ...breathing
      ]

      // Start session via API
      const response = await fetch('https://nutrifusion-backend.onrender.com/api/activities/start-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activities: allActivities })
      })

      const data = await response.json()

      if (data.success) {
        // Navigate to session page with session data
        router.push(`/activities/session?sessionId=${data.data.sessionId}`)
      } else {
        console.error('Failed to start session:', data.message)
      }
    } catch (err) {
      console.error('Error starting session:', err)
    }
  }

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <Wind className="w-6 h-6 text-teal-600" />
          Yoga, Exercise & Breathing
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-3xl p-6 h-96 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <Wind className="w-6 h-6 text-teal-600" />
          Yoga, Exercise & Breathing
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-6 text-red-700 dark:text-red-300">
          {error}
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Wind className="w-6 h-6 text-teal-600" />
            Yoga, Exercise & Breathing
          </h2>
          {metadata && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Personalized for your {metadata.framework} profile ({metadata.constitution})
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yoga Section */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Wind className="w-5 h-5 text-teal-600" />
              Yoga
            </h3>
            <div className="space-y-3 mb-6">
              {yoga.length > 0 ? (
                yoga.map((item, idx) => <ActivityCard key={idx} activity={item} />)
              ) : (
                <p className="text-sm text-slate-600">No yoga recommendations available</p>
              )}
            </div>
          </div>
        </div>

        {/* Exercise Section */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Exercise
            </h3>
            <div className="space-y-3 mb-6">
              {exercise.length > 0 ? (
                exercise.map((item, idx) => <ActivityCard key={idx} activity={item} />)
              ) : (
                <p className="text-sm text-slate-600">No exercise recommendations available</p>
              )}
            </div>
          </div>
        </div>

        {/* Breathing Section */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Breathing
            </h3>
            <div className="space-y-3 mb-6">
              {breathing.length > 0 ? (
                breathing.map((item, idx) => <ActivityCard key={idx} activity={item} />)
              ) : (
                <p className="text-sm text-slate-600">No breathing recommendations available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Start Session Button */}
      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleStartSession}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-full px-8 py-3 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          Start Session
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  )
}

