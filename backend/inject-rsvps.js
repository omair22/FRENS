import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const HANGOUT_ID = '8987ee84-8b6d-4286-b4c8-134ad83a075b'
const COUNT = 10

const names = [
  'Alice', 'Bob', 'Charlie', 'David', 'Eve', 
  'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'
]

const allowedStyles = ['adventurer', 'bottts']

async function inject() {
  console.log(`🚀 Injecting ${COUNT} RSVPs with ONLY ROBOT/ADVENTURER into hangout: ${HANGOUT_ID}`)

  const usersToInsert = []
  const rsvpsToInsert = []

  for (let i = 0; i < COUNT; i++) {
    const userId = uuidv4()
    const name = names[i % names.length] + ' ' + (Math.floor(i / names.length) + 3) // +3 to distinguish
    const style = allowedStyles[i % allowedStyles.length]
    
    usersToInsert.push({
      id: userId,
      name: name,
      email: `dummy_v3_${i}_${Date.now()}@example.com`,
      status: 'free',
      avatar_config: { 
        style: style,
        seed: name 
      }
    })

    rsvpsToInsert.push({
      hangout_id: HANGOUT_ID,
      user_id: userId,
      response: 'in'
    })
  }

  // 1. Insert Users
  const { error: userError } = await supabase.from('users').insert(usersToInsert)
  if (userError) {
    console.error('❌ Error inserting users:', userError.message)
    return
  }
  console.log('✅ 10 Dummy users created with allowed styles (Adventurer & Robot)')

  // 2. Insert RSVPs
  const { error: rsvpError } = await supabase.from('rsvps').insert(rsvpsToInsert)
  if (rsvpError) {
    console.error('❌ Error inserting RSVPs:', rsvpError.message)
    return
  }
  console.log('✅ 10 RSVPs injected successfully!')
}

inject()
