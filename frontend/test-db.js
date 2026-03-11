import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log('Querying users table...')
    const { data: users, error: userError } = await supabase.from('users').select('*')
    console.log('Users:', users)
    if (userError) console.error(userError)
}

run()
