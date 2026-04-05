'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, Activity, Heart, Apple, TrendingUp, Calendar, 
  Edit, Settings, BarChart3, Brain, Droplets,
  Moon, Zap, UtensilsCrossed, AlertCircle, CheckCircle2, Home, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { ViewResultModal } from '@/components/profile/ViewResultModal'
import { DeleteAccountModal } from '@/components/profile/DeleteAccountModal'

interface ProfileData {
  identity: {
    name: string
    email: string
    age: number
    gender: string
    profilePhoto: string | null
    primaryGoal: string
    activeFramework: string
    profileCompletion: number
  }
  kpi: {
    bmi: number
    calorieTarget: number
    riskLevel: string
  }
  healthIntelligence: {
    framework: string
    modern: any
    ayurveda: any
    unani: any
    tcm: any
  }
  clinicalMetrics: {
    anthropometric: {
      height: number
      weight: number
      bmi: number
      bmr: number
      tdee: number
      waist: number | null
    }
    metabolic: {
      bloodPressure: string | null
      bloodSugar: string | null
      cholesterol: string | null
    }
  }
  lifestyleIndicators: {
    sleepDuration: number
    sleepQuality: string
    stressLevel: string
    hydrationLevel: string
    activityLevel: string
    appetite: string
    bowelRegularity: string
  }
  dietaryInfo: {
    preferences: string[]
    restrictions: string[]
    chronicConditions: string[]
  }
  analytics: {
    lastDietGenerated: string | null
    complianceScore: number
    currentStreak: number
    totalDaysTracked: number
    dietPlansCount: number
    assessmentDate: string | null
    frameworkComparison: {
      ayurveda: string | null
      modern: string
      unani: string | null
      tcm: string | null
    }
  }
  lastUpdated: string
  hasCompletedAssessment: boolean
  assignedPractitioner: any
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewResultModalOpen, setIsViewResultModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [framework, setFramework] = useState('modern')

  // Get background image URL based on framework
  const getBackgroundImage = (fw: string) => {
    const fwLower = fw?.toLowerCase() || 'modern'
    const imageMap: { [key: string]: string } = {
      'ayurveda': '/images/frameword_bg/ayurveda.png',
      'unani': '/images/frameword_bg/unani.png',
      'tcm': '/images/frameword_bg/TCM.png',
      'modern': '/images/frameword_bg/modern.png'
    }
    return imageMap[fwLower] || imageMap['modern']
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('nutrifusion_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('https://nutrifusion-backend.onrender.com/api/users/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        // Clear local storage
        localStorage.removeItem('nutrifusion_token')
        localStorage.removeItem('nutrifusion_user')
        
        // Redirect to login with message
        alert('Your account has been successfully deleted.')
        router.push('/login')
      } else {
        alert(data.message || 'Failed to delete account. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('An error occurred while deleting your account. Please try again.')
    } finally {
      setIsDeleteModalOpen(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('nutrifusion_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('https://nutrifusion-backend.onrender.com/api/users/profile/complete', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setProfile(data.data)
      // Set framework from profile data
      if (data.data?.identity?.preferredMedicalFramework) {
        setFramework(data.data.identity.preferredMedicalFramework)
      } else if (data.data?.identity?.activeFramework) {
        setFramework(data.data.identity.activeFramework)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-red-200 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">Error Loading Profile</h3>
          <p className="text-slate-600 text-center mb-4">{error || 'Unknown error occurred'}</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200'
      case 'Moderate': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'High': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <>
      {/* Background Image - Framework Specific */}
      <div
        className="fixed inset-0 -z-10 w-full h-full"
        style={{
          backgroundImage: `url('${getBackgroundImage(framework)}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      {/* Overlay for better text readability */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-white/30" />
      
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Your Health Profile</h1>
              <p className="text-slate-600 mt-1">Comprehensive health intelligence and analytics</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsViewResultModalOpen(true)}
              >
                <FileText className="w-4 h-4" />
                View Result
              </Button>
              <Button 
                className="gap-2 bg-teal-600 hover:bg-teal-700"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* SECTION A: Identity & Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            {/* Left: Avatar and Name */}
            <div className="flex gap-6 items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                  {profile.identity.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{profile.identity.name || 'User'}</h2>
                <p className="text-slate-500 text-sm">Personalized Nutrition Profile</p>
                <div className="flex gap-4 mt-3 text-sm text-slate-600">
                  <span>{profile.identity.age} years</span>
                  <span>•</span>
                  <span>{profile.identity.gender}</span>
                  <span>•</span>
                  <span className="capitalize">{profile.identity.activeFramework} Framework</span>
                </div>
                {/* Profile Completion */}
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-wider text-slate-500">Profile Completion</span>
                    <span className="text-sm font-semibold text-slate-700">{profile.identity.profileCompletion}%</span>
                  </div>
                  <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(profile.identity.profileCompletion)} transition-all`}
                      style={{ width: `${profile.identity.profileCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
              {/* BMI Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-w-[140px]">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">BMI</div>
                <div className="text-2xl font-bold text-slate-900">{profile.kpi.bmi.toFixed(1)}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {profile.kpi.bmi < 18.5 ? 'Underweight' : 
                   profile.kpi.bmi < 25 ? 'Normal' : 
                   profile.kpi.bmi < 30 ? 'Overweight' : 'Obese'}
                </div>
              </div>

              {/* Calorie Target Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-w-[140px]">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Daily Target</div>
                <div className="text-2xl font-bold text-slate-900">{profile.kpi.calorieTarget}</div>
                <div className="text-xs text-slate-600 mt-1">calories/day</div>
              </div>

              {/* Risk Level Card */}
              <div className={`border rounded-lg p-4 min-w-[140px] ${getRiskColor(profile.kpi.riskLevel)}`}>
                <div className="text-xs uppercase tracking-wider mb-1">Risk Level</div>
                <div className="text-2xl font-bold">{profile.kpi.riskLevel}</div>
                <div className="text-xs mt-1">Health Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: Health Intelligence Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Health Intelligence Summary</h3>
            <p className="text-sm text-slate-500">Framework: {profile.healthIntelligence.framework.toUpperCase()}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Framework-specific insights */}
            {profile.healthIntelligence.framework === 'modern' && profile.healthIntelligence.modern && (
              <>
                <InsightCard 
                  icon={<BarChart3 className="w-5 h-5" />}
                  title="Metabolic Risk"
                  value={profile.healthIntelligence.modern.metabolicRiskLevel}
                  badge="Status"
                />
                <InsightCard 
                  icon={<Activity className="w-5 h-5" />}
                  title="Digestive Score"
                  value={profile.healthIntelligence.modern.digestiveScore}
                  badge="Health"
                />
                <InsightCard 
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="BMR"
                  value={`${profile.healthIntelligence.modern.bmr} cal`}
                  badge="Baseline"
                />
                <InsightCard 
                  icon={<Zap className="w-5 h-5" />}
                  title="TDEE"
                  value={`${profile.healthIntelligence.modern.tdee} cal`}
                  badge="Daily"
                />
              </>
            )}

            {profile.healthIntelligence.framework === 'ayurveda' && profile.healthIntelligence.ayurveda && (
              <>
                <InsightCard 
                  icon={<Brain className="w-5 h-5" />}
                  title="Primary Dosha"
                  value={profile.healthIntelligence.ayurveda.primaryDosha}
                  badge={`${profile.healthIntelligence.ayurveda.percentages?.[profile.healthIntelligence.ayurveda.primaryDosha.toLowerCase()] || 0}%`}
                />
                <InsightCard 
                  icon={<Activity className="w-5 h-5" />}
                  title="Secondary Dosha"
                  value={profile.healthIntelligence.ayurveda.secondaryDosha}
                  badge={`${profile.healthIntelligence.ayurveda.percentages?.[profile.healthIntelligence.ayurveda.secondaryDosha.toLowerCase()] || 0}%`}
                />
                <InsightCard 
                  icon={<Zap className="w-5 h-5" />}
                  title="Agni Type"
                  value={profile.healthIntelligence.ayurveda.agniName}
                  badge={profile.healthIntelligence.ayurveda.agniType === 'sama' ? 'Balanced ✓' : 'Needs Balance'}
                />
                <InsightCard 
                  icon={<Heart className="w-5 h-5" />}
                  title="Current State"
                  value={profile.healthIntelligence.ayurveda.currentDosha}
                  badge={profile.healthIntelligence.ayurveda.imbalanceSeverity}
                />
              </>
            )}

            {profile.healthIntelligence.framework === 'unani' && profile.healthIntelligence.unani && (
              <>
                <InsightCard 
                  icon={<Droplets className="w-5 h-5" />}
                  title="Primary Mizaj"
                  value={profile.healthIntelligence.unani.mizaj}
                  badge={`${profile.healthIntelligence.unani.percentages?.[profile.healthIntelligence.unani.mizaj] || 0}%`}
                />
                <InsightCard 
                  icon={<Activity className="w-5 h-5" />}
                  title="Secondary Mizaj"
                  value={profile.healthIntelligence.unani.secondaryMizaj || 'Balanced'}
                  badge={`${profile.healthIntelligence.unani.percentages?.[profile.healthIntelligence.unani.secondaryMizaj] || 0}%`}
                />
                <InsightCard 
                  icon={<Zap className="w-5 h-5" />}
                  title="Digestive Strength"
                  value={profile.healthIntelligence.unani.digestiveStrength}
                  badge={profile.healthIntelligence.unani.digestiveStrength === 'strong' ? 'Optimal' : profile.healthIntelligence.unani.digestiveStrength === 'moderate' ? 'Good' : 'Needs Support'}
                />
                <InsightCard 
                  icon={<Heart className="w-5 h-5" />}
                  title="Temperament"
                  value={`${profile.healthIntelligence.unani.heat} & ${profile.healthIntelligence.unani.moisture}`}
                  badge={profile.healthIntelligence.unani.heat === 'hot' ? '🔥 Hot' : '❄️ Cold'}
                />
              </>
            )}

            {profile.healthIntelligence.framework === 'tcm' && profile.healthIntelligence.tcm && (
              <>
                <InsightCard 
                  icon={<Brain className="w-5 h-5" />}
                  title="Primary Pattern"
                  value={profile.healthIntelligence.tcm.primaryPattern}
                  badge="Dominant"
                />
                <InsightCard 
                  icon={<Activity className="w-5 h-5" />}
                  title="Secondary Pattern"
                  value={profile.healthIntelligence.tcm.secondaryPattern || 'None'}
                  badge={profile.healthIntelligence.tcm.secondaryPattern ? 'Secondary' : 'N/A'}
                />
                <InsightCard 
                  icon={<Zap className="w-5 h-5" />}
                  title="Severity"
                  value={profile.healthIntelligence.tcm.severity === 1 ? 'mild' : profile.healthIntelligence.tcm.severity === 2 ? 'moderate' : 'strong'}
                  badge={profile.healthIntelligence.tcm.severity === 1 ? 'Monitor' : profile.healthIntelligence.tcm.severity === 2 ? 'Manage' : 'Priority'}
                />
                <InsightCard 
                  icon={<Heart className="w-5 h-5" />}
                  title="Temperature"
                  value={profile.healthIntelligence.tcm.coldHeatPattern}
                  badge={profile.healthIntelligence.tcm.coldHeatPattern === 'Heat' ? '🔥' : profile.healthIntelligence.tcm.coldHeatPattern === 'Cold' ? '❄️' : '⚖️'}
                />
              </>
            )}
          </div>

          {/* Ayurveda Constitution Explanation */}
          {profile.healthIntelligence.framework === 'ayurveda' && profile.healthIntelligence.ayurveda && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 rounded-full p-2">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 mb-2">Understanding Your Constitution</h4>
                  <div className="text-sm text-amber-800 space-y-2">
                    <p>
                      <strong>Your Prakriti (Birth Constitution):</strong> You are {profile.healthIntelligence.ayurveda.doshaType} dominant with <strong>{profile.healthIntelligence.ayurveda.primaryDosha}</strong> as primary ({profile.healthIntelligence.ayurveda.percentages?.[profile.healthIntelligence.ayurveda.primaryDosha.toLowerCase()]}%) and <strong>{profile.healthIntelligence.ayurveda.secondaryDosha}</strong> as secondary ({profile.healthIntelligence.ayurveda.percentages?.[profile.healthIntelligence.ayurveda.secondaryDosha.toLowerCase()]}%).
                    </p>
                    <p>
                      <strong>Your Agni (Digestive Fire):</strong> {profile.healthIntelligence.ayurveda.agniName} - 
                      {profile.healthIntelligence.ayurveda.agniType === 'sama' && ' Balanced digestion, can eat at regular times.'}
                      {profile.healthIntelligence.ayurveda.agniType === 'vishama' && ' Irregular digestion, needs routine.'}
                      {profile.healthIntelligence.ayurveda.agniType === 'tikshna' && ' Sharp digestion, avoid spicy foods.'}
                      {profile.healthIntelligence.ayurveda.agniType === 'manda' && ' Slow digestion, needs light foods.'}
                    </p>
                    <p>
                      <strong>Current State (Vikriti):</strong> {profile.healthIntelligence.ayurveda.imbalanceSeverity === 'Balanced' ? '✓ Your doshas are currently balanced!' : `⚠️ ${profile.healthIntelligence.ayurveda.currentDosha} is currently aggravated - focus on balancing foods and lifestyle.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unani Constitution Explanation */}
          {profile.healthIntelligence.framework === 'unani' && profile.healthIntelligence.unani && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 rounded-full p-2">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-2">Understanding Your Temperament</h4>
                  <div className="text-sm text-orange-800 space-y-2">
                    <p>
                      <strong>Your Mizaj (Temperament):</strong> You have <strong>{profile.healthIntelligence.unani.mizaj}</strong> temperament ({profile.healthIntelligence.unani.percentages?.[profile.healthIntelligence.unani.mizaj] || 0}%){profile.healthIntelligence.unani.secondaryMizaj && ` with ${profile.healthIntelligence.unani.secondaryMizaj} as secondary (${profile.healthIntelligence.unani.percentages?.[profile.healthIntelligence.unani.secondaryMizaj] || 0}%)`}, characterized by <strong>{profile.healthIntelligence.unani.heat}</strong> thermal tendency and <strong>{profile.healthIntelligence.unani.moisture}</strong> moisture level.
                    </p>
                    <p>
                      <strong>Your Dominant Humor (Akhlat):</strong> {profile.healthIntelligence.unani.dominantHumor} - 
                      {profile.healthIntelligence.unani.dominantHumor === 'dam' && ' Blood humor - warm and moist nature.'}
                      {profile.healthIntelligence.unani.dominantHumor === 'safra' && ' Yellow bile - hot and dry nature.'}
                      {profile.healthIntelligence.unani.dominantHumor === 'balgham' && ' Phlegm - cold and moist nature.'}
                      {profile.healthIntelligence.unani.dominantHumor === 'sauda' && ' Black bile - cold and dry nature.'}
                    </p>
                    <p>
                      <strong>Digestive Strength (Quwwat-e-Haazima):</strong> {profile.healthIntelligence.unani.digestiveStrength} - 
                      {profile.healthIntelligence.unani.digestiveStrength === 'strong' && ' ✓ Strong digestion, can handle most foods.'}
                      {profile.healthIntelligence.unani.digestiveStrength === 'moderate' && ' Moderate digestion, avoid heavy meals.'}
                      {profile.healthIntelligence.unani.digestiveStrength === 'slow' && ' ⚠️ Slow digestion, prefer light and warm foods.'}
                      {profile.healthIntelligence.unani.digestiveStrength === 'weak' && ' ⚠️ Weak digestion, focus on easily digestible foods.'}
                    </p>
                    <p className="text-xs text-orange-700 bg-orange-100 border border-orange-300 rounded px-2 py-1 mt-2">
                      💡 Tip: {profile.healthIntelligence.unani.heat === 'hot' ? 'Balance your hot temperament with cooling foods like cucumber, yogurt, and fruits.' : 'Balance your cold temperament with warming foods like ginger, cinnamon, and soups.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TCM Pattern Explanation */}
          {profile.healthIntelligence.framework === 'tcm' && profile.healthIntelligence.tcm && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 rounded-full p-2">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">Understanding Your Pattern</h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>
                      <strong>Your Pattern Identification:</strong> You have <strong>{profile.healthIntelligence.tcm.primaryPattern}</strong> pattern{profile.healthIntelligence.tcm.secondaryPattern && ` with ${profile.healthIntelligence.tcm.secondaryPattern} as secondary pattern`}, with <strong>{profile.healthIntelligence.tcm.severity === 1 ? 'mild' : profile.healthIntelligence.tcm.severity === 2 ? 'moderate' : 'strong'}</strong> severity, characterized by <strong>{profile.healthIntelligence.tcm.coldHeatPattern}</strong> temperature tendency.
                    </p>
                    <p>
                      <strong>Your Energy Balance:</strong> 
                      {profile.healthIntelligence.tcm.yinDeficiency && profile.healthIntelligence.tcm.yangDeficiency && ' Both Yin and Yang deficiency - focus on nourishing and warming foods.'}
                      {profile.healthIntelligence.tcm.yinDeficiency && !profile.healthIntelligence.tcm.yangDeficiency && ' Yin deficiency - nourish with cooling, moistening foods.'}
                      {!profile.healthIntelligence.tcm.yinDeficiency && profile.healthIntelligence.tcm.yangDeficiency && ' Yang deficiency - strengthen with warming, energizing foods.'}
                      {!profile.healthIntelligence.tcm.yinDeficiency && !profile.healthIntelligence.tcm.yangDeficiency && ' ✓ Yin and Yang are relatively balanced.'}
                    </p>
                    <p>
                      <strong>Pattern Severity:</strong> {profile.healthIntelligence.tcm.severity === 1 ? '✓ Mild - maintain balance with appropriate foods.' : profile.healthIntelligence.tcm.severity === 2 ? '⚠️ Moderate - focus on pattern-specific foods and lifestyle.' : '⚠️ Strong - prioritize therapeutic foods and consult practitioner.'}
                    </p>
                    <p className="text-xs text-blue-700 bg-blue-100 border border-blue-300 rounded px-2 py-1 mt-2">
                      💡 Tip: {profile.healthIntelligence.tcm.coldHeatPattern === 'Heat' ? 'Balance your Heat pattern with cooling foods like cucumber, watermelon, mint, and green tea.' : profile.healthIntelligence.tcm.coldHeatPattern === 'Cold' ? 'Balance your Cold pattern with warming foods like ginger, garlic, cinnamon, and warm soups.' : 'Maintain your balance with neutral foods and avoid extremes.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grid Layout for Sections C & D */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SECTION C: Anthropometric & Clinical Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Clinical Metrics</h3>
            
            <div className="space-y-6">
              {/* Body Metrics */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Body Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <MetricRow label="Height" value={`${profile.clinicalMetrics.anthropometric.height} cm`} />
                  <MetricRow label="Weight" value={`${profile.clinicalMetrics.anthropometric.weight} kg`} />
                  <MetricRow label="BMI" value={profile.clinicalMetrics.anthropometric.bmi.toFixed(1)} />
                  <MetricRow label="BMR" value={`${profile.clinicalMetrics.anthropometric.bmr} cal`} />
                  <MetricRow label="TDEE" value={`${profile.clinicalMetrics.anthropometric.tdee} cal`} />
                  <MetricRow 
                    label="Waist" 
                    value={profile.clinicalMetrics.anthropometric.waist ? 
                      `${profile.clinicalMetrics.anthropometric.waist} cm` : 'Not recorded'} 
                  />
                </div>
              </div>

              <div className="border-t border-slate-200"></div>

              {/* Metabolic Markers */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Metabolic Markers</h4>
                <div className="grid grid-cols-2 gap-3">
                  <MetricRow 
                    label="Blood Pressure" 
                    value={profile.clinicalMetrics.metabolic.bloodPressure || 'Not recorded'} 
                  />
                  <MetricRow 
                    label="Blood Sugar" 
                    value={profile.clinicalMetrics.metabolic.bloodSugar || 'Not recorded'} 
                  />
                  <MetricRow 
                    label="Cholesterol" 
                    value={profile.clinicalMetrics.metabolic.cholesterol || 'Not recorded'} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION D: Lifestyle & Behavioral Indicators */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Lifestyle Indicators</h3>
            
            <div className="space-y-4">
              <ProgressBar 
                label="Sleep Quality" 
                value={profile.lifestyleIndicators.sleepDuration} 
                max={10}
                status={profile.lifestyleIndicators.sleepQuality}
                icon={<Moon className="w-4 h-4" />}
              />
              <ProgressBar 
                label="Stress Level" 
                value={profile.lifestyleIndicators.stressLevel === 'High' ? 8 : 
                       profile.lifestyleIndicators.stressLevel === 'Medium' ? 5 : 2} 
                max={10}
                status={profile.lifestyleIndicators.stressLevel}
                icon={<AlertCircle className="w-4 h-4" />}
              />
              <ProgressBar 
                label="Activity Level" 
                value={profile.lifestyleIndicators.activityLevel === 'Active' ? 8 : 
                       profile.lifestyleIndicators.activityLevel === 'Moderate' ? 5 : 2} 
                max={10}
                status={profile.lifestyleIndicators.activityLevel}
                icon={<Activity className="w-4 h-4" />}
              />
              <ProgressBar 
                label="Hydration" 
                value={5} 
                max={10}
                status={profile.lifestyleIndicators.hydrationLevel}
                icon={<Droplets className="w-4 h-4" />}
              />
              <ProgressBar 
                label="Appetite" 
                value={profile.lifestyleIndicators.appetite === 'High' ? 8 : 
                       profile.lifestyleIndicators.appetite === 'Normal' ? 5 : 2} 
                max={10}
                status={profile.lifestyleIndicators.appetite}
                icon={<UtensilsCrossed className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* SECTION E: Dietary Restrictions & Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Dietary Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Preferences */}
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {profile.dietaryInfo.preferences.map((pref, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm">
                    {pref}
                  </span>
                ))}
              </div>
            </div>

            {/* Restrictions */}
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Restrictions</h4>
              <div className="flex flex-wrap gap-2">
                {profile.dietaryInfo.restrictions.length > 0 ? (
                  profile.dietaryInfo.restrictions.map((restriction, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm">
                      {restriction}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-sm">None</span>
                )}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Health Conditions</h4>
              <div className="flex flex-wrap gap-2">
                {profile.dietaryInfo.chronicConditions.length > 0 ? (
                  profile.dietaryInfo.chronicConditions.map((condition, idx) => (
                    <span key={idx} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm">
                      {condition}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-sm">None reported</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION F: System History & Analytics */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Analytics & History</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              icon={<Calendar className="w-5 h-5" />}
              label="Current Streak"
              value={`${profile.analytics.currentStreak} days`}
            />
            <StatCard 
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Compliance"
              value={`${profile.analytics.complianceScore}%`}
            />
            <StatCard 
              icon={<TrendingUp className="w-5 h-5" />}
              label="Days Tracked"
              value={profile.analytics.totalDaysTracked.toString()}
            />
            <StatCard 
              icon={<Apple className="w-5 h-5" />}
              label="Diet Plans"
              value={profile.analytics.dietPlansCount.toString()}
            />
          </div>
        </div>

        {/* SECTION G: Danger Zone - Account Settings */}
        <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm overflow-hidden">
          <div className="bg-red-50 border-b border-red-200 p-4">
            <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-red-700 mt-1">Irreversible account actions</p>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-base font-semibold text-slate-900 mb-1">Delete Account</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <ul className="text-xs text-slate-500 space-y-1 mb-4">
                  <li>• All health profiles and assessments will be deleted</li>
                  <li>• Diet plans and meal tracking history will be removed</li>
                  <li>• Progress analytics and reports will be lost</li>
                </ul>
              </div>
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white gap-2 ml-4"
              >
                <AlertCircle className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={fetchProfile}
        currentData={profile ? {
          identity: {
            name: profile.identity.name,
            age: profile.identity.age,
            gender: profile.identity.gender
          },
          clinicalMetrics: {
            anthropometric: {
              height: profile.clinicalMetrics.anthropometric.height,
              weight: profile.clinicalMetrics.anthropometric.weight,
              waist: profile.clinicalMetrics.anthropometric.waist || undefined
            },
            metabolic: {
              bloodPressure: profile.clinicalMetrics.metabolic.bloodPressure || undefined,
              bloodSugar: profile.clinicalMetrics.metabolic.bloodSugar || undefined,
              cholesterol: profile.clinicalMetrics.metabolic.cholesterol || undefined
            }
          },
          lifestyleIndicators: {
            sleepDuration: profile.lifestyleIndicators.sleepDuration,
            stressLevel: profile.lifestyleIndicators.stressLevel,
            activityLevel: profile.lifestyleIndicators.activityLevel,
            appetite: profile.lifestyleIndicators.appetite
          },
          dietaryInfo: {
            restrictions: profile.dietaryInfo.restrictions,
            chronicConditions: profile.dietaryInfo.chronicConditions
          }
        } : undefined}
      />
      
      {/* View Result Modal */}
      <ViewResultModal
        isOpen={isViewResultModalOpen}
        onClose={() => setIsViewResultModalOpen(false)}
      />
      
      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
    </>
  )
}

// Helper Components

function InsightCard({ icon, title, value, badge }: any) {
  const getBadgeColor = (badge: string) => {
    const lower = badge.toLowerCase()
    if (lower.includes('high') || lower.includes('active') || lower.includes('good')) 
      return 'bg-green-100 text-green-700 border-green-200'
    if (lower.includes('moderate') || lower.includes('fair') || lower.includes('supporting')) 
      return 'bg-amber-100 text-amber-700 border-amber-200'
    if (lower.includes('low') || lower.includes('poor')) 
      return 'bg-red-100 text-red-700 border-red-200'
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2 text-slate-600">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{title}</span>
      </div>
      <div className="text-lg font-bold text-slate-900 mb-2">{value}</div>
      <span className={`inline-block px-2 py-1 text-xs font-medium border rounded ${getBadgeColor(badge)}`}>
        {badge}
      </span>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function ProgressBar({ label, value, max, status, icon }: any) {
  const percentage = (value / max) * 100
  const getColor = () => {
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-semibold text-slate-900">{status}</span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: any) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="flex items-center gap-2 text-slate-600 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  )
}
