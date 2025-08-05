// lib/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios'
import { AuthResponse, LoginCredentials, RegisterData } from '@/types/auth'
import { createLogger } from './logger'

const logger = createLogger('API')
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Don't redirect if it's a verify token request - let the auth context handle it
      const isVerifyRequest = error.config?.url?.includes('/auth/verify')
      
      if (!isVerifyRequest && typeof window !== 'undefined') {
        // Token expired or invalid for non-verify requests
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API functions
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/sign-in', credentials)
      const backendResponse = response.data
      logger.debug('Raw backend response:', backendResponse)
      
      // Transform backend response format to frontend format
      if (backendResponse.status && backendResponse.payload?.data) {
        logger.debug('Full payload.data:', backendResponse.payload.data)
        logger.debug('Full payload:', backendResponse.payload)
        const userData = backendResponse.payload.data.users
        const tokens = backendResponse.payload.tokens  // Tokens are at payload.tokens, not payload.data.tokens
        logger.debug('Extracted userData:', userData)
        logger.debug('Extracted tokens:', tokens)
        logger.debug('Available data keys:', Object.keys(backendResponse.payload.data))
        logger.debug('Available payload keys:', Object.keys(backendResponse.payload))
        
        // Extract user data from the nested structure
        const userKey = Object.keys(userData)[0]
        const user = userData[userKey]?.basic_info
        logger.debug('User key:', userKey)
        logger.debug('Extracted user:', user)
        
        if (user && tokens?.accessToken) {
          logger.debug('Login parsing successful, returning success response')
          return {
            success: true,
            data: {
              user: user,
              token: tokens.accessToken,
              expires_in: 86400 // 24 hours default
            },
            message: backendResponse.payload.message || 'Login successful'
          }
        } else {
          logger.warn('Missing user or token data:', { user: !!user, token: !!tokens?.accessToken })
        }
      } else {
        logger.warn('Invalid backend response structure:', { status: backendResponse.status, hasPayload: !!backendResponse.payload, hasData: !!backendResponse.payload?.data })
      }
      
      return {
        success: false,
        message: backendResponse.payload?.message || 'Login failed'
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const backendError = error.response.data
        return {
          success: false,
          message: backendError.payload?.message || 'Login failed'
        }
      }
      throw new Error('Network error occurred')
    }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/sign-up', data)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data
      }
      throw new Error('Network error occurred')
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Even if logout fails, we should clear local storage
      logger.error('Logout error:', error)
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
    }
  },

  refreshToken: async (): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/refresh-token')
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data
      }
      throw new Error('Network error occurred')
    }
  },

  verifyToken: async (): Promise<AuthResponse> => {
    try {
      const response = await api.get('/auth/verify')
      const backendResponse = response.data
      logger.debug('Verify token response:', backendResponse)
      
      // Transform backend response format similar to login
      if (backendResponse.status && backendResponse.payload?.data) {
        const userData = backendResponse.payload.data.users
        
        if (userData) {
          // Extract user data from the nested structure
          const userKey = Object.keys(userData)[0]
          const user = userData[userKey]?.basic_info
          
          if (user) {
            return {
              success: true,
              data: {
                user: user,
                token: localStorage.getItem('authToken') || '', // Use existing token
                expires_in: 86400
              },
              message: backendResponse.payload.message || 'Token verified'
            }
          }
        }
      }
      
      return {
        success: false,
        message: backendResponse.payload?.message || 'Token verification failed'
      }
    } catch (error) {
      logger.error('Token verification error:', error)
      if (axios.isAxiosError(error) && error.response) {
        const backendError = error.response.data
        return {
          success: false,
          message: backendError.payload?.message || 'Token verification failed'
        }
      }
      throw new Error('Network error occurred')
    }
  },

  forgotPassword: async (email: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data
      }
      throw new Error('Network error occurred')
    }
  },

  resetPassword: async (token: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/reset-password', { token, password })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data
      }
      throw new Error('Network error occurred')
    }
  },
}

// Generic API functions
export const apiRequest = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await api.get(endpoint)
    return response.data
  },

  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await api.post(endpoint, data)
    return response.data
  },

  put: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await api.put(endpoint, data)
    return response.data
  },

  patch: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await api.patch(endpoint, data)
    return response.data
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await api.delete(endpoint)
    return response.data
  },
}

export default api