import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { postsAPI } from '../utils/api'
import PostCard from '../components/PostCard'
import { ArrowLeft } from 'lucide-react'

const PostDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPost()
  }, [id])

  const loadPost = async () => {
    try {
      const response = await postsAPI.getPost(id)
      setPost(response.data)
    } catch (error) {
      console.error('Failed to load post:', error)
    }
    setLoading(false)
  }

  const handleUpdate = () => {
    loadPost()
  }

  const handleDelete = () => {
    navigate('/')
  }

  const handleBack = () => {
    // If post is from a page, go back to that page
    if (post?.page_username) {
      navigate(`/page/${post.page_username}`)
    } 
    // Otherwise try to go back in history
    else if (window.history.length > 1) {
      // Use window.history.back() to avoid navigation guard issues
      window.history.back()
    } 
    // Fallback: close tab or stay on page
    else {
      window.close()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <p className="text-gray-500">Post not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Go back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Post Card */}
      <PostCard
        post={post}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isDetailView={true}
      />
    </div>
  )
}

export default PostDetail
