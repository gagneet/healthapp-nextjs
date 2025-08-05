'use client'

import { useEffect } from 'react'

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Global error handler for external scripts
    const handleError = (event: ErrorEvent) => {
      // Check if this is the specific error we're trying to fix
      if (event.error?.message?.includes('enabledFeatures is undefined') ||
          event.error?.message?.includes('args.site.enabledFeatures is undefined') ||
          event.message?.includes('enabledFeatures is undefined')) {
        // Suppress this specific error from external code
        event.preventDefault()
        console.warn('Suppressed external enabledFeatures error:', event.error?.message || event.message)
        return false
      }
      
      // Also suppress updateFeaturesInner related errors
      if (event.error?.message?.includes('updateFeaturesInner') ||
          event.error?.message?.includes('isFeatureBroken') ||
          event.message?.includes('updateFeaturesInner') ||
          event.message?.includes('isFeatureBroken')) {
        event.preventDefault()
        console.warn('Suppressed external feature update error:', event.error?.message || event.message)
        return false
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle promise rejections
      const reason = event.reason
      if (reason?.message?.includes('enabledFeatures is undefined') ||
          reason?.message?.includes('args.site.enabledFeatures is undefined') ||
          reason?.message?.includes('updateFeaturesInner') ||
          reason?.message?.includes('isFeatureBroken')) {
        event.preventDefault()
        console.warn('Suppressed external features promise rejection:', reason?.message)
        return false
      }
    }

    // Add event listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // This component doesn't render anything
  return null
}