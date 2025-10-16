const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co'
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR'

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetJobs() {
  // First check what jobs exist
  const { data: allJobs, error: listError } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (listError) {
    console.error('Error listing jobs:', listError)
  } else {
    console.log('Recent jobs:', allJobs)
  }

  // Reset any stuck in in_progress status
  const { data, error } = await supabase
    .from('jobs')
    .update({
      status: 'pending',
      started_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('status', 'in_progress')
    .select()

  if (error) {
    console.error('Error resetting jobs:', error)
  } else {
    console.log('Reset jobs:', data)
  }
}

resetJobs().then(() => process.exit(0))
