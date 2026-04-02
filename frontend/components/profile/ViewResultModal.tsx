'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Calendar, Brain, Activity, Heart, Droplets, Flame, Wind, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getActiveAssessment } from '@/lib/api'

interface ViewResultModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ViewResultModal({ isOpen, onClose }: ViewResultModalProps) {
  const [loading, setLoading] = useState(false)
  const [assessment, setAssessment] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchAssessment()
    }
  }, [isOpen])

  // Helper function to safely render values that might be objects
  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'object') {
      // Handle common object structures
      if (value.message) return value.message
      if (value.text) return value.text
      if (value.value) return value.value
      return JSON.stringify(value)
    }
    return String(value)
  }

  const fetchAssessment = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getActiveAssessment()
      
      if (response.success && response.data?.assessment) {
        setAssessment(response.data.assessment)
      } else {
        setError('No active assessment found. Please complete an assessment first.')
      }
    } catch (err: any) {
      console.error('Error fetching assessment:', err)
      setError(err.message || 'Failed to load assessment results')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderAyurvedaResults = (scores: any, healthProfile: any) => {
    // Extract data from correct structure
    const prakriti = scores.prakriti || {}
    const vikriti = scores.vikriti || {}
    const agni = scores.agni || healthProfile?.agni || {}
    const interpretation = scores.interpretation || {}
    
    const vataPercentage = prakriti.percentages?.vata || 0
    const pittaPercentage = prakriti.percentages?.pitta || 0
    const kaphaPercentage = prakriti.percentages?.kapha || 0
    
    return (
    <div className="space-y-6">
      {/* Dosha Distribution */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Dosha Constitution
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-amber-800">Vata</span>
              <span className="text-sm font-bold text-amber-900">{vataPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all" 
                style={{ width: `${vataPercentage}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-amber-800">Pitta</span>
              <span className="text-sm font-bold text-amber-900">{pittaPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all" 
                style={{ width: `${pittaPercentage}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-amber-800">Kapha</span>
              <span className="text-sm font-bold text-amber-900">{kaphaPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all" 
                style={{ width: `${kaphaPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Primary Dosha:</strong> {prakriti.primary ? prakriti.primary.charAt(0).toUpperCase() + prakriti.primary.slice(1) : 'N/A'}
            {prakriti.secondary && ` | Secondary: ${prakriti.secondary.charAt(0).toUpperCase() + prakriti.secondary.slice(1)}`}
          </p>
          <p className="text-sm text-amber-800 mt-1">
            <strong>Constitution Type:</strong> {prakriti.dosha_type || 'N/A'}
          </p>
        </div>
      </div>

      {/* Agni & Prakriti */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h5 className="font-semibold text-slate-900">Agni (Digestive Fire)</h5>
          </div>
          <p className="text-2xl font-bold text-slate-900">{agni.name || 'N/A'}</p>
          <p className="text-sm text-slate-600 mt-1 capitalize">{agni.type || ''}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-teal-500" />
            <h5 className="font-semibold text-slate-900">Prakriti</h5>
          </div>
          <p className="text-lg font-bold text-slate-900">{prakriti.dosha_type || 'N/A'}</p>
          <p className="text-sm text-slate-600 mt-1">Birth Constitution</p>
        </div>
      </div>

      {/* Interpretation */}
      {interpretation && typeof interpretation === 'object' && interpretation.constitution_overview && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h5 className="font-semibold text-slate-900 mb-3">Health Interpretation</h5>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-800 mb-1">Constitution Overview</p>
              <p className="leading-relaxed">{interpretation.constitution_overview?.description}</p>
            </div>
            {interpretation.current_state && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="font-semibold text-amber-900 mb-1">Current State</p>
                <p className="text-amber-800">{interpretation.current_state?.message}</p>
                {interpretation.current_state?.recommendation && (
                  <p className="text-amber-700 mt-1 text-xs">{interpretation.current_state.recommendation}</p>
                )}
              </div>
            )}
            {interpretation.digestive_profile && (
              <div>
                <p className="font-semibold text-slate-800 mb-1">Digestive Profile</p>
                <p className="leading-relaxed">{interpretation.digestive_profile?.description} - {interpretation.digestive_profile?.explanation}</p>
              </div>
            )}
            {interpretation.summary && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="font-semibold text-blue-900 mb-1">Summary</p>
                <p className="text-blue-800">{interpretation.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )}

  const renderUnaniResults = (scores: any, healthProfile: any) => {
    // Extract data from correct structure
    const primaryMizaj = scores.primary_mizaj || scores.mizaj_type || 'N/A'
    const secondaryMizaj = scores.secondary_mizaj || 'N/A'
    const dominantHumor = scores.dominant_humor || primaryMizaj
    const digestiveStrength = scores.digestive_strength || healthProfile?.digestive_strength || 'N/A'
    const thermalTendency = scores.thermal_tendency || 'N/A'
    const moistureTendency = scores.moisture_tendency || 'N/A'
    const humorPercentages = scores.humor_percentages || {}
    const interpretation = scores.interpretation || {}
    
    return (
    <div className="space-y-6">
      {/* Mizaj */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
          <Droplets className="w-5 h-5" />
          Mizaj (Temperament)
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-orange-800 mb-2">Primary Mizaj</p>
            <p className="text-2xl font-bold text-orange-900 capitalize">{primaryMizaj}</p>
            {humorPercentages[primaryMizaj] && (
              <p className="text-xs text-orange-700 mt-1">{humorPercentages[primaryMizaj]}%</p>
            )}
          </div>
          <div>
            <p className="text-sm text-orange-800 mb-2">Secondary Mizaj</p>
            <p className="text-lg font-semibold text-orange-900 capitalize">{secondaryMizaj}</p>
            {humorPercentages[secondaryMizaj] && (
              <p className="text-xs text-orange-700 mt-1">{humorPercentages[secondaryMizaj]}%</p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-orange-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-orange-800 mb-1">Thermal Tendency</p>
              <p className="text-lg font-semibold text-orange-900 capitalize flex items-center gap-2">
                {thermalTendency === 'hot' ? '🔥' : '❄️'} {thermalTendency}
              </p>
            </div>
            <div>
              <p className="text-sm text-orange-800 mb-1">Moisture Tendency</p>
              <p className="text-lg font-semibold text-orange-900 capitalize flex items-center gap-2">
                {moistureTendency === 'moist' ? '💧' : '🏜️'} {moistureTendency}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-orange-200">
          <p className="text-sm text-orange-800 mb-1">Dominant Humor</p>
          <p className="text-xl font-bold text-orange-900 capitalize">{dominantHumor}</p>
        </div>
      </div>

      {/* Humor Distribution */}
      {Object.keys(humorPercentages).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h5 className="font-semibold text-slate-900 mb-3">Humor Distribution</h5>
          <div className="space-y-3">
            {Object.entries(humorPercentages).map(([humor, percentage]: [string, any]) => (
              <div key={humor}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700 capitalize">{humor}</span>
                  <span className="text-sm font-bold text-slate-900">{percentage}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      humor === 'dam' ? 'bg-red-500' : 
                      humor === 'safra' ? 'bg-yellow-500' : 
                      humor === 'balgham' ? 'bg-blue-500' : 
                      'bg-purple-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Digestive Strength */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h5 className="font-semibold text-slate-900">Quwwat-e-Haazima (Digestive Strength)</h5>
        </div>
        <p className="text-2xl font-bold text-slate-900 capitalize">{digestiveStrength}</p>
      </div>

      {/* Interpretation */}
      {interpretation && typeof interpretation === 'object' && interpretation.temperament_overview && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h5 className="font-semibold text-slate-900 mb-3">Health Interpretation</h5>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-800 mb-1">Temperament Overview</p>
              <p className="leading-relaxed">{interpretation.temperament_overview?.description}</p>
            </div>
            {interpretation.current_state && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="font-semibold text-orange-900 mb-1">Current State</p>
                <p className="text-orange-800">{interpretation.current_state?.message}</p>
              </div>
            )}
            {interpretation.digestive_profile && (
              <div>
                <p className="font-semibold text-slate-800 mb-1">Digestive Profile</p>
                <p className="leading-relaxed">{interpretation.digestive_profile?.description}</p>
              </div>
            )}
            {interpretation.summary && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="font-semibold text-blue-900 mb-1">Summary</p>
                <p className="text-blue-800">{interpretation.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )}

  const renderTCMResults = (scores: any, healthProfile: any) => {
    // Extract data from correct structure
    const primaryPattern = scores.primary_pattern || 'N/A'
    const secondaryPattern = scores.secondary_pattern || null
    const coldHeat = scores.cold_heat || healthProfile?.cold_heat || 'N/A'
    const patternScores = scores.pattern_scores || {}
    const sectionAnalysis = scores.section_analysis || {}
    const interpretation = scores.interpretation || {}
    
    // Get top patterns for display (filter out zero scores)
    const topPatterns = Object.entries(patternScores)
      .filter(([, score]: any) => score > 0)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
    
    return (
    <div className="space-y-6">
      {/* Pattern Diagnosis */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
          <Wind className="w-5 h-5" />
          Pattern Diagnosis
        </h4>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm text-emerald-800 mb-1">Primary Pattern</p>
            <p className="text-xl font-bold text-emerald-900">{primaryPattern}</p>
          </div>
          {secondaryPattern && (
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-emerald-800 mb-1">Secondary Pattern</p>
              <p className="text-xl font-bold text-emerald-900">{secondaryPattern}</p>
            </div>
          )}
        </div>
      </div>

      {/* Thermal Balance */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-blue-500" />
          <h5 className="font-semibold text-slate-900">Thermal Balance</h5>
        </div>
        <p className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          {coldHeat === 'Cold' ? '❄️' : coldHeat === 'Heat' ? '🔥' : '⚖️'} 
          <span className="capitalize">{coldHeat}</span>
        </p>
        <p className="text-sm text-slate-600 mt-1">Cold/Heat Tendency</p>
      </div>

      {/* Pattern Distribution */}
      {topPatterns.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h5 className="font-semibold text-slate-900 mb-3">Pattern Distribution</h5>
          <div className="space-y-3">
            {topPatterns.map(([pattern, score]: [string, any]) => {
              const maxScore = Math.max(...Object.values(patternScores) as number[])
              const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
              return (
                <div key={pattern}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">{pattern}</span>
                    <span className="text-sm font-bold text-slate-900">Score: {score}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Section Analysis */}
      {Object.keys(sectionAnalysis).length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h5 className="font-semibold text-slate-900 mb-3">Detailed Analysis</h5>
          <div className="grid grid-cols-2 gap-3">
            {sectionAnalysis.cold_heat && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-slate-600 mb-1">Cold/Heat</p>
                <p className="text-sm font-semibold text-slate-900 capitalize">{sectionAnalysis.cold_heat}</p>
              </div>
            )}
            {sectionAnalysis.qi && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-slate-600 mb-1">Qi Condition</p>
                <p className="text-sm font-semibold text-slate-900">{sectionAnalysis.qi}</p>
              </div>
            )}
            {sectionAnalysis.dampness && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-slate-600 mb-1">Dampness</p>
                <p className="text-sm font-semibold text-slate-900">{sectionAnalysis.dampness}</p>
              </div>
            )}
            {sectionAnalysis.liver && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-slate-600 mb-1">Liver Pattern</p>
                <p className="text-sm font-semibold text-slate-900">{sectionAnalysis.liver}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interpretation */}
      {interpretation && typeof interpretation === 'object' && interpretation.pattern_overview && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h5 className="font-semibold text-slate-900 mb-3">Health Interpretation</h5>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-800 mb-1">Pattern Overview</p>
              <p className="leading-relaxed">{interpretation.pattern_overview?.description}</p>
            </div>
            {interpretation.current_state && (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                <p className="font-semibold text-emerald-900 mb-1">Current State</p>
                <p className="text-emerald-800">{interpretation.current_state?.message}</p>
              </div>
            )}
            {interpretation.recommendations && (
              <div>
                <p className="font-semibold text-slate-800 mb-1">Recommendations</p>
                <p className="leading-relaxed">{interpretation.recommendations?.general}</p>
              </div>
            )}
            {interpretation.summary && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="font-semibold text-blue-900 mb-1">Summary</p>
                <p className="text-blue-800">{interpretation.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )}

  const renderModernResults = (scores: any, healthProfile: any) => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h5 className="font-semibold text-blue-900">BMI</h5>
          </div>
          <p className="text-2xl font-bold text-blue-900">{scores.bmi?.toFixed(1) || 'N/A'}</p>
          <p className="text-sm text-blue-700 mt-1 capitalize">{renderValue(scores.bmi_category)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-green-500" />
            <h5 className="font-semibold text-green-900">Metabolic Risk</h5>
          </div>
          <p className="text-2xl font-bold text-green-900 capitalize">{renderValue(scores.metabolic_risk_level) || 'Low'}</p>
          <p className="text-sm text-green-700 mt-1">Risk Level</p>
        </div>
      </div>

      {/* Energy Metrics */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h5 className="font-semibold text-slate-900 mb-3">Energy & Calorie Metrics</h5>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600 mb-1">BMR</p>
            <p className="text-xl font-bold text-slate-900">{renderValue(scores.bmr)} <span className="text-sm font-normal">cal</span></p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">TDEE</p>
            <p className="text-xl font-bold text-slate-900">{renderValue(scores.tdee)} <span className="text-sm font-normal">cal</span></p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Target</p>
            <p className="text-xl font-bold text-slate-900">{renderValue(scores.recommended_calories)} <span className="text-sm font-normal">cal</span></p>
          </div>
        </div>
      </div>

      {/* Macro Split */}
      {scores.macro_split && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h5 className="font-semibold text-slate-900 mb-3">Recommended Macro Split</h5>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">Protein</span>
                <span className="text-sm font-bold text-slate-900">
                  {scores.macro_split.protein.percent}% ({scores.macro_split.protein.grams}g)
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all" 
                  style={{ width: `${scores.macro_split.protein.percent}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">Carbs</span>
                <span className="text-sm font-bold text-slate-900">
                  {scores.macro_split.carbs.percent}% ({scores.macro_split.carbs.grams}g)
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all" 
                  style={{ width: `${scores.macro_split.carbs.percent}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">Fats</span>
                <span className="text-sm font-bold text-slate-900">
                  {scores.macro_split.fats.percent}% ({scores.macro_split.fats.grams}g)
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all" 
                  style={{ width: `${scores.macro_split.fats.percent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {scores.risk_flags && scores.risk_flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h5 className="font-semibold text-red-900 mb-2">Health Considerations</h5>
          <ul className="space-y-1">
            {scores.risk_flags.map((flag: string, index: number) => (
              <li key={index} className="text-sm text-red-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                {renderValue(flag)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Assessment Results</h2>
            </div>
            <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
          </div>
          {assessment && (
            <div className="mt-3 flex items-center gap-4 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(assessment.completedAt)}</span>
              </div>
              <div className="px-3 py-1 bg-white/20 rounded-full capitalize">
                {assessment.framework} Framework
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && assessment && (
            <>
              {assessment.framework === 'ayurveda' && renderAyurvedaResults(assessment.scores, assessment.healthProfile)}
              {assessment.framework === 'unani' && renderUnaniResults(assessment.scores, assessment.healthProfile)}
              {assessment.framework === 'tcm' && renderTCMResults(assessment.scores, assessment.healthProfile)}
              {assessment.framework === 'modern' && renderModernResults(assessment.scores, assessment.healthProfile)}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <Button 
            onClick={onClose}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
