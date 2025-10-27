import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Check both storages for refresh token
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
        const response = await axios.post(`${API_BASE_URL.replace('/api', '')}/api/token/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        
        // Store new token in the same storage as the refresh token
        if (localStorage.getItem('refresh_token')) {
          localStorage.setItem('access_token', access)
        } else {
          sessionStorage.setItem('access_token', access)
        }

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        // Clear all tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('remember_me')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
        window.location.href = `${import.meta.env.BASE_URL}login`
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/token/', credentials),
  register: (userData) => api.post('/users/register/', userData),
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) => api.patch('/users/profile/', data),
  uploadProfilePicture: (formData) => api.patch('/users/profile/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadCoverPhoto: (formData) => api.patch('/users/profile/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  requestRichEditorAccess: () => api.post('/users/request-rich-editor/'),
  cancelRichEditorRequest: () => api.post('/users/cancel-rich-editor/'),
}

// Posts API
export const postsAPI = {
  getPosts: (page = 1) => api.get(`/posts/?page=${page}`),
  getPost: (id) => api.get(`/posts/${id}/`),
  createPost: (data) => {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {}
    return api.post('/posts/', data, config)
  },
  updatePost: (id, data) => api.patch(`/posts/${id}/`, data),
  deletePost: (id) => api.delete(`/posts/${id}/`),
  toggleLike: (id) => api.post(`/posts/${id}/like/`),
}

// Comments API
export const commentsAPI = {
  getComments: (postId) => api.get(`/comments/post/${postId}/`),
  createComment: (data) => api.post(`/comments/post/${data.post}/`, data),
  updateComment: (id, data) => api.patch(`/comments/${id}/`, data),
  deleteComment: (id) => api.delete(`/comments/${id}/`),
}

// Friends API
export const friendsAPI = {
  getFriends: () => api.get('/friends/'),
  getCategories: () => api.get('/friends/categories/'),
  sendRequest: (userId) => api.post(`/friends/request/${userId}/`),
  acceptRequest: (friendshipId) => api.post(`/friends/accept/${friendshipId}/`),
  rejectRequest: (friendshipId) => api.post(`/friends/reject/${friendshipId}/`),
  unfriend: (friendshipId) => api.post(`/friends/unfriend/${friendshipId}/`),
}

// Users API
export const usersAPI = {
  getUser: (userId) => api.get(`/users/${userId}/`),
}

// Pages API
export const pagesAPI = {
  getPages: () => api.get('/pages/'),
  getPage: (username) => api.get(`/pages/${username}/`),
  createPage: (data) => api.post('/pages/', data),
  updatePage: (username, data) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {}
    return api.patch(`/pages/${username}/`, data, config)
  },
  deletePage: (username) => api.delete(`/pages/${username}/`),
  getMyPages: () => api.get('/pages/my/'),
  toggleFollow: (pageId) => api.post(`/pages/${pageId}/follow/`),
  getFollowers: (pageId) => api.get(`/pages/${pageId}/followers/`),
  addAdmin: (pageId, data) => api.post(`/pages/${pageId}/add-admin/`, data),
}

// Groups API
export const groupsAPI = {
  getGroups: () => api.get('/groups/'),
  getGroup: (id) => api.get(`/groups/${id}/`),
  createGroup: (data) => {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {}
    return api.post('/groups/', data, config)
  },
  updateGroup: (id, data) => api.patch(`/groups/${id}/`, data),
  deleteGroup: (id) => api.delete(`/groups/${id}/`),
  joinGroup: (id) => api.post(`/groups/${id}/join/`),
  leaveGroup: (id) => api.post(`/groups/${id}/leave/`),
}

// User Block API
export const blockAPI = {
  blockUser: (userId) => api.post(`/users/${userId}/block/`),
  unblockUser: (userId) => api.post(`/users/${userId}/unblock/`),
  getBlockedUsers: () => api.get('/users/blocked/'),
}

export default api
