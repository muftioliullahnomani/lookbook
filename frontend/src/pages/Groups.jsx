import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { groupsAPI } from '../utils/api'
import { Users, Plus, Lock, Globe } from 'lucide-react'

const Groups = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: 'general',
    privacy: 'public'
  })

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const response = await groupsAPI.getGroups()
      // Handle both array and paginated response
      const groupsData = Array.isArray(response.data) ? response.data : (response.data.results || [])
      setGroups(groupsData)
    } catch (error) {
      console.error('Failed to load groups:', error)
      setGroups([]) // Set empty array on error
    }
    setLoading(false)
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    try {
      await groupsAPI.createGroup(newGroup)
      setShowCreateModal(false)
      setNewGroup({ name: '', description: '', category: 'general', privacy: 'public' })
      loadGroups()
    } catch (error) {
      console.error('Failed to create group:', error)
      alert('Failed to create group')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Groups</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Group</span>
        </button>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Create Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newGroup.category}
                  onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
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
                  value={newGroup.privacy}
                  onChange={(e) => setNewGroup({ ...newGroup, privacy: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="public">🌐 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <div 
            key={group.id} 
            onClick={() => navigate(`/groups/${group.id}`)}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-start space-x-4">
              {group.profile_picture ? (
                <img 
                  src={group.profile_picture} 
                  alt={group.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-primary-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                  {group.name[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-lg dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{group.name}</h3>
                  {group.privacy === 'private' ? (
                    <Lock size={16} className="text-gray-500" />
                  ) : (
                    <Globe size={16} className="text-gray-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {group.members_count} members
                </p>
                {group.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                    {group.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="card text-center text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="font-semibold">No groups yet</p>
          <p className="text-sm mt-2">Create the first group!</p>
        </div>
      )}
    </div>
  )
}

export default Groups