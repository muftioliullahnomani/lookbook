import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usersAPI, postsAPI, friendsAPI, blockAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import { MapPin, Link as LinkIcon, Calendar, UserPlus, UserCheck, UserX, Ban } from 'lucide-react'
import { format } from 'date-fns'

const UserProfile = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [friendshipStatus, setFriendshipStatus] = useState(null)
  const [friendshipId, setFriendshipId] = useState(null)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [cancellingRequest, setCancellingRequest] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      const [userResponse, postsResponse] = await Promise.all([
        usersAPI.getUser(userId),
        postsAPI.getPosts(),
      ])
      
      setUser(userResponse.data)
      const allPosts = postsResponse.data.results || postsResponse.data
      const userPosts = allPosts.filter(post => post.author.id === parseInt(userId))
      setPosts(userPosts)
      
      // Check friendship status
      await checkFriendshipStatus()
      
      // Check if user is blocked
      await checkBlockStatus()
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
    setLoading(false)
  }
  
  const checkBlockStatus = async () => {
    try {
      const response = await blockAPI.getBlockedUsers()
      const blockedUsers = response.data
      const isUserBlocked = blockedUsers.some(u => u.id === parseInt(userId))
      setIsBlocked(isUserBlocked)
    } catch (error) {
      console.error('Failed to check block status:', error)
    }
  }

  const checkFriendshipStatus = async () => {
    try {
      const response = await friendsAPI.getCategories()
      const { friends, pending } = response.data
      
      // Check if user is in friends list
      const friend = friends.find(f => f.id === parseInt(userId))
      if (friend) {
        setFriendshipStatus('accepted')
        setFriendshipId(friend.friendship_id)
        return
      }
      
      // Check if user is in pending list
      const pendingUser = pending.find(p => p.id === parseInt(userId))
      if (pendingUser) {
        setFriendshipStatus(pendingUser.request_type === 'sent' ? 'pending_sent' : 'pending_received')
        setFriendshipId(pendingUser.friendship_id)
        return
      }
      
      // No relationship
      setFriendshipStatus(null)
      setFriendshipId(null)
    } catch (error) {
      console.error('Failed to check friendship:', error)
    }
  }

  const handleSendFriendRequest = async () => {
    setSendingRequest(true)
    try {
      await friendsAPI.sendRequest(userId)
      await checkFriendshipStatus()
    } catch (error) {
      console.error('Failed to send friend request:', error)
      const errorMsg = error.response?.data?.error || 'Failed to send friend request'
      alert(errorMsg)
    }
    setSendingRequest(false)
  }

  const handleCancelRequest = async () => {
    if (!friendshipId) {
      console.error('No friendship ID found')
      return
    }
    
    setCancellingRequest(true)
    try {
      const response = await friendsAPI.rejectRequest(friendshipId)
      console.log('Cancel request response:', response)
      // Reset status after successful cancellation
      setFriendshipStatus(null)
      setFriendshipId(null)
      await checkFriendshipStatus()
    } catch (error) {
      console.error('Failed to cancel friend request:', error)
      const errorMsg = error.response?.data?.error || 'Failed to cancel request'
      alert(errorMsg)
    }
    setCancellingRequest(false)
  }

  const handleAcceptRequest = async () => {
    if (!friendshipId) return
    
    setSendingRequest(true)
    try {
      await friendsAPI.acceptRequest(friendshipId)
      await checkFriendshipStatus()
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      alert('Failed to accept request')
    }
    setSendingRequest(false)
  }

  const handleUnfriend = async () => {
    if (!friendshipId) return
    if (!window.confirm(`Unfriend ${user.username}?`)) return
    
    setSendingRequest(true)
    try {
      await friendsAPI.rejectRequest(friendshipId)
      setFriendshipStatus(null)
      setFriendshipId(null)
      await checkFriendshipStatus()
      alert('Unfriended successfully')
    } catch (error) {
      console.error('Failed to unfriend:', error)
      alert('Failed to unfriend')
    }
    setSendingRequest(false)
  }

  const handleBlockUser = async () => {
    if (!window.confirm(`Block ${user.username}? They won't be able to see your posts or interact with you.`)) return
    
    try {
      await blockAPI.blockUser(userId)
      setIsBlocked(true)
      // Remove friendship if exists
      setFriendshipStatus(null)
      setFriendshipId(null)
      alert('User blocked successfully')
    } catch (error) {
      console.error('Failed to block user:', error)
      alert('Failed to block user')
    }
  }

  const handleUnblockUser = async () => {
    try {
      await blockAPI.unblockUser(userId)
      setIsBlocked(false)
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

  if (!user) {
    return (
      <div className="card text-center">
        <p className="text-gray-500">User not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold flex-shrink-0">
            {user.username[0].toUpperCase()}
          </div>
          
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {user.first_name} {user.last_name}
                  </h1>
                  {/* Disabled User Badge */}
                  {user.is_active === false && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm font-medium rounded">
                      Disabled User
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
              </div>
              
              {/* Friend Request Button - Only show if not viewing own profile */}
              {currentUser && currentUser.id !== parseInt(userId) && (
                <div className="flex gap-2">
                  {!friendshipStatus ? (
                    <button
                      onClick={user.is_active !== false && !user.has_blocked_me && !isBlocked ? handleSendFriendRequest : null}
                      disabled={sendingRequest || user.is_active === false || user.has_blocked_me || isBlocked}
                      className={`p-3 rounded-lg transition-colors ${
                        user.is_active === false || user.has_blocked_me || isBlocked
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white disabled:opacity-50'
                      }`}
                      title={user.is_active === false ? 'Cannot send friend request to disabled user' : (user.has_blocked_me ? 'This user has blocked you' : (isBlocked ? 'You have blocked this user' : (sendingRequest ? 'Sending...' : 'Add Friend')))}
                    >
                      <UserPlus size={20} />
                    </button>
                  ) : friendshipStatus === 'accepted' ? (
                    <button
                      onClick={handleUnfriend}
                      disabled={sendingRequest}
                      className="p-3 bg-green-100 hover:bg-red-100 dark:bg-green-900 dark:hover:bg-red-900 text-green-800 hover:text-red-800 dark:text-green-200 dark:hover:text-red-200 rounded-lg transition-colors disabled:opacity-50"
                      title="Click to unfriend"
                    >
                      <UserCheck size={20} />
                    </button>
                  ) : friendshipStatus === 'pending_sent' ? (
                    <button
                      onClick={handleCancelRequest}
                      disabled={cancellingRequest}
                      className="p-3 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-200 rounded-lg transition-colors disabled:opacity-50"
                      title={cancellingRequest ? 'Cancelling...' : 'Cancel Request'}
                    >
                      <UserX size={20} />
                    </button>
                  ) : friendshipStatus === 'pending_received' ? (
                    <>
                      <button
                        onClick={handleAcceptRequest}
                        disabled={sendingRequest}
                        className="p-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        title={sendingRequest ? 'Accepting...' : 'Accept Request'}
                      >
                        <UserCheck size={20} />
                      </button>
                      <button
                        onClick={handleCancelRequest}
                        disabled={cancellingRequest}
                        className="p-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <UserX size={20} />
                      </button>
                    </>
                  ) : null}
                  
                  {/* Block/Unblock Button */}
                  <button
                    onClick={isBlocked ? handleUnblockUser : handleBlockUser}
                    className={`p-3 rounded-lg transition-colors ${
                      isBlocked 
                        ? 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white' 
                        : 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white'
                    }`}
                    title={isBlocked ? 'Unblock' : 'Block'}
                  >
                    <Ban size={20} />
                  </button>
                </div>
              )}
            </div>
            
            {user.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio}</p>
            )}
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
              {user.location && (
                <div className="flex items-center space-x-1">
                  <MapPin size={16} />
                  <span>{user.location}</span>
                </div>
              )}
              
              {user.website && (
                <div className="flex items-center space-x-1">
                  <LinkIcon size={16} />
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline truncate max-w-[150px]"
                  >
                    {user.website}
                  </a>
                </div>
              )}
              
              {user.created_at && (
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Joined {format(new Date(user.created_at), 'MMMM yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Posts</h2>
        {posts.length === 0 ? (
          <div className="card text-center text-gray-500">
            <p>No posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={loadUserData}
              onDelete={() => {}}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default UserProfile
