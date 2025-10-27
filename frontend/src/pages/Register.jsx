import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.username.trim()) {
      setError('Username cannot be empty')
      return
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!formData.email.trim()) {
      setError('Email cannot be empty')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    if (!formData.password) {
      setError('Password cannot be empty')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (formData.password !== formData.password2) {
      setError('Passwords do not match')
      return
    }

    // Age validation (optional but if provided, must be 13+)
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age = age - 1
      }
      
      if (age < 13) {
        setError('You must be at least 13 years old')
        return
      }
    }

    setLoading(true)
    const result = await register(formData)
    
    if (result.success) {
      navigate('/login')
    } else {
      // Customize error messages
      let errorMessage = typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
      
      if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('exists')) {
        errorMessage = 'This username is already taken'
      } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('exists')) {
        errorMessage = 'This email is already registered'
      } else if (errorMessage.toLowerCase().includes('password') && errorMessage.toLowerCase().includes('common')) {
        errorMessage = 'This password is too common, please use a stronger password'
      }
      
      setError(errorMessage)
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const calculateAge = (birthDate) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12">
      <div className="max-w-md w-full mx-4">
        <div className="card">
          <h1 className="text-3xl font-bold text-center mb-2 text-primary-600">Join Lookbook</h1>
          <p className="text-center text-gray-600 mb-8">Create your account</p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start space-x-3 animate-shake">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Registration Failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="input-field"
                max={new Date().toISOString().split('T')[0]}
              />
              {formData.date_of_birth && (
                <p className={`text-xs mt-1 ${calculateAge(formData.date_of_birth) >= 13 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateAge(formData.date_of_birth) >= 13 
                    ? `✓ You are ${calculateAge(formData.date_of_birth)} years old` 
                    : `✗ You are ${calculateAge(formData.date_of_birth)} years old (must be at least 13)`
                  }
                </p>
              )}
              {!formData.date_of_birth && (
                <p className="text-xs text-gray-500 mt-1">Optional - You must be at least 13 years old</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p className="font-medium">Password must contain:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                    One uppercase letter (A-Z)
                  </li>
                  <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                    One lowercase letter (a-z)
                  </li>
                  <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                    One number (0-9)
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword2 ? 'text' : 'password'}
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
