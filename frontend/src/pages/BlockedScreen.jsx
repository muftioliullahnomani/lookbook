import { useState } from 'react'
import { Ban, AlertCircle, Send } from 'lucide-react'
import { authAPI } from '../utils/api'

const BlockedScreen = ({ onLogout }) => {
  const [requestSent, setRequestSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  const handleRequestUnblock = async () => {
    if (!message.trim()) {
      alert('Please provide a reason for your unblock request')
      return
    }

    setSending(true)
    try {
      await authAPI.requestUnblock({ message })
      setRequestSent(true)
      alert('Your unblock request has been sent to administrators')
    } catch (error) {
      console.error('Failed to send unblock request:', error)
      alert('Failed to send request. Please try again.')
    }
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <Ban size={48} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Account Blocked
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your account has been temporarily blocked by administrators
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                Why was my account blocked?
              </h3>
              <p className="text-sm text-red-800 dark:text-red-400">
                Your account may have been blocked due to violation of community guidelines, 
                suspicious activity, or administrative review. If you believe this is a mistake, 
                you can request to unblock your account below.
              </p>
            </div>
          </div>
        </div>

        {/* Request Form */}
        {!requestSent ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Request Account Unblock
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please explain why you believe your account should be unblocked..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200 resize-none"
                rows="5"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Provide a detailed explanation. Administrators will review your request.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRequestUnblock}
                disabled={sending || !message.trim()}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
                <span>{sending ? 'Sending...' : 'Send Unblock Request'}</span>
              </button>
              
              <button
                onClick={onLogout}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <Send size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Request Sent Successfully
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your unblock request has been submitted to administrators. 
              You will be notified via email once your request is reviewed.
            </p>
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact us at{' '}
            <a href="mailto:support@lookbook.com" className="text-primary-600 hover:underline">
              support@lookbook.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default BlockedScreen
