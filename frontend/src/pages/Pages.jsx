import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { pagesAPI } from '../utils/api'
import { Plus, Users, CheckCircle, Star } from 'lucide-react'

const Pages = () => {
  const [pages, setPages] = useState([])
  const [myPages, setMyPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPage, setNewPage] = useState({
    name: '',
    username: '',
    description: '',
    category: 'other',
  })

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      const [allPagesRes, myPagesRes] = await Promise.all([
        pagesAPI.getPages(),
        pagesAPI.getMyPages(),
      ])
      // Handle both array and paginated response
      const allPagesData = Array.isArray(allPagesRes.data) 
        ? allPagesRes.data 
        : (allPagesRes.data?.results || [])
      const myPagesData = Array.isArray(myPagesRes.data)
        ? myPagesRes.data
        : (myPagesRes.data?.results || [])
      
      setPages(allPagesData)
      setMyPages(myPagesData)
    } catch (error) {
      console.error('Failed to load pages:', error)
      setPages([])
      setMyPages([])
    }
    setLoading(false)
  }

  const handleToggleFollow = async (pageId) => {
    try {
      await pagesAPI.toggleFollow(pageId)
      // Reload pages to update follow status
      await loadPages()
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      alert('Failed to update follow status')
    }
  }

  const handleCreatePage = async (e) => {
    e.preventDefault()
    try {
      await pagesAPI.createPage(newPage)
      setNewPage({ name: '', username: '', description: '', category: 'other' })
      setShowCreateForm(false)
      loadPages()
    } catch (error) {
      console.error('Failed to create page:', error)
      alert('Failed to create page. Username might be taken.')
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
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Pages</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span>Create Page</span>
        </button>
      </div>

      {/* Create Page Form */}
      {showCreateForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Page</h2>
          <form onSubmit={handleCreatePage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Name *
              </label>
              <input
                type="text"
                value={newPage.name}
                onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username * (unique)
              </label>
              <input
                type="text"
                value={newPage.username}
                onChange={(e) => setNewPage({ ...newPage, username: e.target.value })}
                className="input-field"
                placeholder="mypage"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newPage.description}
                onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
                className="input-field"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={newPage.category}
                onChange={(e) => setNewPage({ ...newPage, category: e.target.value })}
                className="input-field"
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

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" className="btn-primary w-full sm:w-auto">
                Create Page
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Pages */}
      {myPages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">My Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPages.map((page) => (
              <Link
                key={page.id}
                to={`/page/${page.username}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
                    {page.profile_picture ? (
                      <img src={page.profile_picture} alt={page.name} className="w-full h-full object-cover" />
                    ) : (
                      page.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-lg truncate">{page.name}</h3>
                      {page.is_verified && (
                        <CheckCircle size={16} className="text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">@{page.username}</p>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 mt-2">
                      <Users size={14} />
                      <span>{page.followers_count} followers</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Pages */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Discover Pages</h2>
        {pages.length === 0 ? (
          <div className="card text-center text-gray-500">
            <p>No pages yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <div key={page.id} className="card hover:shadow-lg transition-shadow">
                <Link to={`/page/${page.username}`}>
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
                      {page.profile_picture ? (
                        <img src={page.profile_picture} alt={page.name} className="w-full h-full object-cover" />
                      ) : (
                        page.name[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-lg truncate">{page.name}</h3>
                          {page.is_verified && (
                            <CheckCircle size={16} className="text-blue-500" />
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleToggleFollow(page.id)
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            page.is_following
                              ? 'text-yellow-500 hover:text-red-600'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          title={page.is_following ? 'Click to unfollow' : 'Click to follow'}
                        >
                          <Star size={18} fill={page.is_following ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">@{page.username}</p>
                      <p className="text-xs text-gray-500 capitalize mt-1">{page.category}</p>
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mt-2">
                        <Users size={14} />
                        <span>{page.followers_count} followers</span>
                      </div>
                    </div>
                  </div>
                </Link>
                {page.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {page.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Pages
