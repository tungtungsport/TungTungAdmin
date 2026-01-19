import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mofmwtbkyabnqepqofcj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZm13dGJreWFibnFlcHFvZmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDU0NjYsImV4cCI6MjA4NDM4MTQ2Nn0.mFSiIWn94TR89iQsDsiMEwS4r9mC0vLf-HqAJLFDDsc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
