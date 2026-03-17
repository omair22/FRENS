export const getNotifConfig = (type) => {
  const configs = {
    fren_request:         { label: 'Fren Request' },
    fren_accepted:        { label: 'Fren Accepted' },
    hangout_invite:       { label: 'Hangout Invite' },
    rsvp_update:          { label: 'RSVP Update' },
    hangout_reminder:     { label: 'Reminder' },
    nearby_ping:          { label: 'Ping!' },
    new_photo:            { label: 'New Photo' },
    vibe_vote:            { label: 'Vibe Vote' },
    idea_vote:            { label: 'Idea Vote' },
    hangout_updated:      { label: 'Plan Updated' },
    hangout_cancelled:    { label: 'Plan Cancelled' },
    co_host_added:        { label: 'Co-Host' },
    fren_nearby:          { label: 'Fren Nearby' },
    plan_losing_momentum: { label: 'Needs Attention' },
  }
  return configs[type] || { label: 'Notification' }
}
