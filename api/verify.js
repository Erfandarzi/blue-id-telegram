import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

function getTrustLevel(count) {
  if (count >= 10) return 'VERIFIED_HUMAN'
  if (count >= 5) return 'TRUSTED'
  if (count >= 1) return 'KNOWN'
  return 'UNVERIFIED'
}

export default async function handler(req, res) {
  // CORS headers for third-party access
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({ error: 'Missing id parameter' })
  }

  const { data, error } = await supabase
    .from('vouches')
    .select('from_id')
    .eq('to_id', id)

  if (error) {
    return res.status(500).json({ error: 'Database error' })
  }

  const count = data?.length || 0
  const trust_level = getTrustLevel(count)

  return res.status(200).json({
    id,
    vouch_count: count,
    trust_level,
    verified: count >= 5
  })
}

