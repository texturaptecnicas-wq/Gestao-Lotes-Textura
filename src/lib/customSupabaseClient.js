import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uczrouqdhglvgwmzfiwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjenJvdXFkaGdsdmd3bXpmaXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MjksImV4cCI6MjA3NjY0ODgyOX0.dpuvAU07nS7lR_EN-UmCu4xE5dZLcDi9qCggxEUHMR4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);