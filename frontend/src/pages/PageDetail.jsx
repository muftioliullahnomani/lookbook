import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pagesAPI, postsAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import PostCard from '../components/PostCard'
import { Users, MapPin, Globe, Mail, Phone, CheckCircle, Image, Edit2, Camera, X, Trash2, MoreVertical } from 'lucide-react'



const PageDetail = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState({ title: '', content: '', visibility: 'public' })
  const [creating, setCreating] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    category: '',
    website: '',
    email: '',
    phone: '',
    location: ''
  })
  const [saving, setSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    loadPage()
  }, [username])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const loadPage = async () => {
    if (!username) {
      console.error('No username provided')
      setLoading(false)
      return
    }

    try {
      const [pageResponse, postsResponse] = await Promise.all([
        pagesAPI.getPage(username),
        postsAPI.getPosts()
      ])
      setPage(pageResponse.data)
      
      // Filter posts for this page
      const allPosts = postsResponse.data.results || postsResponse.data
      const pagePosts = allPosts.filter(post => post.page === pageResponse.data.id)
      setPosts(pagePosts)
    } catch (error) {
      console.error('Failed to load page:', error)
      setPage(null)
    }
    setLoading(false)
  }

  const handleFollow = async () => {
    if (!user) {
      alert('Please login to follow this page')
      return
    }
    try {
      await pagesAPI.toggleFollow(page.id)
      loadPage()
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPost.content.trim()) return

    setCreating(true)
    try {
      const response = await postsAPI.createPost({
        ...newPost,
        page: page.id
      })
      setPosts([response.data, ...posts])
      setNewPost({ title: '', content: '', visibility: 'public' })
    } catch (error) {
      console.error('Failed to create post:', error)
    }
    setCreating(false)
  }

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(post => post.id !== postId))
  }

  const openEditModal = () => {
    setEditData({
      name: page?.name || '',
      description: page?.description || '',
      category: page?.category || 'business',
      location: page?.location || '',
      website: page?.website || '',
      email: page?.email || '',
      phone: page?.phone || ''
    })
    setShowEditModal(true)
    setShowMenu(false)
  }

  const handleSavePage = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await pagesAPI.updatePage(page.username, editData)
      setPage(response.data)
      setShowEditModal(false)
    } catch (error) {
      console.error('Failed to update page:', error)
      alert('Failed to update page')
    }
    setSaving(false)
  }

  const handlePageLogoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('profile_picture', file)

    try {
      const response = await pagesAPI.updatePage(page.username, formData)
      setPage(response.data)
    } catch (error) {
      console.error('Failed to upload page logo:', error)
      alert('Failed to upload page logo')
    }
  }

  const handlePageBannerChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('cover_photo', file)

    try {
      const response = await pagesAPI.updatePage(page.username, formData)
      setPage(response.data)
    } catch (error) {
      console.error('Failed to upload page banner:', error)
      alert('Failed to upload page banner')
    }
  }

  const handleRemovePageLogo = async () => {
    if (!window.confirm('Remove page logo?')) return

    const formData = new FormData()
    formData.append('remove_profile_picture', 'true')

    try {
      const response = await pagesAPI.updatePage(page.username, formData)
      setPage(response.data)
    } catch (error) {
      console.error('Failed to remove page logo:', error)
      alert('Failed to remove page logo')
    }
  }

  const handleRemovePageBanner = async () => {
    if (!window.confirm('Remove page banner?')) return

    const formData = new FormData()
    formData.append('remove_cover_photo', 'true')

    try {
      const response = await pagesAPI.updatePage(page.username, formData)
      setPage(response.data)
    } catch (error) {
      console.error('Failed to remove page banner:', error)
      alert('Failed to remove page banner')
    }
  }

  const handleDeletePage = async () => {
    if (!window.confirm(`Are you sure you want to delete "${page.name}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      await pagesAPI.deletePage(page.username)
      alert('Page deleted successfully')
      navigate('/pages')
    } catch (error) {
      console.error('Failed to delete page:', error)
      alert('Failed to delete page')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  

  if (!page) {
    return (
      <div className="card text-center">
        <p className="text-gray-500">Page not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="card mb-6">
        {/* Cover Photo / Banner */}
        <div className="relative -mx-6 -mt-6 mb-6 h-32 sm:h-48 bg-gradient-to-r from-primary-400 to-primary-600 rounded-t-xl">
          {page.cover_photo && (
            <img src={page.cover_photo} alt="Cover" className="w-full h-full object-cover rounded-t-xl" />
          )}
          {page.is_owner && (
            <div className="absolute top-4 right-4 flex gap-2">
              <label className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                <Camera size={20} className="dark:text-gray-200" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePageBannerChange}
                  className="hidden"
                />
              </label>
              {page.cover_photo && (
                <button
                  onClick={handleRemovePageBanner}
                  className="p-2 bg-red-500 dark:bg-red-600 rounded-full shadow-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-white"
                  title="Remove page banner"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative">
          {/* Page Logo */}
          <div className="relative -mt-16 sm:-mt-20">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white text-4xl sm:text-5xl font-bold border-4 border-white shadow-lg overflow-hidden">
              {page.profile_picture ? (
                <img src={page.profile_picture} alt={page.name} className="w-full h-full object-cover" />
              ) : (
                page.name[0].toUpperCase()
              )}
            </div>
            {page.is_owner && (
              <div className="absolute bottom-0 right-0 flex gap-1">
                <label className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  <Camera size={16} className="dark:text-gray-200" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePageLogoChange}
                    className="hidden"
                  />
                </label>
                {page.profile_picture && (
                  <button
                    onClick={handleRemovePageLogo}
                    className="p-2 bg-red-500 dark:bg-red-600 rounded-full shadow-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-white"
                    title="Remove page logo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">{page.name}</h1>
                  {page.is_verified && (
                    <CheckCircle size={20} className="text-blue-500 sm:size-6" />
                  )}
                </div>
                <p className="text-gray-600">@{page.username}</p>
                <p className="text-sm text-gray-500 capitalize mt-1">{page.category}</p>
              </div>
              {page.is_owner && (
                <div className="relative menu-container">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <MoreVertical size={24} className="dark:text-gray-200" />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                      <button
                        onClick={openEditModal}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left dark:text-gray-200"
                      >
                        <Edit2 size={18} />
                        <span>Edit Page</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          handleDeletePage()
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-400 text-left"
                      >
                        <Trash2 size={18} />
                        <span>Delete Page</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {page.description && (
              <p className="text-gray-700 mb-4">{page.description}</p>
            )}
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-sm text-gray-600 mb-4">
              {page.location && (
                <div className="flex items-center space-x-1">
                  <MapPin size={16} />
                  <span>{page.location}</span>
                </div>
              )}
              
              {page.website && (
                <div className="flex items-center space-x-1">
                  <Globe size={16} />
                  <a
                    href={page.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline truncate max-w-[150px]"
                  >
                    {page.website}
                  </a>
                </div>
              )}
              
              {page.email && (
                <div className="flex items-center space-x-1">
                  <Mail size={16} />
                  <a href={`mailto:${page.email}`} className="text-primary-600 hover:underline truncate max-w-[150px]">
                    {page.email}
                  </a>
                </div>
              )}
              
              {page.phone && (
                <div className="flex items-center space-x-1">
                  <Phone size={16} />
                  <span>{page.phone}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="flex items-center space-x-1 text-gray-600">
                <Users size={20} />
                <span className="font-semibold">{page.followers_count}</span>
                <span>followers</span>
              </div>

              {!page.is_owner && (
                <button
                  onClick={handleFollow}
                  className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium transition-colors ${
                    page.is_following
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {page.is_following ? 'Following' : 'Follow'}
                </button>
              )}

              {page.is_owner && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium text-sm">
                  You own this page
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post (Only for page owner) */}
      {page.is_owner && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Create Post as {page.name}</h2>
          <form onSubmit={handleCreatePost}>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              placeholder="Title (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
            />
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="What would you like to share?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows="3"
            />
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  <Image size={20} />
                  <span className="hidden sm:inline">Photo</span>
                </button>
                
                <select
                  value={newPost.visibility}
                  onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="public">🌐 Public</option>
                  <option value="friends">👥 Friends</option>
                  <option value="private">🔒 Only Me</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={creating || !newPost.content.trim()}
                className="btn-primary disabled:opacity-50 w-full sm:w-auto"
              >
                {creating ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Page Posts */}
      <div className="mb-6">
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
              onUpdate={loadPage}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {/* About Section */}
      <div className="card">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">About</h2>
        {page.description ? (
          <p className="text-gray-700">{page.description}</p>
        ) : (
          <p className="text-gray-500">No description available.</p>
        )}
      </div>

      {/* Edit Page Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold dark:text-white">Edit Page</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors dark:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Name *
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
                  rows="4"
                  placeholder="Tell people about your page..."
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
                  <option value="business">Business</option>
                  <option value="brand">Brand</option>
                  <option value="community">Community</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="education">Education</option>
                  <option value="nonprofit">Non-Profit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={editData.website}
                  onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                  placeholder="City, Country"
                />
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
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-200"
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



export default PageDetail
