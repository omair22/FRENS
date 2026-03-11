import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompleteFlow() {
    const email = 'normal_test_' + Date.now() + '@example.com'
    const password = 'Password@123!'

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
        console.error('Sign up error:', authError)
        return
    }
    console.log('Signed up user id:', authData.user.id)

    await new Promise(r => setTimeout(r, 1000))

    const { data: upsertData, error: upsertError } = await supabase
        .from('users')
        .upsert({
            id: authData.user.id,
            email: authData.user.email,
            name: 'Test Name',
            avatar_config: { skinColor: 'f2d3b1' },
            status: 'free'
        })
        .select()
        .single()

    if (upsertError) {
        console.error('Upsert errored:', upsertError)
        return
    }
    console.log('Upsert succeeded:', upsertData?.id)

    const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle()

    const isFullyOnboarded = data && Object.keys(data.avatar_config || {}).length > 0;
    console.log('Is Fully Onboarded in App.jsx logic?', isFullyOnboarded)
}
testCompleteFlow()
