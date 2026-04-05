'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getToken } from '@/lib/api'

interface ThemeContextType {
  isDark: boolean
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize theme from localStorage and user settings
  useEffect(() => {
    const initializeTheme = async () => {
      // Check localStorage first for instant theme application
      const savedTheme = localStorage.getItem('theme-preference')
      if (savedTheme === 'dark') {
        setIsDark(true)
        applyDarkMode(true)
      } else if (savedTheme === 'light') {
        setIsDark(false)
        applyDarkMode(false)
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(prefersDark)
        applyDarkMode(prefersDark)
      }

      // Then fetch from user settings
      const token = getToken()
      if (token) {
        try {
          const response = await fetch('https://nutrifusion-backend.onrender.com/api/users/settings', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          if (data.success && data.data.settings?.smartMode?.darkMode) {
            setIsDark(true)
            applyDarkMode(true)
            localStorage.setItem('theme-preference', 'dark')
          }
        } catch (error) {
          console.error('Error fetching theme preference:', error)
        }
      }

      setIsLoaded(true)
    }

    initializeTheme()
  }, [])

  // Apply dark mode to document
  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }
  }

  const setDarkMode = (isDark: boolean) => {
    setIsDark(isDark)
    applyDarkMode(isDark)
    localStorage.setItem('theme-preference', isDark ? 'dark' : 'light')

    // Save to backend if user is authenticated
    const token = getToken()
    if (token) {
      fetch('https://nutrifusion-backend.onrender.com/api/users/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            smartMode: {
              darkMode: isDark,
              aiRecommendations: true,
              autoMealSuggestions: true,
              smartNotifications: true
            }
          }
        })
      }).catch(error => console.error('Error saving theme preference:', error))
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!isDark)
  }

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    // Return a safe default instead of throwing error during SSR/initial render
    return {
      isDark: false,
      toggleDarkMode: () => {},
      setDarkMode: () => {}
    }
  }
  return context
}
