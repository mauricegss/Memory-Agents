import React, { useState } from 'react';
import { Zap, Type, Image as ImageIcon, PlaySquare, BoxSelect, Copy, Columns, ImageMinus, AlertCircle, CheckCircle2, UploadCloud, Loader2, Trash2 } from 'lucide-react';
import { MatchBuilder } from './config/MatchBuilder';
import { compressImage } from '../utils/imageProcessor';
import { uploadFileToStorage } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const MIN_PAIRS = 4;
const MAX_PAIRS = 30;

const ConfigForm = ({ onSubmit, initialData = null, submitLabel = 'Finalizar e Gerar Jogo' }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [title,      setTitle]      = useState(initialData?.title || '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'medium');
  const [gameType]                  = useState('memory_game');
  const [matchType,  setMatchType]  = useState(initialData?.matchType || 'image_image_same');
  const [pairs,      setPairs]      = useState(initialData?.pairs || []);
  const [submitError, setSubmitError] = useState('');
  const [coverUrl,     setCoverUrl]     = useState(initialData?.thumbnailUrl || null);
  const [coverUploading, setCoverUploading] = useState(false);

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    setCoverUploading(true);
    try {
      const blob = await compressImage(file, 768, 0.85);
      const url = await uploadFileToStorage(blob, 'memory-agents-thumbnails', user.id);
      setCoverUrl(url);
      showSuccess('Imagem de capa enviada com sucesso!');
    } catch (err) {
      console.error('[ConfigForm] Erro no upload da capa:', err);
      showError('Não foi possível enviar a imagem: ' + (err.message || 'erro desconhecido'));
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!title.trim()) {
      setSubmitError('Dê um título ao seu jogo antes de continuar.');
      return;
    }
    if (pairs.length < MIN_PAIRS) {
      setSubmitError(`Adicione pelo menos ${MIN_PAIRS} pares para criar um jogo. (Atual: ${pairs.length})`);
      return;
    }
    if (pairs.length > MAX_PAIRS) {
      setSubmitError(`O máximo é ${MAX_PAIRS} pares (${MAX_PAIRS * 2} cartas). Remova alguns pares.`);
      return;
    }

    onSubmit({ title, gameType, matchType, difficulty, pairs, cardCount: pairs.length * 2, thumbnailUrl: coverUrl });
  };

  const handleMatchTypeChange = (newType) => {
    setMatchType(newType);
    const defaultType1 = newType.startsWith('image') ? 'image' : 'text';
    const defaultType2 = newType.endsWith('text') || newType === 'text_text' ? 'text' : 'image';
    setPairs(prevPairs => prevPairs.map(p => ({
      ...p,
      item1: { type: defaultType1, content: '' },
      item2: { type: defaultType2, content: '' }
    })));
  };

  /* ─── Status visual dos pares ─── */
  const pairStatus = () => {
    if (pairs.length === 0) return null;
    if (pairs.length < MIN_PAIRS) return 'too-few';
    if (pairs.length > MAX_PAIRS) return 'too-many';
    return 'ok';
  };
  const status = pairStatus();

  const pairBarPct  = Math.min((pairs.length / MAX_PAIRS) * 100, 100);
  const pairBarColor = status === 'ok' ? 'bg-blue-500' : status === 'too-many' ? 'bg-red-500' : 'bg-amber-400';

  return (
    <form className="p-6 space-y-8" onSubmit={handleSubmit}>

      {/* ─── Título ─── */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 font-black text-slate-700 text-sm uppercase tracking-wide">
          <Type size={18} className="text-blue-500" /> Título do Jogo
        </label>
        <input
          required
          type="text"
          placeholder="Ex: Animais da Fazenda 🐄"
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* ─── Imagem de Capa ─── */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 font-black text-slate-700 text-sm uppercase tracking-wide">
          <ImageIcon size={18} className="text-blue-500" /> Imagem de Capa
          <span className="text-[10px] font-bold text-slate-400 normal-case tracking-normal">(opcional)</span>
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="group relative w-full sm:w-48 aspect-[4/3] shrink-0 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center">
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} disabled={coverUploading} />
            {coverUploading ? (
              <div className="flex flex-col items-center gap-2 text-blue-500">
                <Loader2 size={26} className="animate-spin" />
                <span className="text-[11px] font-black">Enviando...</span>
              </div>
            ) : coverUrl ? (
              <>
                <img src={coverUrl} alt="Capa do jogo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black">
                  Alterar Imagem
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-blue-400 px-4 text-center">
                <UploadCloud size={28} />
                <span className="text-[11px] font-black leading-tight">Escolher imagem da capa</span>
              </div>
            )}
          </label>

          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              A capa aparece no lugar da letra na home e nos painéis. Sem imagem, usamos a inicial do título com a cor do jogo.
            </p>
            {coverUrl && (
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={13} /> Remover capa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Opções gerais ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-black text-slate-700 text-sm uppercase tracking-wide">
            <BoxSelect size={18} className="text-blue-400" /> Tipo de Jogo
          </label>
          <select
            className="input-field opacity-60 cursor-not-allowed"
            value={gameType}
            disabled
          >
            <option value="memory_game">🧠 Jogo da Memória</option>
          </select>
          <p className="text-xs text-slate-400">Apenas o Jogo da Memória está disponível.</p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 font-black text-slate-700 text-sm uppercase tracking-wide">
            <Zap size={18} className="text-amber-400" /> Nível de Dificuldade
          </label>
          <select
            className="input-field"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">😊 Fácil — Robô esquece mais</option>
            <option value="medium">🤔 Médio — Padrão</option>
            <option value="hard">😈 Difícil — Robô lembra mais</option>
          </select>
        </div>
      </div>

      {/* ─── Modo de correspondência ─── */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 font-black text-slate-700 text-sm uppercase tracking-wide">
          <Type size={18} className="text-emerald-500" /> Modo de Correspondência
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: 'image_image_same', icon: <Copy size={24}/>,      label: 'Img = Img',   sub: 'Mesma imagem' },
            { value: 'image_image_diff', icon: <Columns size={24}/>,   label: 'Img ≠ Img',   sub: 'Imagens diferentes' },
            { value: 'image_text',       icon: <ImageMinus size={24}/>, label: 'Img = Texto', sub: 'Ligar ao significado' },
            { value: 'text_text',        icon: <Type size={24}/>,       label: 'Txt = Txt',   sub: 'Conceito e definição' },
          ].map(opt => (
            <label
              key={opt.value}
              className={`cursor-pointer p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-all ${
                matchType === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-blue-100 text-slate-500 hover:bg-blue-50 bg-white'
              }`}
            >
              <input type="radio" name="matchType" value={opt.value}
                checked={matchType === opt.value}
                onChange={() => handleMatchTypeChange(opt.value)}
                className="hidden"
              />
              {opt.icon}
              <span className="font-black text-sm">{opt.label}</span>
              <span className="text-[10px] leading-tight text-current opacity-70">{opt.sub}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-blue-100" />

      {/* ─── Contador de pares ─── */}
      <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-black text-sm text-slate-600">
            Pares adicionados
          </span>
          <div className="flex items-center gap-2">
            {status === 'ok' && <CheckCircle2 size={16} className="text-emerald-500" />}
            {status === 'too-few' && <AlertCircle size={16} className="text-amber-500" />}
            {status === 'too-many' && <AlertCircle size={16} className="text-red-500" />}
            <span className={`font-black text-lg ${
              status === 'ok' ? 'text-blue-600' :
              status === 'too-many' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {pairs.length}
              <span className="text-sm font-bold text-slate-400"> / {MAX_PAIRS}</span>
            </span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${pairBarColor}`}
            style={{ width: `${pairBarPct}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-400 font-semibold">
          <span>Mínimo: {MIN_PAIRS} pares ({MIN_PAIRS * 2} cartas)</span>
          <span>Máximo: {MAX_PAIRS} pares ({MAX_PAIRS * 2} cartas)</span>
        </div>
      </div>

      {/* ─── Construtor de pares ─── */}
      <MatchBuilder
        matchType={matchType}
        pairs={pairs}
        setPairs={setPairs}
        maxPairs={MAX_PAIRS}
      />

      <hr className="border-blue-100" />

      {/* ─── Erro de submissão ─── */}
      {submitError && (
        <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700 font-bold text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          {submitError}
        </div>
      )}

      {/* ─── Submit ─── */}
      <button
        type="submit"
        className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
      >
        <PlaySquare size={22} />
        {submitLabel}
      </button>
    </form>
  );
};

export default ConfigForm;
