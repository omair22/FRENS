import { supabase } from '../lib/supabase.js'

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new Error('Invalid token')
    }

    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
