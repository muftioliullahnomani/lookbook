import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Home, Users, User, LogOut, FileText, Menu, X, Shield, Moon, Sun } from 'lucide-react'

const Layout = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const isAdmin = user?.is_staff || user?.is_superuser

  const handleAdminPanelClick = () => {
    window.open('http://localhost:8000/admin/', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                Lookbook
              </Link>
              
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                >
                  <Home size={20} />
                  <span>Home</span>
                </Link>
                
                <Link
                  to="/friends"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                >
                  <Users size={20} />
                  <span>Friends</span>
                </Link>
                
                <Link
                  to="/pages"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                >
                  <FileText size={20} />
                  <span>Pages</span>
                </Link>
                
                <Link
                  to="/groups"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                >
                  <Users size={20} />
                  <span>Groups</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
              </button>
              
              {isAdmin && (
                <button
                  onClick={handleAdminPanelClick}
                  className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 transition-colors"
                  title="Open Admin Panel"
                >
                  <Shield size={20} />
                  <span className="hidden md:inline">Admin Panel</span>
                </button>
              )}
              
              <Link
                to="/profile"
                className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
              >
                <User size={20} />
                <span className="hidden md:inline">{user?.username}</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              >
                <LogOut size={20} />
                <span className="hidden md:inline">Logout</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
              >
                <Home size={20} />
                <span>Home</span>
              </Link>
              
              <Link
                to="/friends"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
              >
                <Users size={20} />
                <span>Friends</span>
              </Link>
              
              <Link
                to="/pages"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
              >
                <FileText size={20} />
                <span>Pages</span>
              </Link>
              
              <Link
                to="/groups"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
              >
                <Users size={20} />
                <span>Groups</span>
              </Link>

              {isAdmin && (
                <button
                  onClick={() => {
                    handleAdminPanelClick()
                    closeMobileMenu()
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 transition-colors"
                >
                  <Shield size={20} />
                  <span>Admin Panel</span>
                </button>
              )}

              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors sm:hidden"
              >
                <User size={20} />
                <span>{user?.username}</span>
              </Link>
              
              <button
                onClick={() => {
                  handleLogout()
                  closeMobileMenu()
                }}
                className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors sm:hidden"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
