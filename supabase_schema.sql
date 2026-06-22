-- ============================================================
-- MEMORY AGENTS — Supabase Schema Completo
-- Plataforma Web para Geração de Jogos da Memória com IA
-- TCC — Universidade
-- ============================================================
-- IMPORTANTE: Todas as tabelas utilizam o prefixo memory_agents_
-- para evitar conflitos com outros projetos no mesmo Supabase.
-- ============================================================

-- ============================================================
-- 0. EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABELAS
-- ============================================================

-- 1.1 Perfis de Usuários (vinculado ao auth.users)
CREATE TABLE IF NOT EXISTS memory_agents_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('aluno', 'professor')) DEFAULT 'aluno',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Jogos criados por professores
CREATE TABLE IF NOT EXISTS memory_agents_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  game_type TEXT NOT NULL DEFAULT 'memory_game',
  match_type TEXT NOT NULL DEFAULT 'image_image_same'
    CHECK (match_type IN ('image_image_same', 'image_image_diff', 'image_text', 'text_text')),
  difficulty TEXT NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  card_count INTEGER NOT NULL DEFAULT 16,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  plays INTEGER NOT NULL DEFAULT 0,
  author_id UUID NOT NULL REFERENCES memory_agents_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 Cartas (pares) de cada jogo
CREATE TABLE IF NOT EXISTS memory_agents_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES memory_agents_games(id) ON DELETE CASCADE,
  pair_index INTEGER NOT NULL,
  item1_type TEXT NOT NULL DEFAULT 'image' CHECK (item1_type IN ('image', 'text')),
  item1_content TEXT NOT NULL DEFAULT '',
  item2_type TEXT NOT NULL DEFAULT 'image' CHECK (item2_type IN ('image', 'text')),
  item2_content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 Partidas jogadas
CREATE TABLE IF NOT EXISTS memory_agents_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES memory_agents_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES memory_agents_profiles(id) ON DELETE CASCADE,
  turma_id UUID,
  player_score INTEGER NOT NULL DEFAULT 0,
  ai_score INTEGER NOT NULL DEFAULT 0,
  player_flips INTEGER NOT NULL DEFAULT 0,
  ai_flips INTEGER NOT NULL DEFAULT 0,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  ai_difficulty TEXT NOT NULL DEFAULT 'medium',
  winner TEXT CHECK (winner IN ('player', 'ai', 'draw')),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Estatísticas agregadas por jogador
CREATE TABLE IF NOT EXISTS memory_agents_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES memory_agents_profiles(id) ON DELETE CASCADE,
  total_matches INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_draws INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  best_time_seconds INTEGER,
  avg_time_seconds INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id)
);

-- 1.6 Configurações de IA por jogo
CREATE TABLE IF NOT EXISTS memory_agents_ai_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES memory_agents_games(id) ON DELETE CASCADE,
  ai_type TEXT NOT NULL DEFAULT 'heuristic'
    CHECK (ai_type IN ('random', 'heuristic', 'mlp', 'reinforcement_learning')),
  memory_decay_rate NUMERIC(4,3) NOT NULL DEFAULT 0.15,
  mistake_rate NUMERIC(4,3) NOT NULL DEFAULT 0.20,
  thinking_delay_ms INTEGER NOT NULL DEFAULT 1500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id)
);

-- 1.7 Turmas
CREATE TABLE IF NOT EXISTS memory_agents_turmas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  professor_id UUID NOT NULL REFERENCES memory_agents_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'memory_agents_matches_turma_id_fkey'
      AND table_name = 'memory_agents_matches'
  ) THEN
    ALTER TABLE memory_agents_matches
      ADD CONSTRAINT memory_agents_matches_turma_id_fkey
      FOREIGN KEY (turma_id) REFERENCES memory_agents_turmas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 1.8 Relação N:N turma ↔ aluno
CREATE TABLE IF NOT EXISTS memory_agents_turma_alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turma_id UUID NOT NULL REFERENCES memory_agents_turmas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES memory_agents_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(turma_id, aluno_id)
);

-- 1.9 Relação N:N turma ↔ jogo
CREATE TABLE IF NOT EXISTS memory_agents_turma_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turma_id UUID NOT NULL REFERENCES memory_agents_turmas(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES memory_agents_games(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(turma_id, game_id)
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_games_author ON memory_agents_games(author_id);
CREATE INDEX IF NOT EXISTS idx_games_type ON memory_agents_games(game_type);
CREATE INDEX IF NOT EXISTS idx_games_created ON memory_agents_games(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cards_game ON memory_agents_cards(game_id);

CREATE INDEX IF NOT EXISTS idx_matches_game ON memory_agents_matches(game_id);
CREATE INDEX IF NOT EXISTS idx_matches_player ON memory_agents_matches(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_turma ON memory_agents_matches(turma_id);
CREATE INDEX IF NOT EXISTS idx_matches_created ON memory_agents_matches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_statistics_player ON memory_agents_statistics(player_id);

CREATE INDEX IF NOT EXISTS idx_turmas_professor ON memory_agents_turmas(professor_id);
CREATE INDEX IF NOT EXISTS idx_turmas_code ON memory_agents_turmas(code);

CREATE INDEX IF NOT EXISTS idx_turma_alunos_turma ON memory_agents_turma_alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_alunos_aluno ON memory_agents_turma_alunos(aluno_id);

CREATE INDEX IF NOT EXISTS idx_turma_games_turma ON memory_agents_turma_games(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_games_game ON memory_agents_turma_games(game_id);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE memory_agents_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_agents_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_agents_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_agents_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_agents_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_agents_ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_agents_turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_agents_turma_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_agents_turma_games ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3.1 Policies — PROFILES
-- ============================================================

-- Qualquer usuário autenticado pode ler perfis (para exibir nomes)
DROP POLICY IF EXISTS "profiles_select_authenticated" ON memory_agents_profiles;
CREATE POLICY "profiles_select_authenticated"
  ON memory_agents_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Usuário pode inserir seu próprio perfil
DROP POLICY IF EXISTS "profiles_insert_own" ON memory_agents_profiles;
CREATE POLICY "profiles_insert_own"
  ON memory_agents_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Usuário pode atualizar seu próprio perfil
DROP POLICY IF EXISTS "profiles_update_own" ON memory_agents_profiles;
CREATE POLICY "profiles_update_own"
  ON memory_agents_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 3.2 Policies — GAMES
-- ============================================================

-- Jogos publicados são visíveis a todos os autenticados
DROP POLICY IF EXISTS "games_select_published" ON memory_agents_games;
CREATE POLICY "games_select_published"
  ON memory_agents_games FOR SELECT
  TO authenticated
  USING (is_published = true OR author_id = auth.uid());

-- Professores podem inserir jogos
DROP POLICY IF EXISTS "games_insert_professor" ON memory_agents_games;
CREATE POLICY "games_insert_professor"
  ON memory_agents_games FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM memory_agents_profiles
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- Professores podem atualizar seus próprios jogos
DROP POLICY IF EXISTS "games_update_own" ON memory_agents_games;
CREATE POLICY "games_update_own"
  ON memory_agents_games FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Professores podem deletar seus próprios jogos
DROP POLICY IF EXISTS "games_delete_own" ON memory_agents_games;
CREATE POLICY "games_delete_own"
  ON memory_agents_games FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ============================================================
-- 3.3 Policies — CARDS
-- ============================================================

-- Cartas são visíveis a todos (para jogar)
DROP POLICY IF EXISTS "cards_select_all" ON memory_agents_cards;
CREATE POLICY "cards_select_all"
  ON memory_agents_cards FOR SELECT
  TO authenticated
  USING (true);

-- Apenas o autor do jogo pode inserir cartas
DROP POLICY IF EXISTS "cards_insert_author" ON memory_agents_cards;
CREATE POLICY "cards_insert_author"
  ON memory_agents_cards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memory_agents_games
      WHERE id = game_id AND author_id = auth.uid()
    )
  );

-- Apenas o autor pode deletar cartas
DROP POLICY IF EXISTS "cards_delete_author" ON memory_agents_cards;
CREATE POLICY "cards_delete_author"
  ON memory_agents_cards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memory_agents_games
      WHERE id = game_id AND author_id = auth.uid()
    )
  );

-- ============================================================
-- 3.4 Policies — MATCHES
-- ============================================================

-- Jogadores podem ver suas próprias partidas + professores veem partidas de seus jogos
DROP POLICY IF EXISTS "matches_select" ON memory_agents_matches;
CREATE POLICY "matches_select"
  ON memory_agents_matches FOR SELECT
  TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM memory_agents_games
      WHERE id = game_id AND author_id = auth.uid()
    )
  );

-- Qualquer autenticado pode criar uma partida
DROP POLICY IF EXISTS "matches_insert_player" ON memory_agents_matches;
CREATE POLICY "matches_insert_player"
  ON memory_agents_matches FOR INSERT
  TO authenticated
  WITH CHECK (player_id = auth.uid());

-- Jogador pode atualizar suas próprias partidas (para finalizar)
DROP POLICY IF EXISTS "matches_update_own" ON memory_agents_matches;
CREATE POLICY "matches_update_own"
  ON memory_agents_matches FOR UPDATE
  TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

-- ============================================================
-- 3.5 Policies — STATISTICS
-- ============================================================

DROP POLICY IF EXISTS "statistics_select" ON memory_agents_statistics;
CREATE POLICY "statistics_select"
  ON memory_agents_statistics FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

DROP POLICY IF EXISTS "statistics_insert_own" ON memory_agents_statistics;
CREATE POLICY "statistics_insert_own"
  ON memory_agents_statistics FOR INSERT
  TO authenticated
  WITH CHECK (player_id = auth.uid());

DROP POLICY IF EXISTS "statistics_update_own" ON memory_agents_statistics;
CREATE POLICY "statistics_update_own"
  ON memory_agents_statistics FOR UPDATE
  TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

-- ============================================================
-- 3.6 Policies — AI CONFIGS
-- ============================================================

DROP POLICY IF EXISTS "ai_configs_select" ON memory_agents_ai_configs;
CREATE POLICY "ai_configs_select"
  ON memory_agents_ai_configs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "ai_configs_insert_author" ON memory_agents_ai_configs;
CREATE POLICY "ai_configs_insert_author"
  ON memory_agents_ai_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memory_agents_games
      WHERE id = game_id AND author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ai_configs_update_author" ON memory_agents_ai_configs;
CREATE POLICY "ai_configs_update_author"
  ON memory_agents_ai_configs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memory_agents_games
      WHERE id = game_id AND author_id = auth.uid()
    )
  );

-- ============================================================
-- 3.7 Policies — TURMAS
-- ============================================================

-- Turmas visíveis a todos os autenticados (para descobrir via código)
DROP POLICY IF EXISTS "turmas_select_authenticated" ON memory_agents_turmas;
CREATE POLICY "turmas_select_authenticated"
  ON memory_agents_turmas FOR SELECT
  TO authenticated
  USING (true);

-- Professores criam turmas
DROP POLICY IF EXISTS "turmas_insert_professor" ON memory_agents_turmas;
CREATE POLICY "turmas_insert_professor"
  ON memory_agents_turmas FOR INSERT
  TO authenticated
  WITH CHECK (
    professor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM memory_agents_profiles
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- Professores atualizam suas turmas
DROP POLICY IF EXISTS "turmas_update_own" ON memory_agents_turmas;
CREATE POLICY "turmas_update_own"
  ON memory_agents_turmas FOR UPDATE
  TO authenticated
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- Professores deletam suas turmas
DROP POLICY IF EXISTS "turmas_delete_own" ON memory_agents_turmas;
CREATE POLICY "turmas_delete_own"
  ON memory_agents_turmas FOR DELETE
  TO authenticated
  USING (professor_id = auth.uid());

-- ============================================================
-- 3.8 Policies — TURMA_ALUNOS
-- ============================================================

DROP POLICY IF EXISTS "turma_alunos_select" ON memory_agents_turma_alunos;
CREATE POLICY "turma_alunos_select"
  ON memory_agents_turma_alunos FOR SELECT
  TO authenticated
  USING (true);

-- Alunos podem entrar em turmas
DROP POLICY IF EXISTS "turma_alunos_insert" ON memory_agents_turma_alunos;
CREATE POLICY "turma_alunos_insert"
  ON memory_agents_turma_alunos FOR INSERT
  TO authenticated
  WITH CHECK (aluno_id = auth.uid());

-- Professor da turma ou o próprio aluno podem remover
DROP POLICY IF EXISTS "turma_alunos_delete" ON memory_agents_turma_alunos;
CREATE POLICY "turma_alunos_delete"
  ON memory_agents_turma_alunos FOR DELETE
  TO authenticated
  USING (
    aluno_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM memory_agents_turmas
      WHERE id = turma_id AND professor_id = auth.uid()
    )
  );

-- ============================================================
-- 3.9 Policies — TURMA_GAMES
-- ============================================================

DROP POLICY IF EXISTS "turma_games_select" ON memory_agents_turma_games;
CREATE POLICY "turma_games_select"
  ON memory_agents_turma_games FOR SELECT
  TO authenticated
  USING (true);

-- Professor da turma pode vincular jogos
DROP POLICY IF EXISTS "turma_games_insert" ON memory_agents_turma_games;
CREATE POLICY "turma_games_insert"
  ON memory_agents_turma_games FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memory_agents_turmas
      WHERE id = turma_id AND professor_id = auth.uid()
    )
  );

-- Professor da turma pode desvincular jogos
DROP POLICY IF EXISTS "turma_games_delete" ON memory_agents_turma_games;
CREATE POLICY "turma_games_delete"
  ON memory_agents_turma_games FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memory_agents_turmas
      WHERE id = turma_id AND professor_id = auth.uid()
    )
  );

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- 4.1 Trigger para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION memory_agents_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON memory_agents_profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON memory_agents_profiles
  FOR EACH ROW EXECUTE FUNCTION memory_agents_update_timestamp();

DROP TRIGGER IF EXISTS trg_games_updated ON memory_agents_games;
CREATE TRIGGER trg_games_updated
  BEFORE UPDATE ON memory_agents_games
  FOR EACH ROW EXECUTE FUNCTION memory_agents_update_timestamp();

DROP TRIGGER IF EXISTS trg_turmas_updated ON memory_agents_turmas;
CREATE TRIGGER trg_turmas_updated
  BEFORE UPDATE ON memory_agents_turmas
  FOR EACH ROW EXECUTE FUNCTION memory_agents_update_timestamp();

CREATE OR REPLACE FUNCTION public.memory_agents_handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_role TEXT;
BEGIN
  profile_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'aluno');

  IF profile_role NOT IN ('aluno', 'professor') THEN
    profile_role := 'aluno';
  END IF;

  INSERT INTO public.memory_agents_profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    profile_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_memory_agents_auth_user_created ON auth.users;
CREATE TRIGGER trg_memory_agents_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.memory_agents_handle_new_user();

-- 4.2 Trigger para incrementar plays ao finalizar partida
CREATE OR REPLACE FUNCTION memory_agents_increment_plays()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (TG_OP = 'INSERT' OR OLD.completed = false) THEN
    UPDATE memory_agents_games
    SET plays = plays + 1
    WHERE id = NEW.game_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_matches_increment_plays ON memory_agents_matches;
CREATE TRIGGER trg_matches_increment_plays
  AFTER INSERT OR UPDATE ON memory_agents_matches
  FOR EACH ROW EXECUTE FUNCTION memory_agents_increment_plays();

-- 4.3 Trigger para atualizar estatísticas ao finalizar partida
CREATE OR REPLACE FUNCTION memory_agents_update_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (TG_OP = 'INSERT' OR OLD.completed = false) THEN
    INSERT INTO memory_agents_statistics (player_id, total_matches, total_wins, total_losses, total_draws, total_score, best_time_seconds, avg_time_seconds)
    VALUES (
      NEW.player_id, 1,
      CASE WHEN NEW.winner = 'player' THEN 1 ELSE 0 END,
      CASE WHEN NEW.winner = 'ai' THEN 1 ELSE 0 END,
      CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
      NEW.player_score,
      NEW.total_time_seconds,
      NEW.total_time_seconds
    )
    ON CONFLICT (player_id) DO UPDATE SET
      total_matches = memory_agents_statistics.total_matches + 1,
      total_wins = memory_agents_statistics.total_wins + CASE WHEN NEW.winner = 'player' THEN 1 ELSE 0 END,
      total_losses = memory_agents_statistics.total_losses + CASE WHEN NEW.winner = 'ai' THEN 1 ELSE 0 END,
      total_draws = memory_agents_statistics.total_draws + CASE WHEN NEW.winner = 'draw' THEN 1 ELSE 0 END,
      total_score = memory_agents_statistics.total_score + NEW.player_score,
      best_time_seconds = LEAST(COALESCE(memory_agents_statistics.best_time_seconds, NEW.total_time_seconds), NEW.total_time_seconds),
      avg_time_seconds = (
        (COALESCE(memory_agents_statistics.avg_time_seconds, 0) * memory_agents_statistics.total_matches + NEW.total_time_seconds)
        / (memory_agents_statistics.total_matches + 1)
      ),
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_matches_update_stats ON memory_agents_matches;
CREATE TRIGGER trg_matches_update_stats
  AFTER INSERT OR UPDATE ON memory_agents_matches
  FOR EACH ROW EXECUTE FUNCTION memory_agents_update_statistics();

-- ============================================================
-- 5. STORAGE BUCKETS
-- ============================================================

-- Bucket para imagens das cartas (público para exibição nos jogos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-agents-images', 'memory-agents-images', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket para thumbnails dos jogos
INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-agents-thumbnails', 'memory-agents-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies — Imagens
DROP POLICY IF EXISTS "images_select_public" ON storage.objects;
CREATE POLICY "images_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'memory-agents-images');

DROP POLICY IF EXISTS "images_insert_authenticated" ON storage.objects;
CREATE POLICY "images_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'memory-agents-images');

DROP POLICY IF EXISTS "images_delete_own" ON storage.objects;
CREATE POLICY "images_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'memory-agents-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage Policies — Thumbnails
DROP POLICY IF EXISTS "thumbnails_select_public" ON storage.objects;
CREATE POLICY "thumbnails_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'memory-agents-thumbnails');

DROP POLICY IF EXISTS "thumbnails_insert_authenticated" ON storage.objects;
CREATE POLICY "thumbnails_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'memory-agents-thumbnails');

DROP POLICY IF EXISTS "thumbnails_delete_own" ON storage.objects;
CREATE POLICY "thumbnails_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'memory-agents-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
