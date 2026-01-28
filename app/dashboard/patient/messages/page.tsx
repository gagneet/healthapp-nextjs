'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

interface MessageConversation {
  id: string
  subject?: string | null
  providerId: string
  providerType: string
  status: string
  lastMessageAt: string
  lastMessage?: {
    id: string
    content: string
    senderType: string
    createdAt: string
    isRead: boolean
  } | null
}

interface ConversationDetail {
  id: string
  subject?: string | null
  providerType: string
  providerId: string
  messages: Array<{
    id: string
    content: string
    senderType: string
    createdAt: string
  }>
}

export default function PatientMessagesPage() {
  const [conversations, setConversations] = useState<MessageConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const fetchConversations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/patient/messages')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load conversations')
      }
      setConversations(data.payload?.data || [])
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError('Unable to load messages')
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationDetail = async (conversationId: string) => {
    setDetailLoading(true)
    try {
      const response = await fetch(`/api/patient/messages/${conversationId}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to load conversation')
      }
      setSelectedConversation(data.payload?.data || null)
    } catch (err) {
      console.error('Failed to load conversation:', err)
      setError('Unable to load conversation')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleSendMessage = async () => {
    if (!selectedConversation || !message.trim()) return
    try {
      const response = await fetch(`/api/patient/messages/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.payload?.error?.message || 'Failed to send message')
      }
      setMessage('')
      await fetchConversationDetail(selectedConversation.id)
      await fetchConversations()
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Unable to send message')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{error}</p>
        <button onClick={fetchConversations} className="mt-3 text-sm text-blue-600 hover:text-blue-700">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-4">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
        </div>
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500">No conversations yet.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => fetchConversationDetail(conversation.id)}
                className={`w-full text-left border rounded-md p-3 hover:border-blue-400 transition ${selectedConversation?.id === conversation.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <p className="text-sm font-medium text-gray-900">
                  {conversation.subject || 'Care team conversation'}
                </p>
                {conversation.lastMessage && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {conversation.lastMessage.content}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Status: {conversation.status}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
        {selectedConversation ? (
          <div className="flex flex-col h-full">
            <div className="border-b border-gray-200 pb-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedConversation.subject || 'Conversation'}</h3>
              <p className="text-xs text-gray-500">Provider type: {selectedConversation.providerType}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {detailLoading ? (
                <p className="text-sm text-gray-500">Loading conversation...</p>
              ) : (
                selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-md text-sm ${msg.senderType === 'PATIENT' ? 'bg-blue-50 ml-auto' : 'bg-gray-100'}`}
                  >
                    <p className="text-xs text-gray-500 mb-1">{msg.senderType}</p>
                    <p className="text-gray-800">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Type your message..."
              />
              <button
                onClick={handleSendMessage}
                className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            Select a conversation to view messages.
          </div>
        )}
      </div>
    </div>
  )
}
