import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { postsAPI, authAPI } from '../utils/api'
import PostCard from '../components/PostCard'
import { MapPin, Link as LinkIcon, Calendar, Edit2, Camera, X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    location: '',
    website: '',
    date_of_birth: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUserPosts()
  }, [])

  const loadUserPosts = async () => {
    try {
      const response = await postsAPI.getPosts()
      const allPosts = response.data.results || response.data
      const userPosts = allPosts.filter(post => post.author.id === user.id)
      setPosts(userPosts)
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
    setLoading(false)
  }

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(post => post.id !== postId))
  }

  const openEditModal = () => {
    setEditData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      date_of_birth: user?.date_of_birth || ''
    })
    setShowEditModal(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await authAPI.updateProfile(editData)
      updateUser(response.data)
      setShowEditModal(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile')
    }
    setSaving(false)
  }

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('profile_picture', file)

    try {
      const response = await authAPI.uploadProfilePicture(formData)
      updateUser(response.data)
    } catch (error) {
      console.error('Failed to upload profile picture:', error)
      alert('Failed to upload profile picture')
    }
  }

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('cover_photo', file)

    try {
      const response = await authAPI.uploadCoverPhoto(formData)
      updateUser(response.data)
    } catch (error) {
      console.error('Failed to upload cover photo:', error)
      alert('Failed to upload cover photo')
    }
  }

  const handleRemoveProfilePicture = async () => {
    if (!window.confirm('Remove profile picture?')) return

    const formData = new FormData()
    formData.append('remove_profile_picture', 'true')

    try {
      const response = await authAPI.updateProfile(formData)
      updateUser(response.data)
    } catch (error) {
      console.error('Failed to remove profile picture:', error)
      alert('Failed to remove profile picture')
    }
  }

  const handleRemoveCoverPhoto = async () => {
    if (!window.confirm('Remove cover photo?')) return

    const formData = new FormData()
    formData.append('remove_cover_photo', 'true')

    try {
      const response = await authAPI.updateProfile(formData)
      updateUser(response.data)
    } catch (error) {
      console.error('Failed to remove cover photo:', error)
      alert('Failed to remove cover photo')
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
      {/* Profile Header */}
      <div className="card mb-6">
        {/* Cover Photo */}
        <div className="relative -mx-6 -mt-6 mb-6 h-32 sm:h-48 bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-xl">
          {user?.cover_photo && (
            <img src={user.cover_photo} alt="Cover" className="w-full h-full object-cover rounded-t-xl" />
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <label className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <Camera size={20} className="dark:text-gray-200" />
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverPhotoChange}
                className="hidden"
              />
            </label>
            {user?.cover_photo && (
              <button
                onClick={handleRemoveCoverPhoto}
                className="p-2 bg-red-500 dark:bg-red-600 rounded-full shadow-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-white"
                title="Remove cover photo"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative">
          {/* Profile Picture */}
          <div className="relative -mt-16 sm:-mt-20">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl sm:text-5xl font-bold border-4 border-white shadow-lg overflow-hidden">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                user?.username[0].toUpperCase()
              )}
            </div>
            <div className="absolute bottom-0 right-0 flex gap-1">
              <label className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                <Camera size={16} className="dark:text-gray-200" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
              {user?.profile_picture && (
                <button
                  onClick={handleRemoveProfilePicture}
                  className="p-2 bg-red-500 dark:bg-red-600 rounded-full shadow-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-white"
                  title="Remove profile picture"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {user?.first_name} {user?.last_name}
                </h1>
                <p className="text-gray-600">@{user?.username}</p>
              </div>
              <button
                onClick={openEditModal}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={18} />
                <span>Edit Profile</span>
              </button>
            </div>
            
            {user?.bio && (
              <p className="text-gray-700 mb-4">{user.bio}</p>
            )}
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-sm text-gray-600">
              {user?.location && (
                <div className="flex items-center space-x-1">
                  <MapPin size={16} />
                  <span>{user.location}</span>
                </div>
              )}
              
              {user?.website && (
                <div className="flex items-center space-x-1">
                  <LinkIcon size={16} />
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline truncate max-w-[150px]"
                  >
                    {user.website}
                  </a>
                </div>
              )}
              
              {user?.created_at && (
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
        <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
        {posts.length === 0 ? (
          <div className="card text-center text-gray-500">
            <p>You haven't posted anything yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={loadUserPosts}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editData.first_name}
                    onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editData.last_name}
                    onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  className="input-field"
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="input-field"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={editData.website}
                  onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={editData.date_of_birth}
                  onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-50 w-full sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
