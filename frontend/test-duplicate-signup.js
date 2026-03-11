import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignUpExisting() {
    const email = 'normal_test_12345@example.com' // We will register this first
    const password = 'Password@123!'

    console.log('Creating initial user...')
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
        console.log('Initial sign up error:', authError)
    } else {
        console.log('Initial user created.')
    }

    // 2. Now sign up again with same email
    console.log('\nTrying to sign up again with same email...')
    const { data: authData2, error: authError2 } = await supabase.auth.signUp({ email, password })

    if (authError2) {
        console.log('Second sign up errored as expected:', authError2.message)
    } else {
        console.log('Second sign up succeeded?!', authData2.user?.id)
        if (authData2.session) {
            console.log('And it returned a session?!')
        } else {
            console.log('But no session returned (needs confirmation?)')
        }
    }
}
testSignUpExisting()
