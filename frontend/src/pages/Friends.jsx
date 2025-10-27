import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { friendsAPI } from '../utils/api'
import { UserPlus, Check, X, Users, Clock, Sparkles, Eye, UserMinus } from 'lucide-react'

const Friends = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState({
    friends: [],
    pending: [],
    suggestions: []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('friends')

  useEffect(() => {
    loadFriendCategories()
  }, [])

  const loadFriendCategories = async () => {
    try {
      const response = await friendsAPI.getCategories()
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to load friend categories:', error)
    }
    setLoading(false)
  }

  const handleSendRequest = async (userId) => {
    try {
      await friendsAPI.sendRequest(userId)
      loadFriendCategories()
    } catch (error) {
      console.error('Failed to send friend request:', error)
    }
  }

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendsAPI.acceptRequest(friendshipId)
      loadFriendCategories()
    } catch (error) {
      console.error('Failed to accept friend request:', error)
    }
  }

  const handleRejectRequest = async (friendshipId) => {
    try {
      const response = await friendsAPI.rejectRequest(friendshipId)
      console.log('Reject/Cancel response:', response)
      await loadFriendCategories()
    } catch (error) {
      console.error('Failed to reject/cancel friend request:', error)
      const errorMsg = error.response?.data?.error || 'Failed to process request'
      alert(errorMsg)
    }
  }

  const handleUnfriend = async (friendshipId, username) => {
    if (!window.confirm(`Are you sure you want to unfriend ${username}?`)) {
      return
    }
    
    try {
      await friendsAPI.unfriend(friendshipId)
      await loadFriendCategories()
    } catch (error) {
      console.error('Failed to unfriend:', error)
      const errorMsg = error.response?.data?.error || 'Failed to unfriend'
      alert(errorMsg)
    }
  }

  const handleViewProfile = (userId) => {
    navigate(`/user/${userId}`)
  }

  const renderUserCard = (user) => {
    const displayName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.username

    return (
      <div key={user.id} className="card hover:shadow-lg transition-shadow">
        <div className="flex items-center space-x-4">
          <div 
            className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleViewProfile(user.id)}
            title="View profile"
          >
            {user.profile_picture ? (
              <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className="font-semibold text-lg truncate cursor-pointer hover:text-primary-600 transition-colors"
                onClick={() => handleViewProfile(user.id)}
                title="View profile"
              >
                {displayName}
              </h3>
              {/* Disabled User Badge */}
              {user.is_active === false && (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded flex-shrink-0">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-gray-600 truncate">@{user.username}</p>
            {user.request_type && (
              <p className="text-xs text-gray-500 mt-1">
                {user.request_type === 'sent' ? 'Request sent' : 'Wants to be friends'}
              </p>
            )}
          </div>

          <div className="flex space-x-2 flex-shrink-0">
            <button
              onClick={() => handleViewProfile(user.id)}
              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full text-blue-600 transition-colors"
              title="View profile"
            >
              <Eye size={20} />
            </button>
            
            {user.category === 'friends' && (
              <button
                onClick={() => handleUnfriend(user.friendship_id, user.username)}
                className="p-2 bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
                title="Unfriend"
              >
                <UserMinus size={20} />
              </button>
            )}
            
            {user.category === 'pending' && user.request_type === 'received' && (
              <>
                <button
                  onClick={() => handleAcceptRequest(user.friendship_id)}
                  className="p-2 bg-green-100 hover:bg-green-200 rounded-full text-green-600 transition-colors"
                  title="Accept request"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => handleRejectRequest(user.friendship_id)}
                  className="p-2 bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
                  title="Reject request"
                >
                  <X size={20} />
                </button>
              </>
            )}

            {user.category === 'pending' && user.request_type === 'sent' && (
              <button
                onClick={() => handleRejectRequest(user.friendship_id)}
                className="p-2 bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
                title="Cancel request"
              >
                <X size={20} />
              </button>
            )}

            {user.category === 'suggestions' && (
              <button
                onClick={user.is_active !== false && !user.has_blocked_me && !user.i_have_blocked ? () => handleSendRequest(user.id) : null}
                disabled={user.is_active === false || user.has_blocked_me || user.i_have_blocked}
                className={`p-2 rounded-full transition-colors ${
                  user.is_active === false || user.has_blocked_me || user.i_have_blocked
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-primary-100 hover:bg-primary-200 text-primary-600'
                }`}
                title={user.is_active === false ? 'Cannot send friend request to disabled user' : (user.has_blocked_me ? 'This user has blocked you' : (user.i_have_blocked ? 'You have blocked this user' : 'Send friend request'))}
              >
                <UserPlus size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'friends', label: 'Friends', icon: Users, count: categories.friends.length },
    { id: 'pending', label: 'Pending', icon: Clock, count: categories.pending.length },
    { id: 'suggestions', label: 'Suggestions', icon: Sparkles, count: categories.suggestions.length }
  ]

  const activeData = categories[activeTab] || []

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Friends</h1>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id ? 'bg-white text-primary-600' : 'bg-gray-300 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeData.length === 0 ? (
        <div className="card text-center text-gray-500">
          {activeTab === 'friends' && (
            <>
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="font-semibold">No friends yet</p>
              <p className="text-sm mt-2">Start connecting with people!</p>
            </>
          )}
          {activeTab === 'pending' && (
            <>
              <Clock size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="font-semibold">No pending requests</p>
              <p className="text-sm mt-2">All caught up!</p>
            </>
          )}
          {activeTab === 'suggestions' && (
            <>
              <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="font-semibold">No suggestions available</p>
              <p className="text-sm mt-2">Check back later!</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeData.map(renderUserCard)}
        </div>
      )}
    </div>
  )
}

export default Friends
