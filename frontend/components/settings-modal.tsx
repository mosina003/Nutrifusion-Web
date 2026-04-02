'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Download, Trash2, RotateCcw } from 'lucide-react'
import { getToken } from '@/lib/api'
import { useTheme } from '@/context/ThemeContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UserSettings {
  healthPreferences: {
    dietaryRestrictions: string[]
    allergies: string[]
    cuisinePreferences: string[]
    mealTiming: {
      breakfast: string
      lunch: string
      dinner: string
    }
  }
  goals: {
    primaryGoal: string
    targetWeight?: number
    targetCalories?: number
    fitnessLevel: string
    weeklyActivityGoal: number
  }
  smartMode: {
    aiRecommendations: boolean
    autoMealSuggestions: boolean
    smartNotifications: boolean
    darkMode: boolean
  }
  dataControl: {
    dataExport: boolean
    shareWithPractitioner: boolean
    analytics: boolean
  }
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>({
    healthPreferences: {
      dietaryRestrictions: [],
      allergies: [],
      cuisinePreferences: [],
      mealTiming: {
        breakfast: '07:00',
        lunch: '12:00',
        dinner: '19:00'
      }
    },
    goals: {
      primaryGoal: 'balanced',
      targetWeight: undefined,
      targetCalories: 2500,
      fitnessLevel: 'moderate',
      weeklyActivityGoal: 5
    },
    smartMode: {
      aiRecommendations: true,
      autoMealSuggestions: true,
      smartNotifications: true,
      darkMode: false
    },
    dataControl: {
      dataExport: false,
      shareWithPractitioner: false,
      analytics: true
    }
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'health' | 'goals' | 'smart' | 'data'>('health')
  const { isDark, setDarkMode } = useTheme()

  // Fetch settings on mount
  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    const token = getToken()
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/users/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setSettings(data.data.settings || settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    const token = getToken()
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/users/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      })
      const data = await response.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    const token = getToken()
    if (!token) return

    try {
      const response = await fetch('http://localhost:5000/api/users/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nutrifusion-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-teal-600 dark:from-blue-700 dark:to-teal-800 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">⚙️ Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'health'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🧬 Health
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'goals'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🎯 Goals
          </button>
          <button
            onClick={() => setActiveTab('smart')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'smart'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🧠 Smart
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'data'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            📊 Data
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
          {/* Success Message */}
          {saved && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-center gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
              <p className="text-green-800 dark:text-green-200 font-medium">Settings saved successfully!</p>
            </div>
          )}

          {/* Health Preferences Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">🍽️ Dietary Preferences</h3>
                
                <div className="space-y-4">
                  {/* Dietary Restrictions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dietary Restrictions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'].map(option => (
                        <button
                          key={option}
                          onClick={() => {
                            setSettings(prev => ({
                              ...prev,
                              healthPreferences: {
                                ...prev.healthPreferences,
                                dietaryRestrictions: prev.healthPreferences.dietaryRestrictions.includes(option)
                                  ? prev.healthPreferences.dietaryRestrictions.filter(r => r !== option)
                                  : [...prev.healthPreferences.dietaryRestrictions, option]
                              }
                            }))
                          }}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            settings.healthPreferences.dietaryRestrictions.includes(option)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Allergies/Intolerances
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Peanuts', 'Shellfish', 'Eggs', 'Soy', 'Fish'].map(option => (
                        <button
                          key={option}
                          onClick={() => {
                            setSettings(prev => ({
                              ...prev,
                              healthPreferences: {
                                ...prev.healthPreferences,
                                allergies: prev.healthPreferences.allergies.includes(option)
                                  ? prev.healthPreferences.allergies.filter(a => a !== option)
                                  : [...prev.healthPreferences.allergies, option]
                              }
                            }))
                          }}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            settings.healthPreferences.allergies.includes(option)
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cuisine Preferences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cuisine Preferences
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Indian', 'Mediterranean', 'Asian', 'Italian', 'Mexican'].map(option => (
                        <button
                          key={option}
                          onClick={() => {
                            setSettings(prev => ({
                              ...prev,
                              healthPreferences: {
                                ...prev.healthPreferences,
                                cuisinePreferences: prev.healthPreferences.cuisinePreferences.includes(option)
                                  ? prev.healthPreferences.cuisinePreferences.filter(c => c !== option)
                                  : [...prev.healthPreferences.cuisinePreferences, option]
                              }
                            }))
                          }}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            settings.healthPreferences.cuisinePreferences.includes(option)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal Timing */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Breakfast Time
                      </label>
                      <input
                        type="time"
                        value={settings.healthPreferences.mealTiming.breakfast}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            healthPreferences: {
                              ...prev.healthPreferences,
                              mealTiming: { ...prev.healthPreferences.mealTiming, breakfast: e.target.value }
                            }
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lunch Time
                      </label>
                      <input
                        type="time"
                        value={settings.healthPreferences.mealTiming.lunch}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            healthPreferences: {
                              ...prev.healthPreferences,
                              mealTiming: { ...prev.healthPreferences.mealTiming, lunch: e.target.value }
                            }
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dinner Time
                      </label>
                      <input
                        type="time"
                        value={settings.healthPreferences.mealTiming.dinner}
                        onChange={(e) =>
                          setSettings(prev => ({
                            ...prev,
                            healthPreferences: {
                              ...prev.healthPreferences,
                              mealTiming: { ...prev.healthPreferences.mealTiming, dinner: e.target.value }
                            }
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🎯 Your Wellness Goals</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Goal
                  </label>
                  <select
                    value={settings.goals.primaryGoal}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        goals: { ...prev.goals, primaryGoal: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weight-loss">Weight Loss</option>
                    <option value="weight-gain">Weight Gain</option>
                    <option value="balanced">Balanced Living</option>
                    <option value="muscle-gain">Muscle Building</option>
                    <option value="energy">Boost Energy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={settings.goals.targetWeight || ''}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        goals: { ...prev.goals, targetWeight: e.target.value ? parseFloat(e.target.value) : undefined }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Daily Calories
                  </label>
                  <input
                    type="number"
                    value={settings.goals.targetCalories || ''}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        goals: { ...prev.goals, targetCalories: e.target.value ? parseFloat(e.target.value) : undefined }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fitness Level
                  </label>
                  <select
                    value={settings.goals.fitnessLevel}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        goals: { ...prev.goals, fitnessLevel: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sedentary">Sedentary</option>
                    <option value="lightly-active">Lightly Active</option>
                    <option value="moderate">Moderate</option>
                    <option value="very-active">Very Active</option>
                    <option value="extremely-active">Extremely Active</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weekly Activity Goal (sessions)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={settings.goals.weeklyActivityGoal}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        goals: { ...prev.goals, weeklyActivityGoal: parseInt(e.target.value) }
                      }))
                    }
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400 min-w-[40px]">
                    {settings.goals.weeklyActivityGoal}/7
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Smart Mode Tab */}
          {activeTab === 'smart' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🧠 Smart Mode Features</h3>

              <div className="space-y-4">
                {[
                  {
                    key: 'aiRecommendations' as const,
                    label: '🤖 AI-Powered Recommendations',
                    description: 'Get personalized food and activity suggestions powered by AI'
                  },
                  {
                    key: 'autoMealSuggestions' as const,
                    label: '🍽️ Auto Meal Suggestions',
                    description: 'Automatically suggest meals based on your calendar and preferences'
                  },
                  {
                    key: 'smartNotifications' as const,
                    label: '🔔 Smart Notifications',
                    description: 'Receive intelligent reminders at optimal times'
                  },
                  {
                    key: 'darkMode' as const,
                    label: '🌙 Dark Mode',
                    description: 'Easy on the eyes during nighttime browsing'
                  }
                ].map(feature => (
                  <button
                    key={feature.key}
                    onClick={() => {
                      const newValue = !settings.smartMode[feature.key];
                      setSettings(prev => ({
                        ...prev,
                        smartMode: {
                          ...prev.smartMode,
                          [feature.key]: newValue
                        }
                      }));
                      // Special handling for dark mode - apply theme immediately
                      if (feature.key === 'darkMode') {
                        setDarkMode(newValue);
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">{feature.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.smartMode[feature.key]
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-slate-600'
                    } flex items-center p-0.5`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.smartMode[feature.key] ? 'translate-x-6' : ''
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Data & Control Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📊 Data & Control</h3>

              <div className="space-y-4">
                {/* Data Privacy Options */}
                <div className="p-4 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg space-y-3">
                  <button
                    onClick={() =>
                      setSettings(prev => ({
                        ...prev,
                        dataControl: {
                          ...prev.dataControl,
                          shareWithPractitioner: !prev.dataControl.shareWithPractitioner
                        }
                      }))
                    }
                    className="w-full flex items-center justify-between"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">👨‍⚕️ Share with Practitioner</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Allow your health practitioner to view your data</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.dataControl.shareWithPractitioner
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-slate-600'
                    } flex items-center p-0.5`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.dataControl.shareWithPractitioner ? 'translate-x-6' : ''
                      }`} />
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setSettings(prev => ({
                        ...prev,
                        dataControl: {
                          ...prev.dataControl,
                          analytics: !prev.dataControl.analytics
                        }
                      }))
                    }
                    className="w-full flex items-center justify-between pt-3 border-t dark:border-slate-700"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">📈 Analytics & Improvements</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Help us improve by sharing anonymized data</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      settings.dataControl.analytics
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-slate-600'
                    } flex items-center p-0.5`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.dataControl.analytics ? 'translate-x-6' : ''
                      }`} />
                    </div>
                  </button>
                </div>

                {/* Data Actions */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-slate-700">
                  <button
                    onClick={exportData}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Export Data
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Reset All
                  </button>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    Your data is encrypted and stored securely. You can export or reset your data anytime.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
