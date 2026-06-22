import { supabase } from '../lib/supabase';

export const gameService = {
  async getGame(gameId) {
    const { data, error } = await supabase
      .from('memory_agents_games')
      .select('*')
      .eq('id', gameId)
      .single();
    if (error) throw error;
    return data;
  },

  async getGameCards(gameId) {
    const { data, error } = await supabase
      .from('memory_agents_cards')
      .select('*')
      .eq('game_id', gameId);
    if (error) throw error;
    return data;
  },

  async getAIConfig(gameId) {
    const { data, error } = await supabase
      .from('memory_agents_ai_configs')
      .select('*')
      .eq('game_id', gameId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error; // Ignorar se não encontrar
    return data; 
  }
};
