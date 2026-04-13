import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type TeamMemberRow = Database['public']['Tables']['team_phone_numbers']['Row']
export type TeamMember = TeamMemberRow

export async function getAgentByPhone(phone: string): Promise<TeamMember | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('team_phone_numbers')
    .select('*')
    .eq('phone', phone)
    .eq('active', true)
    .single()

  return data ?? null
}
