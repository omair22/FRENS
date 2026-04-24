import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createDemoUser() {
  const email = 'demo22@gmail.com'
  const password = 'demo22'

  console.log(`Attempting to create demo user: ${email}`)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error) {
    console.error('Error creating demo user:', error.message)
    return
  }

  console.log('Demo user created successfully!')
  console.log('------------------------------')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log('------------------------------')
  
  // Also create entry in public.users
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: data.user.id,
      email: email,
      name: 'Demo User',
      status: 'free'
    })

  if (profileError) {
    console.warn('Failed to create profile entry, but auth user exists:', profileError.message)
  }
}

createDemoUser()
