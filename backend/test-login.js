import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '..', 'frontend', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  const email = 'demo22@gmail.com'
  const password = 'Demo22!pass' // The one we set earlier

  console.log(`Attempting to login with: ${email} / ${password}`)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login failed:', error.message)
    return
  }

  console.log('Login successful!')
  console.log('User ID:', data.user.id)
  console.log('Session token:', data.session.access_token.substring(0, 20) + '...')
}

testLogin()
