import { supabase } from './supabase.js'

/**
 * Create one or more in-app notifications
 * @param {string|string[]} userIds - who to notify
 * @param {object} notification - { type, title, body, data }
 */
export const notify = async (userIds, { type, title, body, data = {} }) => {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds]
    if (ids.length === 0) return

    const rows = ids.map(user_id => ({
      user_id,
      type,
      title,
      body: body || null,
      data,
      read: false,
    }))

    const { error } = await supabase.from('notifications').insert(rows)
    if (error) console.error('[NOTIFY] insert error:', error)
  } catch (err) {
    console.error('[NOTIFY] error:', err)
  }
}
