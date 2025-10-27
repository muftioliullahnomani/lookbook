import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Trash2, Edit2, X, Globe, Users, Lock, Link2, Copy, UserPlus, UserCheck, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { postsAPI, commentsAPI, friendsAPI, pagesAPI, blockAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import RichTextEditor from './RichTextEditor'

const PostCard = ({ post, onUpdate, onDelete, isDetailView = false }) => {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({ title: '', content: '', image: null, video: null })
  const [imagePreview, setImagePreview] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [removeVideo, setRemoveVideo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false)
  const [friendRequestSent, setFriendRequestSent] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [friendshipStatus, setFriendshipStatus] = useState(null)
  const [friendshipId, setFriendshipId] = useState(null)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [followingPage, setFollowingPage] = useState(false)
  const [replyingToCommentId, setReplyingToCommentId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [showReplies, setShowReplies] = useState({})
  const [iHaveBlocked, setIHaveBlocked] = useState(false)

  const isAuthor = user?.id === post.author.id
  const isAdmin = user?.is_staff || user?.is_superuser
  const canEdit = isAuthor || isAdmin
  const canUseRichEditor = isAdmin || user?.can_use_rich_editor

  useEffect(() => {
    checkFriendshipStatus()
    checkIfIBlockedUser()
    if (post.page_id && post.is_following !== undefined) {
      setFollowingPage(post.is_following)
    }
  }, [post.author.id, user, post.page_id, post.is_following])
  
  const checkIfIBlockedUser = async () => {
    if (!user || isAuthor) return
    
    try {
      const response = await blockAPI.getBlockedUsers()
      const blockedUsers = response.data
      const isBlocked = blockedUsers.some(u => u.id === post.author.id)
      setIHaveBlocked(isBlocked)
    } catch (error) {
      console.error('Failed to check block status:', error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      showToastMessage('Please login to like posts')
      return
    }
    try {
      await postsAPI.toggleLike(post.id)
      onUpdate()
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(post.id)
        onDelete(post.id)
      } catch (error) {
        console.error('Failed to delete post:', error)
      }
    }
  }

  const loadComments = async () => {
    if (!showComments) {
      setLoading(true)
      try {
        const response = await commentsAPI.getComments(post.id)
        console.log('Comments loaded:', response.data)
        // Handle paginated response or direct array
        const commentsData = response.data.results || response.data
        const commentsArray = Array.isArray(commentsData) ? commentsData : []
        setComments(commentsArray)
        console.log('Comments set:', commentsArray.length, 'comments')
      } catch (error) {
        console.error('Failed to load comments:', error)
        console.error('Error details:', error.response?.data)
        setComments([])
      }
      setLoading(false)
    }
    setShowComments(!showComments)
  }

  const handleCommentSubmit = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!user) {
      showToastMessage('Please login to comment')
      return
    }
    if (!commentText.trim()) return

    try {
      const response = await commentsAPI.createComment({
        post: post.id,
        content: commentText,
      })
      setComments([response.data, ...comments])
      setCommentText('')
      onUpdate()
    } catch (error) {
      console.error('Failed to create comment:', error)
    }
  }

  const handleReplySubmit = async (parentCommentId) => {
    if (!user) {
      showToastMessage('Please login to reply')
      return
    }
    if (!replyText.trim()) return

    try {
      const response = await commentsAPI.createComment({
        post: post.id,
        parent: parentCommentId,
        content: replyText,
      })
      // Update the parent comment's replies
      setComments(comments.map(c => {
        if (c.id === parentCommentId) {
          return {
            ...c,
            replies: [...(c.replies || []), response.data],
            replies_count: (c.replies_count || 0) + 1
          }
        }
        return c
      }))
      setReplyText('')
      setReplyingToCommentId(null)
      // Auto-expand replies to show the new reply
      setShowReplies(prev => ({
        ...prev,
        [parentCommentId]: true
      }))
      showToastMessage('Reply added')
      onUpdate()
    } catch (error) {
      console.error('Failed to create reply:', error)
      showToastMessage('Failed to add reply')
    }
  }

  const handleStartReply = (commentId) => {
    // Cancel any editing mode
    setEditingCommentId(null)
    setEditingCommentText('')
    // Toggle reply mode
    setReplyingToCommentId(replyingToCommentId === commentId ? null : commentId)
    setReplyText('')
  }

  const handleToggleReplies = (commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id)
    setEditingCommentText(comment.content)
  }

  const handleUpdateComment = async (commentId, parentCommentId = null) => {
    if (!editingCommentText.trim()) return

    try {
      const response = await commentsAPI.updateComment(commentId, {
        content: editingCommentText
      })
      if (parentCommentId) {
        // Updating a reply
        setComments(comments.map(c => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: c.replies.map(r => r.id === commentId ? response.data : r)
            }
          }
          return c
        }))
      } else {
        // Updating a top-level comment
        setComments(comments.map(c => c.id === commentId ? {...response.data, replies: c.replies, replies_count: c.replies_count} : c))
      }
      setEditingCommentId(null)
      setEditingCommentText('')
      showToastMessage('Comment updated')
    } catch (error) {
      console.error('Failed to update comment:', error)
      showToastMessage('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId, parentCommentId = null) => {
    if (!window.confirm('Delete this comment?')) return

    try {
      await commentsAPI.deleteComment(commentId)
      if (parentCommentId) {
        // Deleting a reply
        setComments(comments.map(c => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: c.replies.filter(r => r.id !== commentId),
              replies_count: Math.max(0, (c.replies_count || 0) - 1)
            }
          }
          return c
        }))
      } else {
        // Deleting a top-level comment
        setComments(comments.filter(c => c.id !== commentId))
      }
      showToastMessage('Comment deleted')
      onUpdate()
    } catch (error) {
      console.error('Failed to delete comment:', error)
      showToastMessage('Failed to delete comment')
    }
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  const openEditModal = () => {
    setEditData({
      title: post.title || '',
      content: post.content || '',
      visibility: post.visibility || 'public',
      image: null,
      video: null
    })
    setImagePreview(post.image || null)
    setVideoPreview(post.video || null)
    setRemoveImage(false)
    setRemoveVideo(false)
    setShowEditModal(true)
  }

  const getVisibilityIcon = (visibility) => {
    switch(visibility) {
      case 'friends':
        return <Users size={14} className="text-gray-500" />
      case 'private':
        return <Lock size={14} className="text-gray-500" />
      default:
        return <Globe size={14} className="text-gray-500" />
    }
  }

  const getVisibilityText = (visibility) => {
    switch(visibility) {
      case 'friends':
        return 'Friends'
      case 'private':
        return 'Only Me'
      default:
        return 'Public'
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEditData({ ...editData, image: file })
      setImagePreview(URL.createObjectURL(file))
      setRemoveImage(false)
    }
  }

  const handleRemoveImage = () => {
    setEditData({ ...editData, image: null })
    setImagePreview(null)
    setRemoveImage(true)
  }

  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file is too large. Maximum size is 100MB.')
        return
      }
      setEditData({ ...editData, video: file })
      setVideoPreview(URL.createObjectURL(file))
      setRemoveVideo(false)
    }
  }

  const handleRemoveVideo = () => {
    setEditData({ ...editData, video: null })
    setVideoPreview(null)
    setRemoveVideo(true)
  }

  const handleEditPost = async (e) => {
    e.preventDefault()
    if (!editData.content.trim()) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', editData.title)
      formData.append('content', editData.content)
      formData.append('visibility', editData.visibility)
      
      if (editData.image) {
        formData.append('image', editData.image)
      } else if (removeImage) {
        formData.append('remove_image', 'true')
      }

      if (editData.video) {
        formData.append('video', editData.video)
      } else if (removeVideo) {
        formData.append('remove_video', 'true')
      }

      await postsAPI.updatePost(post.id, formData)
      setShowEditModal(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to update post:', error)
      alert('Failed to update post')
    }
    setSaving(false)
  }

  const showToastMessage = (message) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(postUrl)
      showToastMessage('Post link copied!')
    } catch (error) {
      console.error('Failed to copy link:', error)
      showToastMessage('Failed to copy link')
    }
  }

  const handleCopyText = async () => {
    const textToCopy = post.title 
      ? `${post.title}\n\n${post.content}` 
      : post.content
    try {
      await navigator.clipboard.writeText(textToCopy)
      showToastMessage('Post text copied!')
    } catch (error) {
      showToastMessage('Failed to copy text')
    }
  }

  const checkFriendshipStatus = async () => {
    if (!user || isAuthor || post.page_name) return
    
    try {
      const response = await friendsAPI.getCategories()
      const { friends, pending } = response.data
      
      // Check if already friends
      const isFriend = friends.find(f => f.id === post.author.id)
      if (isFriend) {
        setFriendshipStatus('friends')
        setFriendshipId(isFriend.friendship_id)
        return
      }
      
      // Check if pending
      const pendingUser = pending.find(p => p.id === post.author.id)
      if (pendingUser) {
        setFriendshipStatus(pendingUser.request_type === 'sent' ? 'pending_sent' : 'pending_received')
        setFriendshipId(pendingUser.friendship_id)
        return
      }
      
      setFriendshipStatus(null)
      setFriendshipId(null)
    } catch (error) {
      console.error('Failed to check friendship:', error)
    }
  }

  const handleSendFriendRequest = async () => {
    setSendingFriendRequest(true)
    try {
      await friendsAPI.sendRequest(post.author.id)
      setFriendRequestSent(true)
      setFriendshipStatus('pending_sent')
      showToastMessage('Friend request sent!')
      await checkFriendshipStatus()
    } catch (error) {
      console.error('Failed to send friend request:', error)
      showToastMessage('Failed to send friend request')
    }
    setSendingFriendRequest(false)
  }

  const handleCancelRequest = async (friendshipId) => {
    if (!window.confirm('Cancel friend request?')) return
    
    setSendingFriendRequest(true)
    try {
      await friendsAPI.rejectRequest(friendshipId)
      setFriendshipStatus(null)
      showToastMessage('Friend request cancelled')
      await checkFriendshipStatus()
    } catch (error) {
      console.error('Failed to cancel request:', error)
      showToastMessage('Failed to cancel request')
    }
    setSendingFriendRequest(false)
  }

  const handleUnfriend = async (friendshipId) => {
    if (!window.confirm('Remove this friend?')) return
    
    setSendingFriendRequest(true)
    try {
      await friendsAPI.rejectRequest(friendshipId)
      setFriendshipStatus(null)
      showToastMessage('Friend removed')
      await checkFriendshipStatus()
    } catch (error) {
      console.error('Failed to remove friend:', error)
      showToastMessage('Failed to remove friend')
    }
    setSendingFriendRequest(false)
  }

  const handleToggleFollowPage = async () => {
    if (!post.page_id) return
    
    try {
      await pagesAPI.toggleFollow(post.page_id)
      setFollowingPage(!followingPage)
      showToastMessage(followingPage ? 'Unfollowed page' : 'Following page')
      onUpdate()
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      showToastMessage('Failed to update follow status')
    }
  }

  return (
    <div className="card mb-4">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
            {post.page_name ? post.page_name[0].toUpperCase() : post.author.username[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {post.page_name ? (
                <>
                  {post.page_username ? (
                    <Link 
                      to={`/page/${post.page_username}`}
                      className="font-semibold truncate hover:text-primary-600 transition-colors"
                    >
                      {post.page_name}
                    </Link>
                  ) : (
                    <span className="font-semibold truncate">
                      {post.page_name}
                    </span>
                  )}
                  {user && post.page_id && (
                    <button
                      onClick={handleToggleFollowPage}
                      className={`p-1 rounded-full transition-colors ${
                        followingPage
                          ? 'text-yellow-500 hover:text-red-600'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                      title={followingPage ? 'Click to unfollow page' : 'Click to follow page'}
                    >
                      <Star size={16} fill={followingPage ? 'currentColor' : 'none'} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Link 
                    to={`/user/${post.author.id}`}
                    className="font-semibold truncate hover:text-primary-600 transition-colors"
                  >
                    {post.author.username}
                  </Link>
                  {/* Disabled User Badge */}
                  {post.author.is_active === false && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded">
                      Disabled User
                    </span>
                  )}
                </>
              )}
              {/* Friendship Status Icon */}
              {!isAuthor && !post.page_name && user && post.author.id !== user.id && (
                <>
                  {friendshipStatus === 'friends' ? (
                    <button
                      onClick={() => handleUnfriend(friendshipId)}
                      disabled={sendingFriendRequest}
                      className="p-1 hover:bg-red-50 rounded-full text-green-600 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Click to unfriend"
                    >
                      <UserCheck size={16} />
                    </button>
                  ) : friendshipStatus === 'pending_sent' ? (
                    <button
                      onClick={() => handleCancelRequest(friendshipId)}
                      disabled={sendingFriendRequest}
                      className="p-1 hover:bg-red-50 rounded-full text-yellow-600 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Click to cancel request"
                    >
                      <UserCheck size={14} />
                    </button>
                  ) : friendshipStatus === 'pending_received' ? (
                    <div
                      className="p-1 rounded-full text-blue-600"
                      title="Wants to be friends (Go to Friends page to accept)"
                    >
                      <UserPlus size={14} />
                    </div>
                  ) : (
                    <button
                      onClick={post.author.is_active !== false && !post.author.has_blocked_me && !iHaveBlocked ? handleSendFriendRequest : null}
                      disabled={sendingFriendRequest || post.author.is_active === false || post.author.has_blocked_me || iHaveBlocked}
                      className={`p-1 rounded-full transition-colors ${
                        post.author.is_active === false || post.author.has_blocked_me || iHaveBlocked
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'hover:bg-primary-50 text-primary-600 disabled:opacity-50'
                      }`}
                      title={post.author.is_active === false ? 'Cannot send friend request to disabled user' : (post.author.has_blocked_me ? 'This user has blocked you' : (iHaveBlocked ? 'You have blocked this user' : 'Click to send friend request'))}
                    >
                      <UserPlus size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
            {post.page_name && post.is_page_owner && (
              <p className="text-xs text-gray-500">
                by{' '}
                <Link 
                  to={`/user/${post.author.id}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  @{post.author.username}
                </Link>
              </p>
            )}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={handleCopyLink}
            className="p-2 hover:bg-purple-50 rounded-full text-purple-600 transition-colors"
            title="Copy post link"
          >
            <Link2 size={18} />
          </button>
          <button
            onClick={handleCopyText}
            className="p-2 hover:bg-green-50 rounded-full text-green-600 transition-colors"
            title="Copy post text"
          >
            <Copy size={18} />
          </button>
          {canEdit && (
            <>
              <button
                onClick={openEditModal}
                className="p-2 hover:bg-blue-50 rounded-full text-blue-600 transition-colors"
                title={isAdmin && !isAuthor ? "Edit post (Admin)" : "Edit post"}
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 rounded-full text-red-600 transition-colors"
                title={isAdmin && !isAuthor ? "Delete post (Admin)" : "Delete post"}
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          {isAdmin && !isAuthor && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Post Title */}
      {post.title && (
        isDetailView || (post.page_name && post.is_page_owner) ? (
          <h2 className="text-lg sm:text-xl font-bold mb-3 text-gray-900 dark:text-white">
            {post.title}
          </h2>
        ) : (
          <Link 
            to={`/post/${post.id}`}
            className="text-lg sm:text-xl font-bold mb-3 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
          >
            {post.title}
          </Link>
        )
      )}

      {/* Post Content */}
      <p className="mb-4 whitespace-pre-wrap text-gray-700 dark:text-gray-200">{post.content}</p>

      {post.image && (
        <div className="relative w-full rounded-lg mb-4 overflow-hidden" style={{ maxHeight: '384px' }}>
          <img
            src={post.image}
            alt="Post"
            className={`w-full rounded-lg max-h-96 object-cover transition-all duration-300 ${
              imageLoaded ? 'blur-0' : 'blur-md scale-105'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </div>
      )}

      {post.video && (
        <div className="w-full rounded-lg mb-4 overflow-hidden bg-black">
          <video
            controls
            className="w-full max-h-96 rounded-lg"
            preload="metadata"
          >
            <source src={post.video} type="video/mp4" />
            <source src={post.video} type="video/webm" />
            <source src={post.video} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center space-x-4 sm:space-x-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 sm:space-x-2 ${
            post.is_liked ? 'text-red-600' : 'text-gray-600'
          } hover:text-red-600 transition-colors`}
        >
          <Heart size={20} fill={post.is_liked ? 'currentColor' : 'none'} />
          <span className="text-sm sm:text-base">{post.likes_count}</span>
        </button>

        <button
          onClick={loadComments}
          className={`flex items-center space-x-1 sm:space-x-2 ${
            showComments ? 'text-primary-600' : 'text-gray-600'
          } hover:text-primary-600 transition-colors`}
          title={showComments ? 'Hide comments' : 'Show comments'}
        >
          <MessageCircle size={20} fill={showComments ? 'currentColor' : 'none'} />
          <span className="text-sm sm:text-base">
            {post.comments_count || 0} {showComments ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {user && (
            <div className="mb-4">
              {canUseRichEditor ? (
                <>
                  <div onClick={(e) => e.stopPropagation()} onSubmit={(e) => e.preventDefault()}>
                    <RichTextEditor
                      id={`comment-editor-${post.id}`}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCommentSubmit}
                    className="mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Post Comment
                  </button>
                </>
              ) : (
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                  <input
                    id={`comment-input-${post.id}`}
                    name="comment"
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="input-field flex-1"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Post
                  </button>
                </form>
              )}
            </div>
          )}

          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isCommentAuthor = user?.id === comment.author.id
                const canEditComment = isCommentAuthor || isAdmin
                const isEditing = editingCommentId === comment.id
                const isReplying = replyingToCommentId === comment.id
                const hasReplies = comment.replies && comment.replies.length > 0

                return (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {comment.author.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm dark:text-gray-200">{comment.author.username}</p>
                            {/* Disabled User Badge for Comments */}
                            {comment.author.is_active === false && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded">
                                Disabled
                              </span>
                            )}
                          </div>
                          {canEditComment && !isEditing && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400"
                                title="Edit comment"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-600 dark:text-red-400"
                                title="Delete comment"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {isEditing ? (
                          <div className="mt-2">
                            {canUseRichEditor ? (
                              <RichTextEditor
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                placeholder="Edit comment..."
                              />
                            ) : (
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                rows="2"
                              />
                            )}
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => handleUpdateComment(comment.id)}
                                className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {comment.is_deleted ? (
                              <p className="text-sm mt-1 italic text-gray-500 dark:text-gray-400">Comment was deleted</p>
                            ) : comment.is_hidden ? (
                              <p className="text-sm mt-1 italic text-gray-500 dark:text-gray-400">Comment was hidden</p>
                            ) : (
                              <p className="text-sm mt-1 dark:text-gray-300">{comment.content}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </p>
                              {user && (
                                <button
                                  onClick={() => handleStartReply(comment.id)}
                                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                                >
                                  {isReplying ? 'Cancel' : 'Reply'}
                                </button>
                              )}
                              {hasReplies && (
                                <button
                                  onClick={() => handleToggleReplies(comment.id)}
                                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                                >
                                  {showReplies[comment.id] ? '▲' : '▼'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                                </button>
                              )}
                            </div>
                          </>
                        )}

                        {/* Reply Input */}
                        {isReplying && (
                          <div className="mt-3">
                            {canUseRichEditor ? (
                              <>
                                <RichTextEditor
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`Reply to ${comment.author.username}...`}
                                />
                                <div className="flex space-x-2 mt-2">
                                  <button
                                    onClick={() => handleReplySubmit(comment.id)}
                                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm"
                                  >
                                    Reply
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyingToCommentId(null)
                                      setReplyText('')
                                    }}
                                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`Reply to ${comment.author.username}...`}
                                  className="input-field flex-1 text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleReplySubmit(comment.id)
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleReplySubmit(comment.id)}
                                  className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm"
                                >
                                  Reply
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Replies List */}
                        {hasReplies && showReplies[comment.id] && (
                          <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                            {comment.replies.map((reply) => {
                              const isReplyAuthor = user?.id === reply.author.id
                              const canEditReply = isReplyAuthor || isAdmin
                              const isEditingReply = editingCommentId === reply.id

                              return (
                                <div key={reply.id} className="bg-white dark:bg-gray-700 rounded-lg p-2">
                                  <div className="flex items-start space-x-2">
                                    <div className="w-6 h-6 bg-primary-400 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                      {reply.author.username[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold text-xs dark:text-gray-200">{reply.author.username}</p>
                                          {/* Disabled User Badge for Replies */}
                                          {reply.author.is_active === false && (
                                            <span className="px-1 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded">
                                              Disabled
                                            </span>
                                          )}
                                        </div>
                                        {canEditReply && !isEditingReply && (
                                          <div className="flex space-x-1">
                                            <button
                                              onClick={() => handleEditComment(reply)}
                                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-blue-600 dark:text-blue-400"
                                              title="Edit reply"
                                            >
                                              <Edit2 size={12} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteComment(reply.id, comment.id)}
                                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-red-600 dark:text-red-400"
                                              title="Delete reply"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {isEditingReply ? (
                                        <div className="mt-1">
                                          {canUseRichEditor ? (
                                            <RichTextEditor
                                              value={editingCommentText}
                                              onChange={(e) => setEditingCommentText(e.target.value)}
                                              placeholder="Edit reply..."
                                            />
                                          ) : (
                                            <textarea
                                              value={editingCommentText}
                                              onChange={(e) => setEditingCommentText(e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white dark:bg-gray-600 dark:text-gray-200"
                                              rows="2"
                                            />
                                          )}
                                          <div className="flex space-x-2 mt-1">
                                            <button
                                              onClick={() => handleUpdateComment(reply.id, comment.id)}
                                              className="px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={handleCancelEdit}
                                              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-xs"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          {reply.is_deleted ? (
                                            <p className="text-xs mt-1 italic text-gray-500 dark:text-gray-400">Comment was deleted</p>
                                          ) : reply.is_hidden ? (
                                            <p className="text-xs mt-1 italic text-gray-500 dark:text-gray-400">Comment was hidden</p>
                                          ) : (
                                            <p className="text-xs mt-1 dark:text-gray-300">{reply.content}</p>
                                          )}
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold dark:text-white">Edit Post</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors dark:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditPost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Post title"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content * {isAdmin && !isAuthor && <span className="text-yellow-600 dark:text-yellow-400 text-xs">(Editing as Admin)</span>}
                </label>
                {canUseRichEditor ? (
                  <RichTextEditor
                    value={editData.content}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    placeholder="What's on your mind?"
                  />
                ) : (
                  <textarea
                    value={editData.content}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                    rows="6"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image (optional)
                </label>
                
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <label className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video (optional)
                </label>
                
                {videoPreview ? (
                  <div className="relative">
                    <video
                      controls
                      className="w-full h-64 object-cover rounded-lg bg-black"
                      preload="metadata"
                    >
                      <source src={videoPreview} type="video/mp4" />
                      <source src={videoPreview} type="video/webm" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <label className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Change
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload video</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">MP4, WebM, OGG up to 100MB</p>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <select
                  value={editData.visibility}
                  onChange={(e) => setEditData({ ...editData, visibility: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="public">🌐 Public</option>
                  <option value="friends">👥 Friends Only</option>
                  <option value="private">🔒 Only Me</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving || !editData.content.trim()}
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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </div>
  )
}

export default PostCard
