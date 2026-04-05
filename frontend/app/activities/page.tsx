'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Wind, Activity, Zap, BarChart3, Calendar } from 'lucide-react'
import { getToken } from '@/lib/api'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function ActivitiesPage() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken()
      if (!token) return

      try {
        // Fetch stats
        const statsResponse = await fetch('https://nutrifusion-backend.onrender.com/api/activities/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        const statsData = await statsResponse.json()
        
        if (statsData.success) {
          setStats(statsData.data)
        }

        // Fetch recent sessions
        const sessionsResponse = await fetch('https://nutrifusion-backend.onrender.com/api/activities/session-history?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
        const sessionsData = await sessionsResponse.json()
        
        if (sessionsData.success) {
          setRecentSessions(sessionsData.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute requiredRole="user">
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading your activity data...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="user">
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Your Activity Journey</h1>
            <p className="text-teal-100">Track, complete, and master your personalized wellness activities</p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Activity}
                label="Sessions Completed"
                value={stats.completedSessions}
                subtext={`${stats.completionRate}% completion rate`}
                color="from-teal-600 to-emerald-600"
              />
              <StatCard
                icon={Calendar}
                label="Total Sessions"
                value={stats.totalSessions}
                subtext="in the last 30 days"
                color="from-blue-600 to-cyan-600"
              />
              <StatCard
                icon={BarChart3}
                label="Total Time"
                value={`${stats.totalTimeSpent}m`}
                subtext={`avg ${stats.averageSessionDuration}m per session`}
                color="from-orange-600 to-amber-600"
              />
              <StatCard
                icon={Wind}
                label="Main Activity"
                value={
                  stats.activityCategoryCounts && Object.keys(stats.activityCategoryCounts).length > 0
                    ? Object.keys(stats.activityCategoryCounts)[0]
                    : 'N/A'
                }
                subtext="most practiced"
                color="from-purple-600 to-pink-600"
              />
            </div>
          )}

          {/* Start New Session */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-8 mb-8 border border-teal-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Start?</h2>
            <p className="text-slate-700 mb-6">Get personalized yoga, exercise, and breathing recommendations based on your latest assessment.</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-semibold"
            >
              View Recommendations
            </Button>
          </div>

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Sessions</h2>
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div
                    key={session._id}
                    className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            session.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </span>
                          <span className="text-sm text-slate-600">
                            {new Date(session.startedAt).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {session.activities.length} activities
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-teal-600">{session.totalDuration}m</p>
                        <p className="text-sm text-slate-600">total duration</p>
                      </div>
                    </div>
                    
                    {/* Activity types */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {[...new Set(
                        session.activities
                          .map((a: any) => a.category || '')
                          .filter(Boolean)
                      ) as Set<string>].map((category) => (
                        <span
                          key={category}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full"
                        >
                          {category === 'yoga' && <Wind className="w-3 h-3" />}
                          {category === 'exercise' && <Activity className="w-3 h-3" />}
                          {category === 'breathing' && <Zap className="w-3 h-3" />}
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentSessions.length === 0 && (
            <div className="text-center py-12">
              <Wind className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No sessions yet</h3>
              <p className="text-slate-500 mb-6">Start your first activity session from the dashboard</p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full font-semibold"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ className: string }>
  label: string
  value: string | number
  subtext: string
  color: string
}

function StatCard({ icon: Icon, label, value, subtext, color }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg`}>
      <Icon className="w-8 h-8 mb-3 opacity-70" />
      <p className="text-sm font-semibold opacity-80 mb-1">{label}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs opacity-70">{subtext}</p>
    </div>
  )
}
