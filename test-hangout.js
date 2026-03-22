import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: 'd:/FRENS/backend/.env' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data, error } = await supabase
    .from('hangouts')
    .select('*')
    .eq('id', '1e56bd37-f598-4f4b-84fc-dd2b0327628d')
    .single()
  console.log(data, error)
}
test()
