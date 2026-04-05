'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, ExternalLink } from 'lucide-react'
import { getToken, API_BASE_URL } from '@/lib/api'

const API_URL = 'https://nutrifusion-backend.onrender.com/api'

interface Notification {
  id: string
  type: string
  icon: string
  title: string
  message: string
  timestamp: string
  priority: 'high' | 'medium' | 'low'
  actionUrl?: string
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    const token = getToken()
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/dashboard/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const priorityColors = {
    high: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20',
    medium: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
  }

  const priorityBadgeColors = {
    high: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
    medium: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
    low: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
  }

  const handleNavigate = (url?: string) => {
    if (url) {
      window.location.href = url
      setIsOpen(false)
    }
  }

  const groupedNotifications = {
    high: notifications.filter(n => n.priority === 'high'),
    medium: notifications.filter(n => n.priority === 'medium'),
    low: notifications.filter(n => n.priority === 'low')
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-lg shadow-xl z-50 max-h-[600px] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="divide-y dark:divide-slate-700">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 dark:border-slate-600 border-t-blue-500 rounded-full" />
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>All caught up! No notifications yet.</p>
              </div>
            ) : (
              <>
                {/* High Priority Notifications */}
                {groupedNotifications.high.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-2">
                      🔴 Important
                    </p>
                    <div className="space-y-2">
                      {groupedNotifications.high.map(notif => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          onNavigate={handleNavigate}
                          priorityColors={priorityColors}
                          priorityBadgeColors={priorityBadgeColors}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Medium Priority Notifications */}
                {groupedNotifications.medium.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide mb-2">
                      🟡 For You
                    </p>
                    <div className="space-y-2">
                      {groupedNotifications.medium.map(notif => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          onNavigate={handleNavigate}
                          priorityColors={priorityColors}
                          priorityBadgeColors={priorityBadgeColors}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Low Priority Notifications */}
                {groupedNotifications.low.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">
                      🔵 Updates
                    </p>
                    <div className="space-y-2">
                      {groupedNotifications.low.map(notif => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          onNavigate={handleNavigate}
                          priorityColors={priorityColors}
                          priorityBadgeColors={priorityBadgeColors}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-3 text-center">
              <button
                onClick={() => {
                  window.location.href = '/dashboard'
                  setIsOpen(false)
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View all in dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Individual Notification Item Component
 */
function NotificationItem({
  notification,
  onNavigate,
  priorityColors,
  priorityBadgeColors
}: {
  notification: Notification
  onNavigate: (url?: string) => void
  priorityColors: any
  priorityBadgeColors: any
}) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div
      className={`p-3 rounded cursor-pointer hover:shadow-md transition-all ${priorityColors[notification.priority]} flex items-start gap-3 min-h-[80px]`}
      onClick={() => onNavigate(notification.actionUrl)}
    >
      {/* Icon */}
      <div className="text-2xl flex-shrink-0 mt-1">{notification.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
            {notification.title}
          </h4>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${priorityBadgeColors[notification.priority]}`}>
            {notification.priority}
          </span>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {notification.message}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {formatTime(notification.timestamp)}
          </span>
          {notification.actionUrl && (
            <ExternalLink className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>
    </div>
  )
}
