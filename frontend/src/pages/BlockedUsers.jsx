import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blockAPI } from '../utils/api'
import { Ban, UserX, Shield } from 'lucide-react'

const BlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBlockedUsers()
  }, [])

  const loadBlockedUsers = async () => {
    try {
      const response = await blockAPI.getBlockedUsers()
      setBlockedUsers(response.data)
    } catch (error) {
      console.error('Failed to load blocked users:', error)
    }
    setLoading(false)
  }

  const handleUnblock = async (userId, username) => {
    if (!window.confirm(`Unblock ${username}?`)) return
    
    try {
      await blockAPI.unblockUser(userId)
      setBlockedUsers(blockedUsers.filter(u => u.id !== userId))
      alert('User unblocked successfully')
    } catch (error) {
      console.error('Failed to unblock user:', error)
      alert('Failed to unblock user')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <Ban size={32} className="text-red-500" />
        <h1 className="text-3xl font-bold dark:text-white">Blocked Users</h1>
      </div>
      
      {blockedUsers.length === 0 ? (
        <div className="card text-center text-gray-500">
          <UserX size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="font-semibold dark:text-gray-300">No blocked users</p>
          <p className="text-sm mt-2 dark:text-gray-400">
            Users you block will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blockedUsers.map((user) => (
            <div key={user.id} className="card flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to={`/user/${user.id}`}>
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                </Link>
                <div>
                  <Link to={`/user/${user.id}`}>
                    <h3 className="font-semibold dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                      {user.username}
                    </h3>
                  </Link>
                  {(user.first_name || user.last_name) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.first_name} {user.last_name}
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleUnblock(user.id, user.username)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Shield size={18} />
                <span>Unblock</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BlockedUsers
