'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline'

interface SpeechToTextProps {
  onTranscript: (text: string, language: string) => void
  language?: 'en' | 'hi' | 'auto'
  placeholder?: string
  className?: string
  disabled?: boolean
  autoStop?: number // Auto stop after N seconds of silence (default: 5)
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionError extends Event {
  error: string
  message: string
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

// Language configurations with both native and English script support
const LANGUAGE_CONFIG = {
  en: {
    code: 'en-US',
    name: 'English',
    flag: '🇺🇸',
    alt_codes: ['en-IN', 'en-GB', 'en-AU']
  },
  hi: {
    code: 'hi-IN',
    name: 'हिंदी (Hindi)',
    flag: '🇮🇳',
    alt_codes: ['hi']
  },
  auto: {
    code: 'auto',
    name: 'Auto Detect',
    flag: '🌐',
    alt_codes: []
  }
}

export default function SpeechToText({
  onTranscript,
  language = 'auto',
  placeholder = 'Click microphone and speak...',
  className = '',
  disabled = false,
  autoStop = 10
}: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(language)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number>(0)

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isListeningRef = useRef(false)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setIsSupported(true)
        
        const recognition = new SpeechRecognition()
        
        // Configuration for multilingual support
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 3
        
        // Set language based on preference
        if (language === 'auto') {
          // Try to detect user's preferred language
          const userLang = navigator.language.split('-')[0]
          if (userLang === 'hi') {
            recognition.lang = LANGUAGE_CONFIG.hi.code
            setCurrentLanguage('hi')
          } else {
            recognition.lang = LANGUAGE_CONFIG.en.code
            setCurrentLanguage('en')
          }
        } else {
          recognition.lang = LANGUAGE_CONFIG[language].code
          setCurrentLanguage(language)
        }

        // Handle results
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          let interim = ''
          let bestConfidence = 0

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcriptText = result[0].transcript
            const confidenceScore = result[0].confidence || 0

            if (result.isFinal) {
              finalTranscript += transcriptText
              bestConfidence = Math.max(bestConfidence, confidenceScore)
              
              // Clear the silence timer when we get final results
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
                silenceTimerRef.current = null
              }
            } else {
              interim += transcriptText
              
              // Reset silence timer on interim results
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
              }
              
              // Set auto-stop timer
              silenceTimerRef.current = setTimeout(() => {
                if (isListeningRef.current) {
                  stopListening()
                }
              }, autoStop * 1000)
            }
          }

          setInterimTranscript(interim)
          setConfidence(bestConfidence)

          if (finalTranscript) {
            const newTranscript = transcript + finalTranscript
            setTranscript(newTranscript)
            
            // Detect language if in auto mode
            const detectedLang = detectLanguage(newTranscript)
            
            onTranscript(newTranscript, detectedLang)
            
            // Clear interim after final result
            setInterimTranscript('')
          }
        }

        // Handle errors
        recognition.onerror = (event: SpeechRecognitionError) => {
          console.error('Speech recognition error:', event.error, event.message)
          
          let errorMessage = 'Speech recognition failed. '
          switch (event.error) {
            case 'network':
              errorMessage += 'Please check your internet connection.'
              break
            case 'not-allowed':
              errorMessage += 'Microphone permission denied. Please allow microphone access.'
              break
            case 'no-speech':
              errorMessage += 'No speech detected. Please try again.'
              break
            case 'audio-capture':
              errorMessage += 'No microphone found. Please check your audio settings.'
              break
            case 'language-not-supported':
              errorMessage += 'Language not supported. Switching to English.'
              // Fallback to English
              recognition.lang = LANGUAGE_CONFIG.en.code
              setCurrentLanguage('en')
              break
            default:
              errorMessage += 'Please try again.'
          }
          
          setError(errorMessage)
          setIsListening(false)
          isListeningRef.current = false
        }

        // Handle start/end events
        recognition.onstart = () => {
          setIsListening(true)
          isListeningRef.current = true
          setError(null)
          console.log('Speech recognition started')
        }

        recognition.onend = () => {
          setIsListening(false)
          isListeningRef.current = false
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
          console.log('Speech recognition ended')
        }

        recognitionRef.current = recognition
      } else {
        console.warn('Speech recognition not supported')
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [language, autoStop])

  // Simple language detection based on script and common words
  const detectLanguage = useCallback((text: string): string => {
    if (!text.trim()) return currentLanguage
    
    // Check for Devanagari script (Hindi)
    const devanagariPattern = /[\u0900-\u097F]/
    if (devanagariPattern.test(text)) {
      return 'hi'
    }
    
    // Check for common Hindi words in English script
    const hindiWords = ['main', 'hai', 'hoon', 'aur', 'kya', 'kaise', 'kahan', 'kab', 'kaun', 'mere', 'mera', 'meri', 'dard', 'takleef', 'bimari', 'dawai']
    const words = text.toLowerCase().split(/\s+/)
    const hindiWordCount = words.filter(word => hindiWords.includes(word)).length
    
    if (hindiWordCount > words.length * 0.2) { // If 20% of words are Hindi
      return 'hi'
    }
    
    return 'en'
  }, [currentLanguage])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening || disabled) return

    setError(null)
    setTranscript('')
    setInterimTranscript('')
    
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
      setError('Failed to start speech recognition. Please try again.')
    }
  }, [isListening, disabled])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return

    try {
      recognitionRef.current.stop()
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    } catch (error) {
      console.error('Error stopping recognition:', error)
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const changeLanguage = useCallback((newLang: 'en' | 'hi' | 'auto') => {
    if (recognitionRef.current) {
      const wasListening = isListening
      if (wasListening) {
        stopListening()
      }
      
      if (newLang === 'auto') {
        // Auto-detect based on browser/system language
        const userLang = navigator.language.split('-')[0]
        const detectedLang = userLang === 'hi' ? 'hi' : 'en'
        recognitionRef.current.lang = LANGUAGE_CONFIG[detectedLang].code
        setCurrentLanguage(detectedLang)
      } else {
        recognitionRef.current.lang = LANGUAGE_CONFIG[newLang].code
        setCurrentLanguage(newLang)
      }
      
      if (wasListening) {
        setTimeout(() => startListening(), 100)
      }
    }
  }, [isListening, startListening, stopListening])

  const clearTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setConfidence(0)
  }, [])

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <p className="text-sm text-yellow-800">
          <strong>Speech Recognition Not Available</strong><br />
          Please use Chrome, Edge, or Safari browsers for voice input, or enter text manually.
        </p>
      </div>
    )
  }

  const currentTranscript = transcript + (interimTranscript ? ` ${interimTranscript}` : '')

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Language Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Language:</span>
          <div className="flex space-x-1">
            {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => changeLanguage(key as 'en' | 'hi' | 'auto')}
                disabled={disabled || isListening}
                className={`px-2 py-1 text-xs rounded-md flex items-center space-x-1 transition-colors ${
                  currentLanguage === key || (language === 'auto' && key === 'auto')
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                } ${disabled || isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>{config.flag}</span>
                <span>{key === 'auto' ? 'Auto' : key.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
        
        {confidence > 0 && (
          <div className="text-xs text-gray-500">
            Confidence: {Math.round(confidence * 100)}%
          </div>
        )}
      </div>

      {/* Voice Input Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleListening}
          disabled={disabled}
          className={`p-3 rounded-full transition-all duration-200 ${
            isListening
              ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}`}
          title={isListening ? 'Stop recording' : 'Start recording'}
        >
          {isListening ? (
            <StopIcon className="h-6 w-6" />
          ) : (
            <MicrophoneIcon className="h-6 w-6" />
          )}
        </button>

        <div className="flex-1">
          {isListening ? (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-600">
                Listening... (auto-stops after {autoStop}s of silence)
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{placeholder}</p>
          )}
        </div>

        {currentTranscript && (
          <button
            onClick={clearTranscript}
            disabled={disabled || isListening}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Transcript Display */}
      {currentTranscript && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Voice Input:</span>
            <span className="text-xs text-gray-500">
              {LANGUAGE_CONFIG[currentLanguage as keyof typeof LANGUAGE_CONFIG]?.name}
            </span>
          </div>
          <p className="text-gray-900 leading-relaxed">
            {transcript}
            {interimTranscript && (
              <span className="text-gray-500 italic"> {interimTranscript}</span>
            )}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Click the microphone button and speak clearly</li>
          <li>Switch between English and Hindi using language buttons</li>
          <li>Recording stops automatically after {autoStop} seconds of silence</li>
          <li>You can mix English and Hindi words in the same sentence</li>
          <li>For best results, speak at normal pace in a quiet environment</li>
        </ul>
      </div>
    </div>
  )
}