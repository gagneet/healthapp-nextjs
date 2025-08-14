"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"

export function SessionTimeoutHandler() {
  const { data: session } = useSession()
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!session) return

    let warningTimer: NodeJS.Timeout
    let logoutTimer: NodeJS.Timeout

    const resetTimers = () => {
      clearTimeout(warningTimer)
      clearTimeout(logoutTimer)

      // Show warning at 25 minutes (5 minutes before 30-minute timeout)
      warningTimer = setTimeout(() => {
        setShowWarning(true)
      }, 25 * 60 * 1000)

      // Auto logout at 30 minutes (healthcare compliance requirement)
      logoutTimer = setTimeout(async () => {
        await signOut({ 
          redirect: true, 
          callbackUrl: "/auth/signin?timeout=true" 
        })
      }, 30 * 60 * 1000)
    }

    const handleActivity = () => {
      setShowWarning(false)
      resetTimers()
    }

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Initialize timers
    resetTimers()

    return () => {
      clearTimeout(warningTimer)
      clearTimeout(logoutTimer)
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [session])

  const handleStayLoggedIn = () => {
    setShowWarning(false)
    // This will trigger a session refresh and reset the timers
    window.location.reload()
  }

  if (showWarning) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 text-center z-50 shadow-lg">
        <div className="flex items-center justify-center space-x-4">
          <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="font-medium">
            Your session will expire in 5 minutes due to inactivity. 
            <br />
            <span className="text-sm">Click "Stay Logged In" or move your mouse to continue.</span>
          </p>
          <button 
            onClick={handleStayLoggedIn}
            className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-50 transition-colors"
          >
            Stay Logged In
          </button>
          <button 
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="bg-red-700 text-white px-4 py-2 rounded-md font-medium hover:bg-red-800 transition-colors"
          >
            Logout Now
          </button>
        </div>
      </div>
    )
  }

  return null
}