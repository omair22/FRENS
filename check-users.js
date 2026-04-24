import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env from frontend directory
dotenv.config({ path: path.join(process.cwd(), 'frontend', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
    console.log('Fetching users from Supabase...')
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name')
        .limit(10)
    
    if (error) {
        console.error('Error fetching users:', error.message)
        return
    }

    if (users.length === 0) {
        console.log('No users found in public.users table.')
    } else {
        console.log('Recent users:')
        console.table(users)
    }
}

checkUsers()
