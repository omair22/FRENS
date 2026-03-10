export const getNotifConfig = (type) => {
  const configs = {
    fren_request:         { icon: '👋', color: '#4d96ff',  label: 'Fren Request' },
    fren_accepted:        { icon: '🎉', color: '#6bcb77',  label: 'Fren Accepted' },
    hangout_invite:       { icon: '📅', color: '#ffd93d',  label: 'Hangout Invite' },
    rsvp_update:          { icon: '✅', color: '#6bcb77',  label: 'RSVP Update' },
    hangout_reminder:     { icon: '⏰', color: '#ff6b6b',  label: 'Reminder' },
    nearby_ping:          { icon: '📍', color: '#ff6b6b',  label: 'Ping!' },
    new_photo:            { icon: '📸', color: '#c77dff',  label: 'New Photo' },
    vibe_vote:            { icon: '🗳️', color: '#ffd93d',  label: 'Vibe Vote' },
    idea_vote:            { icon: '💡', color: '#ffd93d',  label: 'Idea Vote' },
    hangout_updated:      { icon: '✏️', color: '#4d96ff',  label: 'Plan Updated' },
    hangout_cancelled:    { icon: '❌', color: '#ff6b6b',  label: 'Plan Cancelled' },
    co_host_added:        { icon: '👑', color: '#ffd93d',  label: 'Co-Host' },
    fren_nearby:          { icon: '📍', color: '#6bcb77',  label: 'Fren Nearby' },
    plan_losing_momentum: { icon: '⚡', color: '#ffd93d',  label: 'Needs Attention' },
  }
  return configs[type] || { icon: '🔔', color: '#ffffff', label: 'Notification' }
}
