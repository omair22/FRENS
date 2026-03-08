/**
 * DiceBear avatar utilities — no API key needed, free SVG avatars
 * Docs: https://www.dicebear.com/how-to-use/http-api
 */

export const AVATAR_STYLES = [
  { id: 'adventurer',  label: 'Adventurer',  emoji: '🧙' },
  { id: 'micah',       label: 'Micah',       emoji: '😎' },
  { id: 'bottts',      label: 'Robot',       emoji: '🤖' },
  { id: 'pixel-art',   label: 'Pixel',       emoji: '👾' },
  { id: 'open-peeps',  label: 'Peeps',       emoji: '🧍' },
  { id: 'fun-emoji',   label: 'Emoji',       emoji: '🎭' },
]

/**
 * Returns a DiceBear avatar URL for a user.
 * Falls back to 'adventurer' style if none set.
 * Uses the user's id as the seed for consistent generation.
 */
export const getAvatarUrl = (user, size = 80) => {
  if (!user) return null
  const style = user.avatar_style || 'adventurer'
  const seed  = encodeURIComponent(user.id || user.name || 'default')
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&size=${size}&backgroundColor=transparent`
}
