import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iemjqaztiubennsuyzhh.supabase.co';
const supabaseAnonKey = 'sb_publishable_nTUa2x-hrC7uqO2W6Ro7zg_WtYiulRN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
