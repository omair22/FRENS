import axios from 'axios'
import { supabase } from './supabase.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('[API] session:', session ? 'found' : 'missing')
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

export const getHangout = (id) => 
  api.get(`/hangouts/${id}`)

export const rsvpHangout = (hangoutId, response) => 
  api.post(`/hangouts/${hangoutId}/rsvp`, { response })

export const addVibeOption = (hangoutId, data) => 
  api.post(`/hangouts/${hangoutId}/vibe-options`, data)

export const voteVibeOption = (hangoutId, optionId) => 
  api.post(`/hangouts/${hangoutId}/vibe-votes`, { optionId })

export const uploadPhoto = (hangoutId, file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return api.post(`/hangouts/${hangoutId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getPhotos = (hangoutId) => 
  api.get(`/hangouts/${hangoutId}/photos`)

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

export const pingFren = (id) => 
  api.post(`/frens/${id}/ping`)

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


export const getUserStats = () => 
  api.get('/users/stats')

// AI
export const getSuggest = () => 
  api.get('/ai/suggest')

export const getNudge = (hangoutId) => 
  api.post(`/ai/nudge/${hangoutId}`)

// Nearby
export const getNearby = (lat, lng, mode = 'out') => 
  api.get(`/nearby?lat=${lat}&lng=${lng}&mode=${mode}`)

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
export const getHangoutPhotos = getPhotos
export const uploadHangoutPhoto = uploadPhoto

export default api
