'use client'

import { Button } from '@/components/ui/button'
import { Activity, Wind, Zap } from 'lucide-react'

interface ActivityCardProps {
  activity: {
    name: string
    displayName: string
    duration: string
    benefit: string
    intensity?: string
    category: string
    id: string
  }
}

const categoryConfig = {
  yoga: {
    icon: Wind,
    bgColor: 'from-teal-50 to-emerald-50',
    textColor: 'text-teal-600',
    badgeColor: 'bg-teal-100 text-teal-700',
  },
  exercise: {
    icon: Activity,
    bgColor: 'from-orange-50 to-amber-50',
    textColor: 'text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  breathing: {
    icon: Zap,
    bgColor: 'from-purple-50 to-pink-50',
    textColor: 'text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const config = categoryConfig[activity.category as keyof typeof categoryConfig]
  const IconComponent = config.icon

  return (
    <div className={`bg-gradient-to-br ${config.bgColor} rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`${config.textColor} mt-1`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800">{activity.displayName}</h4>
            <p className="text-sm text-slate-600 mt-1">{activity.benefit}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`${config.badgeColor} text-xs font-semibold px-3 py-1 rounded-full`}>
          {activity.duration}
        </span>
        {activity.intensity && (
          <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
            {activity.intensity.charAt(0).toUpperCase() + activity.intensity.slice(1)}
          </span>
        )}
      </div>
    </div>
  )
}
