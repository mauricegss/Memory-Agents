/* global process */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- TESTE END-TO-END SUPABASE ---');
  
  const timestamp = Date.now();
  const profEmail = `prof_${timestamp}@test.com`;
  const alunoEmail = `aluno_${timestamp}@test.com`;
  const password = 'testpassword123';

  // 1. Criar Professor
  console.log(`\nCriando Professor (${profEmail})...`);
  const { data: profAuth, error: profErr } = await supabase.auth.signUp({
    email: profEmail,
    password,
    options: {
      data: { name: 'Professor Teste', role: 'professor' }
    }
  });
  if (profErr) { console.error('Erro prof auth:', profErr); return; }
  
  await new Promise(r => setTimeout(r, 1000)); // Esperar trigger rodar
  
  const { data: profProfile } = await supabase
    .from('memory_agents_profiles')
    .select('*')
    .eq('id', profAuth.user.id)
    .single();
  console.log('-> Perfil Professor:', profProfile);

  // 2. Criar Aluno
  console.log(`\nCriando Aluno (${alunoEmail})...`);
  const { data: alunoAuth, error: alunoErr } = await supabase.auth.signUp({
    email: alunoEmail,
    password,
    options: {
      data: { name: 'Aluno Teste', role: 'aluno' }
    }
  });
  if (alunoErr) { console.error('Erro aluno auth:', alunoErr); return; }

  await new Promise(r => setTimeout(r, 1000)); // Esperar trigger rodar

  const { data: alunoProfile } = await supabase
    .from('memory_agents_profiles')
    .select('*')
    .eq('id', alunoAuth.user.id)
    .single();
  console.log('-> Perfil Aluno:', alunoProfile);

  // 3. Login como Professor
  console.log('\nLogin Professor...');
  await supabase.auth.signInWithPassword({ email: profEmail, password });
  
  // 4. Criar Jogo e Turma
  console.log('Professor criando um Jogo...');
  const { data: game, error: gameErr } = await supabase
    .from('memory_agents_games')
    .insert({
      title: 'Jogo Teste Automatizado',
      description: 'Jogo gerado via script',
      author_id: profAuth.user.id,
      card_count: 16
    })
    .select()
    .single();
  
  if (gameErr) console.error('Erro ao criar jogo:', gameErr);
  else console.log('-> Jogo criado:', game.id);

  console.log('Professor criando uma Turma...');
  const { data: turma, error: turmaErr } = await supabase
    .from('memory_agents_turmas')
    .insert({
      name: 'Turma de Teste',
      code: `CODE-${timestamp}`,
      professor_id: profAuth.user.id
    })
    .select()
    .single();
  if (turmaErr) console.error('Erro ao criar turma:', turmaErr);
  else console.log('-> Turma criada:', turma.id);

  // 5. Login como Aluno
  console.log('\nLogin Aluno...');
  await supabase.auth.signInWithPassword({ email: alunoEmail, password });

  // 6. Aluno entra na Turma
  console.log('Aluno entrando na Turma...');
  const { error: relErr } = await supabase
    .from('memory_agents_turma_alunos')
    .insert({
      turma_id: turma.id,
      aluno_id: alunoAuth.user.id
    })
    .select()
    .single();
  if (relErr) console.error('Erro ao entrar na turma:', relErr);
  else console.log('-> Aluno entrou na turma com sucesso!');

  // 7. Aluno tenta ver o jogo criado
  const { data: fetchGame, error: fetchGameErr } = await supabase
    .from('memory_agents_games')
    .select('*')
    .eq('id', game.id)
    .single();
  
  if (fetchGameErr) console.error('Aluno falhou ao buscar jogo:', fetchGameErr);
  else console.log('-> Aluno conseguiu ler o jogo!', fetchGame.title);

  // 8. Aluno cria uma partida (match)
  console.log('Aluno finalizando uma partida...');
  const { data: match, error: matchErr } = await supabase
    .from('memory_agents_matches')
    .insert({
      game_id: game.id,
      player_id: alunoAuth.user.id,
      turma_id: turma.id,
      player_score: 100,
      total_time_seconds: 45,
      completed: true,
      winner: 'player'
    })
    .select()
    .single();
    
  if (matchErr) console.error('Erro ao registrar partida:', matchErr);
  else console.log('-> Partida registrada com sucesso:', match.id);

  // 9. Checar estatísticas geradas via Trigger
  console.log('\nChecando estatísticas (verificando Triggers)...');
  await new Promise(r => setTimeout(r, 500)); // Aguardar trigger finalizar
  const { data: stats } = await supabase
    .from('memory_agents_statistics')
    .select('*')
    .eq('player_id', alunoAuth.user.id)
    .single();
    
  console.log('-> Estatísticas geradas:', stats);

  const { data: gameUpdated } = await supabase
    .from('memory_agents_games')
    .select('plays')
    .eq('id', game.id)
    .single();
  console.log('-> Plays no jogo (deve ser 1):', gameUpdated.plays);

  console.log('\n--- FIM DO TESTE ---');
}

run();
