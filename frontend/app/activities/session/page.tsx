'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SessionPlayer } from '@/components/activities/session-player'
import { getToken } from '@/lib/api'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function ActivitySessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // If sessionId is provided, fetch the session data
        if (sessionId) {
          const token = getToken()
          if (!token) {
            setError('Not authenticated')
            return
          }

          // Note: In a real app, you'd have an endpoint to get session details
          // For now, we'll fetch recommendations again
          const response = await fetch('http://localhost:5000/api/activities/recommendations', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          const data = await response.json()
          if (data.success) {
            const allActivities = [
              ...data.data.yoga,
              ...data.data.exercise,
              ...data.data.breathing
            ]
            setActivities(allActivities)
          } else {
            setError(data.message || 'Failed to fetch activities')
          }
        } else {
          setError('No session ID provided')
        }
      } catch (err) {
        console.error('Error fetching session data:', err)
        setError(err instanceof Error ? err.message : 'Error loading session')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionData()
  }, [sessionId])

  const handleSessionComplete = async (completedActivities: any[]) => {
    const token = getToken()
    if (!token) return

    try {
      // Send completion data to API
      const response = await fetch('http://localhost:5000/api/activities/complete-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          completedActivities,
        })
      })

      const data = await response.json()
      if (data.success) {
        // Show completion message and redirect
        router.push('/dashboard?sessionComplete=true')
      }
    } catch (err) {
      console.error('Error completing session:', err)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="user">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading your activity session...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || activities.length === 0) {
    return (
      <ProtectedRoute requiredRole="user">
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Unable to Load Session</h2>
            <p className="text-slate-600 mb-6">
              {error || 'No activities available for this session.'}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-teal-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-teal-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="user">
      <SessionPlayer
        activities={activities}
        sessionId={sessionId || ''}
        onSessionComplete={handleSessionComplete}
      />
    </ProtectedRoute>
  )
}

export default function ActivitySessionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <ActivitySessionContent />
    </Suspense>
  )
}
