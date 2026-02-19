import { createClient } from "@supabase/supabase-js";

// Use provided credentials directly or fallback to env vars if set
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xynildkfgswxqgselxax.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bmlsZGtmZ3N3eHFnc2VseGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzQ2OTQsImV4cCI6MjA4NjkxMDY5NH0.MwLqSGcNgbNfDEFhu41fUS9mntQvjgedBah-QEBhhcM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
