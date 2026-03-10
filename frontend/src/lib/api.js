import axios from 'axios'
import { supabase } from './supabase.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (err) {
    console.error('[API] Failed to get session:', err)
  }
  return config
})

// Log errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API] Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

// Auth
export const verifyOtp = (phone, token) =>
  api.post('/auth/verify', { phone, token })

export const updateProfile = (name, avatar_style) =>
  api.post('/auth/profile', { name, avatar_style })

export const getMe = () =>
  api.get('/auth/me')

// Hangouts
export const getHangouts = () =>
  api.get('/hangouts')

export const createHangout = (data) =>
  api.post('/hangouts', data)

export const inviteToHangout = (id, userIds) =>
  api.post(`/hangouts/${id}/invites`, { userIds })

export const getHangout = (id) =>
  api.get(`/hangouts/${id}`)

export const rsvpHangout = (hangoutId, rsvpData) =>
  api.post(`/hangouts/${hangoutId}/rsvp`, typeof rsvpData === 'string' ? { response: rsvpData } : rsvpData)

export const addVibeOption = (hangoutId, data) =>
  api.post(`/hangouts/${hangoutId}/vibe-options`, data)

export const voteVibeOption = (hangoutId, optionId) =>
  api.post(`/hangouts/${hangoutId}/vibe-votes`, { option_id: optionId })

export const deleteHangout = (id) =>
  api.delete(`/hangouts/${id}`)

export const toggleVisibility = (id, is_public) =>
  api.patch(`/hangouts/${id}/visibility`, { is_public })

export const updateHangoutStatus = (id, status) =>
  api.patch(`/hangouts/${id}/status`, { status })

export const addHost = (hangoutId, userId) =>
  api.post(`/hangouts/${hangoutId}/hosts`, { userId })

export const removeHost = (hangoutId, userId) =>
  api.delete(`/hangouts/${hangoutId}/hosts/${userId}`)

export const addIdea = (hangoutId, data) =>
  api.post(`/hangouts/${hangoutId}/ideas`, data)

export const voteOnIdea = (hangoutId, ideaId, vote) =>
  api.post(`/hangouts/${hangoutId}/ideas/${ideaId}/vote`, { vote })

export const updateHangoutDetails = (id, data) =>
  api.patch(`/hangouts/${id}`, data)

export const getTimeProposals = (hangoutId) =>
  api.get(`/hangouts/${hangoutId}/time-proposals`)

export const addTimeProposal = (hangoutId, data) =>
  api.post(`/hangouts/${hangoutId}/time-proposals`, data)

export const voteOnTime = (hangoutId, proposalId, interest) =>
  api.post(`/hangouts/${hangoutId}/time-proposals/${proposalId}/vote`, { interest })

export const deleteTimeProposal = (hangoutId, proposalId) =>
  api.delete(`/hangouts/${hangoutId}/time-proposals/${proposalId}`)

export const acceptTime = (hangoutId, proposalId) =>
  api.post(`/hangouts/${hangoutId}/accept-time`, { proposal_id: proposalId })

export const acceptIdea = (hangoutId, ideaId) =>
  api.post(`/hangouts/${hangoutId}/accept-idea`, { idea_id: ideaId })

// Frens
export const getFrends = () =>
  api.get('/frens')

export const searchFrens = (q) =>
  api.get(`/frens/search?q=${encodeURIComponent(q)}`)

export const addFren = (frenId) =>
  api.post('/frens/add', { frenId })

export const removeFren = (id) =>
  api.delete(`/frens/${id}`)

export const getFrenRequests = () =>
  api.get('/frens/requests')

export const acceptFrenRequest = (requestId) =>
  api.post('/frens/accept', { requestId })

export const declineFrenRequest = (requestId) =>
  api.post('/frens/decline', { requestId })

export const pingFren = (id, options = {}) =>
  api.post(`/frens/${id}/ping`, options)

// Availability
export const getAvailability = () =>
  api.get('/availability')

export const setAvailability = (date, status) =>
  api.post('/availability', { date, status })

export const setBulkAvailability = (dates) =>
  api.post('/availability/bulk', { dates })

// User
export const updateStatus = (status) =>
  api.patch('/users/status', { status })

export const updateAvatarConfig = (config) =>
  api.patch('/users/avatar-config', { config })

export const updateDisplayName = (name) =>
  api.patch('/users/name', { name })

export const updateNotificationPrefs = (preferences) =>
  api.patch('/users/notifications', { preferences })

export const updatePrivacySettings = (preferences) =>
  api.patch('/users/privacy', { preferences })

export const deleteAccount = () =>
  api.delete('/users/account')

export const getUserStats = () =>
  api.get('/users/stats')

export const getFrenProfile = (userId) =>
  api.get(`/users/${userId}/profile`)

// AI
export const getSuggest = () =>
  api.get('/ai/suggest')

export const getNudge = (hangoutId) =>
  api.post(`/ai/nudge/${hangoutId}`)

// Nearby
export const getNearby = (lat, lng, mode = 'out') =>
  api.get(`/nearby?lat=${lat}&lng=${lng}&mode=${mode}`)

// Itinerary stops
export const getStops = (hangoutId) =>
  api.get(`/hangouts/${hangoutId}/stops`)

export const addStop = (hangoutId, stop) =>
  api.post(`/hangouts/${hangoutId}/stops`, stop)

export const updateStop = (hangoutId, stopId, updates) =>
  api.patch(`/hangouts/${hangoutId}/stops/${stopId}`, updates)

export const deleteStop = (hangoutId, stopId) =>
  api.delete(`/hangouts/${hangoutId}/stops/${stopId}`)

// Notifications
export const getNotifications = () =>
  api.get('/notifications')

export const getUnreadCount = () =>
  api.get('/notifications/unread-count')

export const markRead = (id) =>
  api.patch(`/notifications/${id}/read`)

export const markAllRead = () =>
  api.patch('/notifications/read-all')

export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`)

export const clearAllNotifications = () =>
  api.delete('/notifications/clear-all')
// Aliases for backward compatibility and mismatched imports across pages
export const getAiSuggestion = getSuggest
export const rsvpToHangout = rsvpHangout
export const createRsvp = rsvpHangout
export const getHangoutDetail = getHangout
export const voteOnVibe = voteVibeOption
export const addVibeVote = voteVibeOption
export const getNearbyFrens = getNearby
export const getFrens = getFrends
export const getFriends = getFrends
export const addFriend = addFren
export const removeFriend = removeFren
export const searchFriends = searchFrens
export const completeOnboarding = updateProfile
export const getMyProfile = getMe
export const getMyStats = getUserStats
export const updateAvailability = setAvailability

// Venues
export const getNearbyVenues = (lat, lng, category = 'all') =>
  api.get(`/venues/nearby?lat=${lat}&lng=${lng}&category=${category}`)

export const getVenueDetails = (placeId) =>
  api.get(`/venues/${placeId}`)

export default api
