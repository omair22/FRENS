import { supabase } from './supabase.js'

/**
 * Archives any hangout whose datetime has passed
 * and is still in 'happening' or 'planning' status.
 * Call this on a schedule or on every request.
 */
export const archivePassedHangouts = async () => {
    try {
        const now = new Date().toISOString()

        const { data, error } = await supabase
            .from('hangouts')
            .update({ status: 'archived' })
            .lt('datetime', now)
            .in('status', ['happening', 'planning', 'locked'])
            .select('id, title')

        if (error) throw error

        if (data?.length > 0) {
            console.log(`[ARCHIVE] Archived ${data.length} hangout(s):`,
                data.map(h => h.title).join(', '))
        }

        return data || []
    } catch (err) {
        console.error('[ARCHIVE] Error:', err)
        return []
    }
}
