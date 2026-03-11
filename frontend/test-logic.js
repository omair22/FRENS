import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session user:', session?.user ? session.user : 'No session')
    if (session?.user) {
        console.log('User created at:', session.user.created_at)

        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
        console.log('Users row:', data)

        const isReady = data && Object.keys(data.avatar_config || {}).length > 0;
        console.log('Is fully onboarded:', isReady);
    } else {
        // Try to login with an account. We don't have the password, but we can see if auth behaves correctly.
        console.log('Not logged in.')
    }
}

run()
