'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DevLogin() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const createTestUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://via.placeholder.com/100',
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage('✅ Test user created successfully! Redirecting...')
        // 等待一下再跳转
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        setMessage(`❌ Creation failed: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-center mb-6">Developer Test Login</h1>
        
        <div className="space-y-4">
          <div className="text-center text-gray-600 text-sm">
            <p>⚠️ This is a temporary test feature</p>
            <p>Used to bypass Google OAuth network issues</p>
          </div>
          
          <button
            onClick={createTestUser}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Test User & Login'}
          </button>
          
          {message && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm text-center">
              {message}
            </div>
          )}
          
          <div className="text-center">
            <a 
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
