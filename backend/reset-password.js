import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function resetPassword() {
  const email = 'demo22@gmail.com'
  const newPassword = 'demo22'

  // Look up the user by email first
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) { console.error('Error listing users:', listError.message); return }

  const user = users.find(u => u.email === email)
  if (!user) { console.error('User not found:', email); return }

  console.log(`Found user: ${user.id} (${user.email})`)

  // Update password
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
  if (error) { console.error('Error updating password:', error.message); return }

  console.log('------------------------------')
  console.log(`✅ Password reset successfully!`)
  console.log(`Email:    ${email}`)
  console.log(`Password: ${newPassword}`)
  console.log('------------------------------')
}

resetPassword()
