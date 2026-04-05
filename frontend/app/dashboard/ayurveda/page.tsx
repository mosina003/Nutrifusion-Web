'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, LogOut, Settings, CheckCircle2, X, Heart, Apple, Dumbbell, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { Recommendations } from '@/components/dashboard/recommendations'
import { DietPlanTimeline } from '@/components/dashboard/diet-plan-timeline'
import { HealthInsights } from '@/components/dashboard/health-insights'
import { YogaLifestyle } from '@/components/dashboard/yoga-lifestyle'
import { NotificationsDropdown } from '@/components/notifications-dropdown'
import { SettingsModal } from '@/components/settings-modal'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

function AyurvedaDashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showCompletion, setShowCompletion] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Debug: Log user data
  useEffect(() => {
    console.log('🔍 Ayurveda Dashboard User Data:', {
      user,
      name: user?.name,
      email: user?.email,
      preferredMedicalFramework: (user as any)?.preferredMedicalFramework,
      activeFramework: (user as any)?.activeFramework,
      fullObject: JSON.stringify(user, null, 2)
    })
  }, [user])

  // Check for session completion
  useEffect(() => {
    if (searchParams.get('sessionComplete') === 'true') {
      setShowCompletion(true)
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setShowCompletion(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  return (
    <ProtectedRoute requiredRole="user">
      {/* Background Image - Ayurveda */}
      <div
        className="fixed inset-0 -z-10 w-full h-full"
        style={{
          backgroundImage: "url('/images/frameword_bg/ayurveda.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      {/* Overlay for better text readability */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-white/30" />
      
    <div className="min-h-screen">
      
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                NF
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">NutriFusion</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ayurveda Dashboard</p>
              </div>
            </div>

            {/* Middle: Navigation Buttons */}
            <div className="hidden md:flex items-center gap-2 flex-1">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors gap-2"
                onClick={() => {
                  const dietSection = document.getElementById('diet-section');
                  if (dietSection) {
                    dietSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                title="View Diet Plans"
              >
                <Apple className="w-4 h-4" />
                <span className="text-sm font-medium">Diet</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors gap-2"
                onClick={() => {
                  const yogaSection = document.getElementById('yoga-section');
                  if (yogaSection) {
                    yogaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                title="Yoga & Exercises"
              >
                <Dumbbell className="w-4 h-4" />
                <span className="text-sm font-medium">Yoga & Exercise</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors gap-2"
                onClick={() => router.push('/acupressure')}
                title="Acupressure Body Explorer"
              >
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Acupressure</span>
              </Button>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-4">
              <NotificationsDropdown />
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                onClick={() => setShowSettings(true)}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <div 
                className="h-8 w-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push('/profile')}
                title="View Profile"
              >
                {(user?.name || user?.email)?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Completion Banner */}
        {showCompletion && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 text-white rounded-2xl shadow-2xl p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-10 h-10 flex-shrink-0 animate-bounce" />
                <div>
                  <p className="font-bold text-xl">Completed! 🎉</p>
                  <p className="text-sm opacity-90">You've finished all your yoga, exercise, and breathing activities for today!</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompletion(false)}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}!
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Let's continue your wellness journey.</p>
        </div>

        {/* Dashboard Sections */}
        <div className="space-y-8">
          <SummaryCards />
          <Recommendations />
          <div id="diet-section">
            <DietPlanTimeline />
          </div>
          <HealthInsights />
          <div id="yoga-section">
            <YogaLifestyle />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">Need personalized guidance?</p>
          <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-full px-8">
            Consult with Practitioner
          </Button>
        </div>
      </main>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-in {
          animation: slide-in-from-top 0.5s ease-out;
        }
      `}</style>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
    </ProtectedRoute>
  )
}
export default function AyurvedaDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>}>
      <AyurvedaDashboardContent />
    </Suspense>
  )
}