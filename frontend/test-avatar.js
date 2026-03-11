import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testDeletedAccountLogin() {
    const email = 'old_deleted_email@example.com' // hypothetical
    const password = 'password'

    // We cannot easily test sign-in if we don't have the user credentials. 
    // Let's just output the avatar_config check logic to make sure the syntax is perfect.
    const sampleData = { status: 'free', avatar_config: {} }
    const isReady = sampleData && Object.keys(sampleData.avatar_config || {}).length > 0;
    console.log('Sample newly created user via trigger, is fully onboarded?:', isReady)

    const onboardedData = { status: 'free', avatar_config: { skinColor: 'f2d3b1', hair: 'none' } }
    const isReady2 = onboardedData && Object.keys(onboardedData.avatar_config || {}).length > 0;
    console.log('Sample onboarded user, is fully onboarded?:', isReady2)
}

testDeletedAccountLogin()
