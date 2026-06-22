import { supabase } from '../lib/supabase';

export const matchService = {
  async saveMatch(matchData) {
    const { data, error } = await supabase
      .from('memory_agents_matches')
      .insert(matchData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
