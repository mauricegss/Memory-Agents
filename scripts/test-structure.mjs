/* global process */
// Teste estrutural: valida policies (RLS) positivas e negativas em todas as
// tabelas + triggers, com professor e aluno reais. Limpa tudo ao final.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE;
const ts = Date.now();

const prof = createClient(url, anon);
const aluno = createClient(url, anon);
const svc = createClient(url, service, { auth: { persistSession: false } });

const results = [];
async function check(label, expect, fn) {
  let error = null;
  try {
    const r = await fn();
    error = r?.error ?? null;
  } catch (e) {
    error = e;
  }
  const ok = expect === 'ok' ? !error : !!error;
  results.push({ ok, label });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${error ? `  [${error.message || error}]` : ''}`);
}

async function main() {
  // ── Setup: professor + aluno ──────────────────────────────
  const { data: pu, error: pe } = await prof.auth.signUp({
    email: `struct_prof_${ts}@test.com`,
    password: 'testpassword123',
    options: { data: { name: 'Struct Prof', role: 'professor' } },
  });
  if (pe) throw new Error('signUp professor: ' + pe.message);
  const { data: au, error: ae } = await aluno.auth.signUp({
    email: `struct_aluno_${ts}@test.com`,
    password: 'testpassword123',
    options: { data: { name: 'Struct Aluno', role: 'aluno' } },
  });
  if (ae) throw new Error('signUp aluno: ' + ae.message);

  await prof.auth.signInWithPassword({ email: `struct_prof_${ts}@test.com`, password: 'testpassword123' });
  await aluno.auth.signInWithPassword({ email: `struct_aluno_${ts}@test.com`, password: 'testpassword123' });
  await new Promise(r => setTimeout(r, 1000)); // trigger do trigger de perfis

  const profId = pu.user.id;
  const alunoId = au.user.id;

  // ── PROFILES ──────────────────────────────────────────────
  await check('profiles: professor lê o próprio perfil', 'ok',
    () => prof.from('memory_agents_profiles').select('*').eq('id', profId).single());
  await check('profiles: aluno lê perfil de outro usuário', 'ok',
    () => aluno.from('memory_agents_profiles').select('id').eq('id', profId).single());
  await check('profiles: aluno NÃO atualiza perfil alheio (0 linhas)', 'ok', async () => {
    const r = await aluno.from('memory_agents_profiles').update({ name: 'hack' }).eq('id', profId).select();
    if (r.error) return r;
    return { error: (r.data?.length ?? 0) > 0 ? { message: 'atualizou perfil alheio!' } : null };
  });

  // ── TURMAS ───────────────────────────────────────────────
  let turmaId;
  await check('turmas: professor cria turma', 'ok', async () => {
    const r = await prof.from('memory_agents_turmas')
      .insert({ name: 'Turma Struct', code: `ST-${ts}`, professor_id: profId })
      .select().single();
    turmaId = r.data?.id;
    return r;
  });
  await check('turmas: aluno NÃO cria turma (RLS)', 'fail',
    () => aluno.from('memory_agents_turmas').insert({ name: 'X', code: `AL-${ts}`, professor_id: alunoId }));
  await check('turmas: professor NÃO cria turma em nome de outro', 'fail',
    () => prof.from('memory_agents_turmas').insert({ name: 'X', code: `IN-${ts}`, professor_id: alunoId }));
  await check('turmas: professor atualiza própria turma', 'ok',
    () => prof.from('memory_agents_turmas').update({ name: 'Turma Struct 2' }).eq('id', turmaId).select());
  await check('turmas: aluno NÃO atualiza turma do professor (0 linhas)', 'ok', async () => {
    const r = await aluno.from('memory_agents_turmas').update({ name: 'hack' }).eq('id', turmaId).select();
    if (r.error) return r;
    return { error: (r.data?.length ?? 0) > 0 ? { message: 'atualizou turma alheia!' } : null };
  });
  await check('turmas: aluno vê turma (select autenticado)', 'ok',
    () => aluno.from('memory_agents_turmas').select('id').eq('id', turmaId).single());

  // ── TURMA_ALUNOS ─────────────────────────────────────────
  await check('turma_alunos: aluno entra na turma', 'ok',
    () => aluno.from('memory_agents_turma_alunos').insert({ turma_id: turmaId, aluno_id: alunoId }));
  await check('turma_alunos: aluno NÃO insere outro aluno', 'fail',
    () => aluno.from('memory_agents_turma_alunos').insert({ turma_id: turmaId, aluno_id: profId }));

  // ── GAMES + CARDS + AI_CONFIGS ───────────────────────────
  let gameId;
  await check('games: professor cria jogo', 'ok', async () => {
    const r = await prof.from('memory_agents_games')
      .insert({ title: 'Jogo Struct', description: 'teste', author_id: profId, card_count: 4 })
      .select().single();
    gameId = r.data?.id;
    return r;
  });
  await check('games: aluno NÃO cria jogo (RLS)', 'fail',
    () => aluno.from('memory_agents_games').insert({ title: 'X', author_id: alunoId }));
  await check('games: aluno vê jogo publicado', 'ok',
    () => aluno.from('memory_agents_games').select('id').eq('id', gameId).single());
  await check('cards: professor insere cartas do próprio jogo', 'ok',
    () => prof.from('memory_agents_cards').insert([
      { game_id: gameId, pair_index: 0, item1_type: 'text', item1_content: 'a', item2_type: 'text', item2_content: 'b' },
      { game_id: gameId, pair_index: 1, item1_type: 'text', item1_content: 'c', item2_type: 'text', item2_content: 'd' },
    ]));
  await check('cards: aluno NÃO insere cartas em jogo alheio', 'fail',
    () => aluno.from('memory_agents_cards').insert({ game_id: gameId, pair_index: 9, item1_type: 'text', item1_content: 'x', item2_type: 'text', item2_content: 'y' }));
  await check('ai_configs: professor configura IA do próprio jogo', 'ok',
    () => prof.from('memory_agents_ai_configs').insert({ game_id: gameId, ai_type: 'heuristic' }));
  await check('ai_configs: aluno NÃO configura IA de jogo alheio', 'fail',
    () => aluno.from('memory_agents_ai_configs').insert({ game_id: gameId, ai_type: 'random' }));

  // ── TURMA_GAMES ──────────────────────────────────────────
  await check('turma_games: professor vincula jogo à turma', 'ok',
    () => prof.from('memory_agents_turma_games').insert({ turma_id: turmaId, game_id: gameId }));
  await check('turma_games: aluno NÃO vincula jogos', 'fail',
    () => aluno.from('memory_agents_turma_games').insert({ turma_id: turmaId, game_id: gameId }));

  // ── MATCHES + STATISTICS (triggers) ──────────────────────
  let matchId;
  await check('matches: aluno registra própria partida', 'ok', async () => {
    const r = await aluno.from('memory_agents_matches')
      .insert({
        game_id: gameId, player_id: alunoId, turma_id: turmaId,
        player_score: 80, ai_score: 20, total_time_seconds: 30,
        ai_difficulty: 'medium', winner: 'player', completed: true,
      })
      .select().single();
    matchId = r.data?.id;
    return r;
  });
  await check('matches: aluno NÃO registra partida de outro', 'fail',
    () => aluno.from('memory_agents_matches').insert({ game_id: gameId, player_id: profId, completed: false }));
  await check('matches: professor vê partidas do próprio jogo', 'ok',
    () => prof.from('memory_agents_matches').select('id').eq('id', matchId).single());
  await check('matches: aluno atualiza própria partida', 'ok',
    () => aluno.from('memory_agents_matches').update({ player_score: 90 }).eq('id', matchId).select());
  await new Promise(r => setTimeout(r, 800)); // triggers de estatísticas/plays
  await check('statistics: trigger criou estatísticas do aluno', 'ok',
    () => aluno.from('memory_agents_statistics').select('*').eq('player_id', alunoId).single());
  await check('statistics: aluno NÃO lê estatísticas de outro', 'fail',
    () => aluno.from('memory_agents_statistics').select('*').eq('player_id', profId).single());
  await check('games: trigger incrementou plays', 'ok', async () => {
    const r = await prof.from('memory_agents_games').select('plays').eq('id', gameId).single();
    return { error: (r.data?.plays ?? 0) >= 1 ? null : { message: `plays=${r.data?.plays}` } };
  });

  // ── AUTO-HEAL de perfil (caminho do AuthContext) ─────────
  const healEmail = `struct_heal_${ts}@test.com`;
  const { data: hu } = await svc.auth.admin.createUser({
    email: healEmail, password: 'testpassword123',
    email_confirm: true, user_metadata: { name: 'Heal User', role: 'professor' },
  });
  const heal = createClient(url, anon);
  await heal.auth.signInWithPassword({ email: healEmail, password: 'testpassword123' });
  await svc.from('memory_agents_profiles').delete().eq('id', hu.user.id); // simula conta sem perfil
  await check('auto-heal: select retorna vazio sem perfil', 'fail',
    () => heal.from('memory_agents_profiles').select('*').eq('id', hu.user.id).single());
  await check('auto-heal: insert do próprio perfil (profiles_insert_own)', 'ok',
    () => heal.from('memory_agents_profiles').insert({ id: hu.user.id, name: 'Heal User', email: healEmail, role: 'professor' }).select().single());
  await check('auto-heal: professor com perfil reparado cria turma', 'ok',
    () => heal.from('memory_agents_turmas').insert({ name: 'Turma Heal', code: `HL-${ts}`, professor_id: hu.user.id }).select().single());

  // ── DELETE ───────────────────────────────────────────────
  await check('turmas: aluno NÃO deleta turma do professor (0 linhas)', 'ok', async () => {
    const r = await aluno.from('memory_agents_turmas').delete().eq('id', turmaId).select();
    if (r.error) return r;
    return { error: (r.data?.length ?? 0) > 0 ? { message: 'apagou turma alheia!' } : null };
  });
  await check('turmas: professor deleta própria turma', 'ok',
    () => prof.from('memory_agents_turmas').delete().eq('id', turmaId).select());
  await check('games: professor deleta próprio jogo', 'ok',
    () => prof.from('memory_agents_games').delete().eq('id', gameId).select());

  // ── Resultado ────────────────────────────────────────────
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verificações OK`);
  if (failed.length) {
    console.log('FALHAS:');
    failed.forEach(f => console.log(' - ' + f.label));
  }

  // ── Cleanup ──────────────────────────────────────────────
  for (const id of [profId, alunoId, hu.user.id]) {
    const { error } = await svc.auth.admin.deleteUser(id);
    if (error) console.warn('cleanup', id, error.message);
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });
