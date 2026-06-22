import { supabase } from '../lib/supabase';

export const profileService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('memory_agents_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }
};
