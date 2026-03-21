import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('CRITICAL: SUPABASE_URL is missing! Please configure it in your environment variables.')
}

if (!supabaseUrl.startsWith('http')) {
  throw new Error(`CRITICAL: SUPABASE_URL is invalid ("${supabaseUrl}"). It must start with http:// or https://`)
}

if (!supabaseServiceKey) {
  throw new Error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing! Please configure it in your environment variables.')
}

// Backend uses service role key for admin access to bypass RLS when needed
export const supabase = createClient(supabaseUrl, supabaseServiceKey)
