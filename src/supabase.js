import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Vouch for someone
export async function addVouch(fromId, toId) {
  if (!supabase) return { error: 'No backend configured' }
  
  const { error } = await supabase
    .from('vouches')
    .insert({ from_id: fromId, to_id: toId })
  
  return { error: error?.code === '23505' ? 'Already vouched' : error?.message }
}

// Get vouches received by a user
export async function getVouchesReceived(userId) {
  if (!supabase) return { count: 0, from: [] }
  
  const { data, error } = await supabase
    .from('vouches')
    .select('from_id')
    .eq('to_id', userId)
  
  if (error) return { count: 0, from: [] }
  return { count: data.length, from: data.map(v => v.from_id) }
}

// Get vouches given by a user
export async function getVouchesGiven(userId) {
  if (!supabase) return []
  
  const { data } = await supabase
    .from('vouches')
    .select('to_id')
    .eq('from_id', userId)
  
  return data?.map(v => v.to_id) || []
}

