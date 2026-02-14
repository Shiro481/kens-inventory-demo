
import { createClient } from '@supabase/supabase-js'

/**
 * Access Supabase environment variables from Vite
 * These are required for the application to connect to the backend.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables on initialization
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables! Check your .env file.')
}

/**
 * Supabase Client Instance
 * 
 * This client is used throughout the application to interact with the Supabase database
 * and authentication services.
 * 
 * If the environment variables are missing, this will be null, and the application
 * should handle this gracefully (e.g., by checking `if (!supabase)`).
 */
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;