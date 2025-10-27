import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!credentials.username.trim()) {
      setError('Username cannot be empty')
      return
    }

    if (!credentials.password) {
      setError('Password cannot be empty')
      return
    }

    if (credentials.password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    setLoading(true)

    const result = await login(credentials, rememberMe)
    
    if (result.success) {
      navigate('/')
    } else {
      // Customize error messages
      let errorMessage = result.error
      
      if (errorMessage.toLowerCase().includes('disabled') || 
          errorMessage.toLowerCase().includes('deactivated')) {
        errorMessage = 'You are disabled. Your account has been deactivated by administrators.'
      } else if (errorMessage.toLowerCase().includes('credentials') || 
          errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('incorrect')) {
        errorMessage = 'Invalid username or password'
      } else if (errorMessage.toLowerCase().includes('network')) {
        errorMessage = 'Please check your internet connection'
      } else if (errorMessage.toLowerCase().includes('not found')) {
        errorMessage = 'Username not found'
      }
      
      setError(errorMessage)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full mx-4">
        <div className="card">
          <h1 className="text-3xl font-bold text-center mb-2 text-primary-600">Lookbook</h1>
          <p className="text-center text-gray-600 mb-8">Connect with friends and the world</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-start space-x-3 animate-shake">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium dark:text-red-200">Login Failed</p>
                <p className="text-sm mt-1 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                Keep me logged in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
