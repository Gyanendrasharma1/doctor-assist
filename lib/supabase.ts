import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
const supabaseServiceRoleKey = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * PUBLIC CLIENT
 * - Frontend
 * - Read-only / user scoped
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * SERVER-ONLY ADMIN CLIENT
 * - Signup
 * - Inserts
 * - Secure operations
 * ⚠️ NEVER use in frontend
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);
