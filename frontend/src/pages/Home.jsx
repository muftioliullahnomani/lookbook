import { useState, useEffect } from 'react'
import { postsAPI, authAPI } from '../utils/api'
import PostCard from '../components/PostCard'
import RichTextEditor from '../components/RichTextEditor'
import { useAuth } from '../context/AuthContext'
import { Image, Video, Globe, Users, Lock, Sparkles, X } from 'lucide-react'

const Home = () => {
  const { user, updateUser } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState({ title: '', content: '', visibility: 'public', image: null, video: null })
  const [creating, setCreating] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [requestingAccess, setRequestingAccess] = useState(false)
  const [showRequestBanner, setShowRequestBanner] = useState(true)
  const [showPendingBanner, setShowPendingBanner] = useState(true)
  
  const canUseRichEditor = user?.is_staff || user?.is_superuser || user?.can_use_rich_editor
  const hasRequestedAccess = user?.rich_editor_requested
  const showRequestButton = !canUseRichEditor && !hasRequestedAccess

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const response = await postsAPI.getPosts()
      setPosts(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
    setLoading(false)
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

  const removeImage = () => {
    setNewPost({ ...newPost, image: null })
    setImagePreview(null)
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file is too large. Maximum size is 100MB.')
        return
      }
      setNewPost({ ...newPost, video: file })
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  const removeVideo = () => {
    setNewPost({ ...newPost, video: null })
    setVideoPreview(null)
  }

  const handleCreatePost = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!newPost.content.trim()) return

    setCreating(true)
    try {
      const formData = new FormData()
      formData.append('content', newPost.content)
      if (newPost.title) formData.append('title', newPost.title)
      formData.append('visibility', newPost.visibility)
      if (newPost.image) formData.append('image', newPost.image)
      if (newPost.video) formData.append('video', newPost.video)

      const response = await postsAPI.createPost(formData)
      setPosts([response.data, ...posts])
      setNewPost({ title: '', content: '', visibility: 'public', image: null, video: null })
      setImagePreview(null)
      setVideoPreview(null)
    } catch (error) {
      console.error('Failed to create post:', error)
    }
    setCreating(false)
  }

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(post => post.id !== postId))
  }

  const handleRequestRichEditor = async () => {
    setRequestingAccess(true)
    try {
      const response = await authAPI.requestRichEditorAccess()
      alert(response.data.message)
      // Refresh user data
      const profileResponse = await authAPI.getProfile()
      updateUser(profileResponse.data)
    } catch (error) {
      console.error('Failed to request access:', error)
      alert(error.response?.data?.message || 'Failed to request access')
    }
    setRequestingAccess(false)
  }

  const handleCancelRequest = async () => {
    if (!window.confirm('Cancel rich text editor access request?')) return
    
    setRequestingAccess(true)
    try {
      await authAPI.cancelRichEditorRequest()
      const profileResponse = await authAPI.getProfile()
      updateUser(profileResponse.data)
      alert('Request cancelled successfully')
    } catch (error) {
      console.error('Failed to cancel request:', error)
      alert('Failed to cancel request')
    }
    setRequestingAccess(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Rich Editor Access Notice */}
      {showRequestButton && showRequestBanner && (
        <div className="card mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 border-l-4 border-purple-500">
          <div className="flex items-start space-x-3">
            <Sparkles className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Unlock Rich Text Editor</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Get access to advanced formatting tools including bold, italic, lists, links, and more!
              </p>
              <button
                onClick={handleRequestRichEditor}
                disabled={requestingAccess}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {requestingAccess ? 'Requesting...' : 'Request Access'}
              </button>
            </div>
            <button
              onClick={() => setShowRequestBanner(false)}
              className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800 rounded-full text-purple-600 dark:text-purple-400 transition-colors flex-shrink-0"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {hasRequestedAccess && !canUseRichEditor && showPendingBanner && (
        <div className="card mb-6 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500">
          <div className="flex items-start space-x-3">
            <Sparkles className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Request Pending</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Your rich text editor access request is pending admin approval. You'll be notified once approved.
              </p>
              <button
                onClick={handleCancelRequest}
                disabled={requestingAccess}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {requestingAccess ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
            <button
              onClick={() => setShowPendingBanner(false)}
              className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded-full text-yellow-600 dark:text-yellow-400 transition-colors flex-shrink-0"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Create Post */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">Write your post here!</h2>
        <div>
          <input
            id="post-title"
            name="title"
            type="text"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            placeholder="Title (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
          />
          {canUseRichEditor ? (
            <div onClick={(e) => e.stopPropagation()}>
              <RichTextEditor
                id="home-post-editor"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="What's on your mind?"
              />
            </div>
          ) : (
            <textarea
              id="post-content"
              name="content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows="3"
            />
          )}
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
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4">
            <div className="flex items-center gap-3">
              <label htmlFor="post-image" className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <Image size={20} />
                <span className="hidden sm:inline">Photo</span>
                <input
                  id="post-image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              
              <label htmlFor="post-video" className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <Video size={20} />
                <span className="hidden sm:inline">Video</span>
                <input
                  id="post-video"
                  name="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </label>
              
              <select
                id="post-visibility"
                name="visibility"
                value={newPost.visibility}
                onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="public">
                  🌐 Public
                </option>
                <option value="friends">
                  👥 Friends
                </option>
                <option value="private">
                  🔒 Only Me
                </option>
              </select>
            </div>
            
            <button
              type="button"
              onClick={handleCreatePost}
              disabled={creating || !newPost.content.trim()}
              className="btn-primary disabled:opacity-50 w-full sm:w-auto"
            >
              {creating ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div>
        {posts.length === 0 ? (
          <div className="card text-center text-gray-500">
            <p>No posts yet. Be the first to share something!</p>
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
    </div>
  )
}

export default Home
