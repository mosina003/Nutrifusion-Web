'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      // Get the user's framework - backend returns preferredMedicalFramework
      const framework = (user as any)?.preferredMedicalFramework || (user as any)?.activeFramework || 'modern'
      const frameworkLower = framework.toLowerCase()
      
      console.log('🔍 Dashboard redirect:', { framework, frameworkLower, userObj: user })
      
      // Redirect to framework-specific dashboard
      router.push(`/dashboard/${frameworkLower}`)
    }
  }, [user, router])

  // Show loading state while redirecting
  return (
    <ProtectedRoute requiredRole="user">
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}

