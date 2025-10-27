import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { groupsAPI, postsAPI } from '../utils/api'
import { Users, Lock, Globe, UserPlus, LogOut, Image, Video, Trash2, MoreVertical, Edit2, Camera } from 'lucide-react'
import PostCard from '../components/PostCard'

const GroupDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState({ title: '', content: '', image: null, video: null })
  const [creating, setCreating] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({ name: '', description: '', category: 'general', privacy: 'public' })
  const [saving, setSaving] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageType, setImageType] = useState('') // 'profile' or 'cover'
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadGroup()
    loadPosts()
  }, [id])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const loadGroup = async () => {
    try {
      const response = await groupsAPI.getGroup(id)
      setGroup(response.data)
    } catch (error) {
      console.error('Failed to load group:', error)
    }
    setLoading(false)
  }

  const loadPosts = async () => {
    try {
      const response = await postsAPI.getPosts()
      const allPosts = response.data.results || response.data
      // Filter posts for this group (you'll need to add group field to posts)
      setPosts(allPosts.filter(post => post.group === parseInt(id)))
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewPost({ ...newPost, image: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file is too large. Maximum size is 100MB.')
        return
      }
      setNewPost({ ...newPost, video: file })
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setNewPost({ ...newPost, image: null })
    setImagePreview(null)
  }

  const removeVideo = () => {
    setNewPost({ ...newPost, video: null })
    setVideoPreview(null)
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPost.content.trim()) return

    setCreating(true)
    try {
      const formData = new FormData()
      formData.append('content', newPost.content)
      if (newPost.title) formData.append('title', newPost.title)
      formData.append('visibility', 'public')
      if (newPost.image) formData.append('image', newPost.image)
      if (newPost.video) formData.append('video', newPost.video)
      formData.append('group', id)

      await postsAPI.createPost(formData)
      setNewPost({ title: '', content: '', image: null, video: null })
      setImagePreview(null)
      setVideoPreview(null)
      loadPosts()
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Failed to create post')
    }
    setCreating(false)
  }

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(post => post.id !== postId))
  }

  const handleJoinGroup = async () => {
    try {
      await groupsAPI.joinGroup(id)
      loadGroup()
    } catch (error) {
      console.error('Failed to join group:', error)
      alert('Failed to join group')
    }
  }

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return
    
    try {
      await groupsAPI.leaveGroup(id)
      loadGroup()
    } catch (error) {
      console.error('Failed to leave group:', error)
      alert('Failed to leave group')
    }
  }

  const handleDeleteGroup = async () => {
    if (!window.confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      await groupsAPI.deleteGroup(id)
      alert('Group deleted successfully')
      navigate('/groups')
    } catch (error) {
      console.error('Failed to delete group:', error)
      alert('Failed to delete group')
    }
  }

  const openEditModal = () => {
    setEditData({
      name: group.name || '',
      description: group.description || '',
      category: group.category || 'general',
      privacy: group.privacy || 'public'
    })
    setShowEditModal(true)
    setShowMenu(false)
  }

  const openImageModal = (type) => {
    setImageType(type)
    setShowImageModal(true)
    setShowMenu(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      if (imageType === 'profile') {
        formData.append('profile_picture', file)
      } else {
        formData.append('cover_photo', file)
      }

      const response = await groupsAPI.updateGroup(id, formData)
      setGroup(response.data)
      setShowImageModal(false)
      alert(`${imageType === 'profile' ? 'Profile picture' : 'Cover photo'} updated successfully`)
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image')
    }
    setUploadingImage(false)
  }

  const handleRemoveImage = async () => {
    if (!window.confirm(`Are you sure you want to remove the ${imageType === 'profile' ? 'profile picture' : 'cover photo'}?`)) {
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      if (imageType === 'profile') {
        formData.append('profile_picture', '')
      } else {
        formData.append('cover_photo', '')
      }

      const response = await groupsAPI.updateGroup(id, formData)
      setGroup(response.data)
      setShowImageModal(false)
      alert(`${imageType === 'profile' ? 'Profile picture' : 'Cover photo'} removed successfully`)
    } catch (error) {
      console.error('Failed to remove image:', error)
      alert('Failed to remove image')
    }
    setUploadingImage(false)
  }

  const handleSaveGroup = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await groupsAPI.updateGroup(id, editData)
      setGroup(response.data)
      setShowEditModal(false)
      alert('Group updated successfully')
    } catch (error) {
      console.error('Failed to update group:', error)
      alert('Failed to update group')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="card text-center text-gray-500">
        <p className="font-semibold">Group not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Group Header */}
      <div className="card mb-6 p-0">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-r from-primary-400 to-primary-600">
          {group.cover_photo ? (
            <img src={group.cover_photo} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-400 to-primary-600"></div>
          )}
          {group.is_admin && (
            <button
              onClick={() => openImageModal('cover')}
              className="absolute bottom-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Change cover photo"
            >
              <Camera size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
          )}
        </div>

        {/* Profile Section */}
        <div className="px-6 pb-6">
          <div className="flex items-start space-x-6 -mt-12">
            {/* Profile Picture */}
            <div className="relative">
              {group.profile_picture ? (
                <img 
                  src={group.profile_picture} 
                  alt={group.name}
                  className="w-32 h-32 rounded-lg border-4 border-white dark:border-gray-800 object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-primary-500 rounded-lg border-4 border-white dark:border-gray-800 flex items-center justify-center text-white text-5xl font-bold">
                  {group.name[0].toUpperCase()}
                </div>
              )}
              {group.is_admin && (
                <button
                  onClick={() => openImageModal('profile')}
                  className="absolute bottom-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Change profile picture"
                >
                  <Camera size={16} className="text-gray-700 dark:text-gray-200" />
                </button>
              )}
            </div>
            
            <div className="flex-1 pt-16">
              <div className="flex items-start justify-between mb-2 gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold dark:text-white">{group.name}</h1>
                  {group.privacy === 'private' ? (
                    <Lock size={24} className="text-gray-500" />
                  ) : (
                    <Globe size={24} className="text-gray-500" />
                  )}
                  {group.is_admin && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 text-sm font-medium rounded">
                      Your Own Group
                    </span>
                  )}
                </div>
                
                {/* Three-dot menu */}
                {group.is_member && (
                  <div className="relative menu-container flex-shrink-0">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <MoreVertical size={24} className="dark:text-gray-200" />
                    </button>
                    
                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <button
                          onClick={() => {
                            setShowMenu(false)
                            handleLeaveGroup()
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left dark:text-gray-200"
                        >
                          <LogOut size={18} />
                          <span>Leave Group</span>
                        </button>
                        
                        {group.is_admin && (
                          <>
                            <button
                              onClick={openEditModal}
                              className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left dark:text-gray-200"
                            >
                              <Edit2 size={18} />
                              <span>Edit Group</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setShowMenu(false)
                                handleDeleteGroup()
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-400 text-left"
                            >
                              <Trash2 size={18} />
                              <span>Delete Group</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                <Users size={16} className="inline mr-1" />
                {group.members_count} members
              </p>
              
              {group.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {group.description}
                </p>
              )}
              
              {!group.is_member && (
                <button
                  onClick={handleJoinGroup}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <UserPlus size={20} />
                  <span>Join Group</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post (only for members) */}
      {group.is_member && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Create Post</h2>
          <form onSubmit={handleCreatePost}>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="Title (optional)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 mb-3"
            />
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 resize-none"
              rows="3"
            />
            
            {imagePreview && (
              <div className="relative mt-3">
                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            
            {videoPreview && (
              <div className="relative mt-3">
                <video controls className="w-full max-h-64 rounded-lg bg-black">
                  <source src={videoPreview} type="video/mp4" />
                  <source src={videoPreview} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <Image size={20} />
                  <span className="hidden sm:inline">Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                
                <label className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <Video size={20} />
                  <span className="hidden sm:inline">Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              <button
                type="submit"
                disabled={creating || !newPost.content.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {creating ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Group Posts */}
      <div>
        <h2 className="text-xl font-bold mb-4 dark:text-white">Posts</h2>
        {posts.length === 0 ? (
          <div className="card text-center text-gray-500">
            <p className="font-semibold">No posts yet</p>
            <p className="text-sm mt-2">Be the first to post in this group!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={loadPosts}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {/* Edit Group Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Edit Group</h2>
            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={editData.category}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="general">General</option>
                  <option value="education">Education</option>
                  <option value="technology">Technology</option>
                  <option value="sports">Sports</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="business">Business</option>
                  <option value="health">Health & Fitness</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food & Cooking</option>
                  <option value="gaming">Gaming</option>
                  <option value="music">Music</option>
                  <option value="art">Art & Design</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Privacy
                </label>
                <select
                  value={editData.privacy}
                  onChange={(e) => setEditData({ ...editData, privacy: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="public">🌐 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">
              {imageType === 'profile' ? 'Update Profile Picture' : 'Update Cover Photo'}
            </h2>
            
            <div className="space-y-4">
              {/* Current Image Preview */}
              {((imageType === 'profile' && group.profile_picture) || (imageType === 'cover' && group.cover_photo)) && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Image:</p>
                  <img 
                    src={imageType === 'profile' ? group.profile_picture : group.cover_photo}
                    alt="Current"
                    className={`w-full ${imageType === 'profile' ? 'h-48' : 'h-32'} object-cover rounded-lg`}
                  />
                </div>
              )}

              {/* Upload New Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload New Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {((imageType === 'profile' && group.profile_picture) || (imageType === 'cover' && group.cover_photo)) && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {uploadingImage ? 'Removing...' : 'Remove'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  disabled={uploadingImage}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupDetail
