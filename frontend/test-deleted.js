import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Simulator for the sign in loop
async function run() {
    const dummyAuthSession = {
        user: {
            id: 'fake-id',
            created_at: new Date(Date.now() - 100000).toISOString() // Created 100 seconds ago
        }
    }

    const { data: profile } = await supabase.from('users').select('avatar_config').eq('id', dummyAuthSession.user.id).maybeSingle()

    console.log("Profile returned:", profile);

    const isTestNewSignup = (Date.now() - new Date(dummyAuthSession.user.created_at).getTime()) < 60000;

    console.log("Is New Signup logic:", isTestNewSignup);

    if (!profile) {
        console.log("No profile -> If this wasn't a new signup, it's a deleted account.");
        if (!isTestNewSignup) {
            console.log("Redirecting to /onboarding?deleted=true");
        }
    }

}
run()
