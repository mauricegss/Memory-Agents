import React, { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, UploadCloud, Type } from 'lucide-react';
import { compressImage } from '../../utils/imageProcessor';
import { uploadFileToStorage } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const MatchBuilder = ({ matchType, pairs, setPairs }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { showWarning, showError } = useToast();

  // Helper para gerar IDs únicos locais
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Upload em massa inteligente com preenchimento de slots
  const handleBulkImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !user) return;
    setIsUploading(true);

    const processedImages = [];
    for (const file of files) {
      try {
        const compressedBlob = await compressImage(file, 512, 0.85);
        const url = await uploadFileToStorage(compressedBlob, 'memory-agents-images', user.id);
        processedImages.push(url);
      } catch (err) {
        console.error("Erro ao fazer upload da imagem bulk:", err);
      }
    }

    let updatedPairs = [...pairs.map(p => ({ ...p, item1: { ...p.item1 }, item2: { ...p.item2 } }))];
    
    const defaultType1 = matchType.startsWith('image') ? 'image' : 'text';
    const defaultType2 = matchType.endsWith('text') || matchType === 'text_text' ? 'text' : 'image';

    for (const url of processedImages) {
      let placed = false;

      // Tratamento especial para image_image_same (preenche ambos os slots juntos)
      if (matchType === 'image_image_same') {
        const targetPair = updatedPairs.find(p => (p.item1.type === 'image' || p.item1.type === 'empty') && !p.item1.content);
        if (targetPair) {
          targetPair.item1 = { type: 'image', content: url };
          targetPair.item2 = { type: 'image', content: url };
          placed = true;
        }
      } else {
        // Preenche sequencialmente os slots de imagens vazios
        for (const pair of updatedPairs) {
          if (!placed && (pair.item1.type === 'image' || pair.item1.type === 'empty') && !pair.item1.content && defaultType1 === 'image') {
            pair.item1 = { type: 'image', content: url };
            placed = true;
          }
          if (!placed && (pair.item2.type === 'image' || pair.item2.type === 'empty') && !pair.item2.content && defaultType2 === 'image') {
            pair.item2 = { type: 'image', content: url };
            placed = true;
          }
        }
      }

      // Se não havia espaços vazios, cria um novo par estruturado
      if (!placed) {
        if (matchType === 'image_image_same') {
          updatedPairs.push({
            id: generateId(),
            item1: { type: 'image', content: url },
            item2: { type: 'image', content: url }
          });
        } else {
          updatedPairs.push({
            id: generateId(),
            item1: { type: defaultType1, content: defaultType1 === 'image' ? url : '' },
            item2: { type: defaultType2, content: defaultType1 !== 'image' && defaultType2 === 'image' ? url : '' }
          });
        }
      }
    }

    setPairs(updatedPairs);
    setIsUploading(false);
  };

  // Upload para um slot específico de um par com Compressão
  const handleSingleSlotUpload = async (pairId, slotIndex, file) => {
    if (!file || !user) return;
    try {
      setIsUploading(true);
      const compressedBlob = await compressImage(file, 512, 0.85);
      const url = await uploadFileToStorage(compressedBlob, 'memory-agents-images', user.id);
      const updated = pairs.map(p => {
        if (p.id === pairId) {
          if (slotIndex === 1) return { ...p, item1: { type: 'image', content: url } };
          if (slotIndex === 2) return { ...p, item2: { type: 'image', content: url } };
        }
        return p;
      });
      setPairs(updated);
    } catch (err) {
      console.error("Erro ao fazer upload de imagem única:", err);
      showError('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextChange = (pairId, slotIndex, text) => {
    const updated = pairs.map(p => {
      if (p.id === pairId) {
        if (slotIndex === 1) return { ...p, item1: { type: 'text', content: text } };
        if (slotIndex === 2) return { ...p, item2: { type: 'text', content: text } };
      }
      return p;
    });
    setPairs(updated);
  };

  const addEmptyPair = () => {
    const defaultType1 = matchType.startsWith('image') ? 'image' : 'text';
    const defaultType2 = matchType.endsWith('text') || matchType === 'text_text' ? 'text' : 'image';
    
    setPairs([...pairs, {
      id: generateId(),
      item1: { type: defaultType1, content: '' },
      item2: { type: defaultType2, content: '' }
    }]);
  };

  const removePair = (id) => {
    setPairs(pairs.filter(p => p.id !== id));
  };

  // --- DRAG AND DROP LÓGICA ---
  const handleDragStart = (e, pairId, slotIndex) => {
    setDraggedItem({ pairId, slotIndex });
    e.dataTransfer.setData('text/plain', `${pairId}|${slotIndex}`);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetPairId, targetSlotIndex) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { pairId: sourcePairId, slotIndex: sourceSlotIndex } = draggedItem;

    if (sourcePairId === targetPairId && sourceSlotIndex === targetSlotIndex) {
      setDraggedItem(null);
      return;
    }

    const defaultType1 = matchType.startsWith('image') ? 'image' : 'text';
    const defaultType2 = matchType.endsWith('text') || matchType === 'text_text' ? 'text' : 'image';
    
    const isValidType = (itemType, tSlot) => {
      if (itemType === 'empty') return true;
      const expectedType = tSlot === 1 ? defaultType1 : defaultType2;
      return itemType === expectedType;
    };

    const updated = pairs.map(p => ({
      ...p,
      item1: { ...p.item1 },
      item2: { ...p.item2 }
    }));

    const pSource = updated.find(p => p.id === sourcePairId);
    const pTarget = updated.find(p => p.id === targetPairId);

    if (pSource && pTarget) {
      const itemSource = sourceSlotIndex === 1 ? { ...pSource.item1 } : { ...pSource.item2 };
      const itemTarget = targetSlotIndex === 1 ? { ...pTarget.item1 } : { ...pTarget.item2 };

      if (!isValidType(itemSource.type, targetSlotIndex) || !isValidType(itemTarget.type, sourceSlotIndex)) {
        showWarning('Troca inválida: este slot não permite esse formato.');
        setDraggedItem(null);
        return;
      }

      if (sourceSlotIndex === 1) pSource.item1 = itemTarget; 
      else pSource.item2 = itemTarget;

      if (targetSlotIndex === 1) pTarget.item1 = itemSource; 
      else pTarget.item2 = itemSource;
    }

    setPairs(updated);
    setDraggedItem(null);
  };

  // Renderizadores de Slots
  const renderSlot = (pair, slotIndex) => {
    const item = slotIndex === 1 ? pair.item1 : pair.item2;
    const isImage = item.type === 'image' || (item.type === 'empty' && matchType.includes('image'));
    const isText = item.type === 'text' || (item.type === 'empty' && matchType.includes('text'));

    const isDraggingThis = draggedItem?.pairId === pair.id && draggedItem?.slotIndex === slotIndex;

    const dragHandlers = {
      draggable: true,
      onDragStart: (e) => handleDragStart(e, pair.id, slotIndex),
      onDragOver: handleDragOver,
      onDrop: (e) => handleDrop(e, pair.id, slotIndex)
    };

    if (matchType === 'image_image_same' && slotIndex === 2) {
       return (
         <div className="flex-1 flex items-center justify-center p-3 bg-blue-50/60 border-2 border-dashed border-blue-200 rounded-2xl relative overflow-hidden group aspect-square">
           {pair.item1.content ? (
             <img src={pair.item1.content} alt="Cópia" className="absolute inset-0 w-full h-full object-contain p-2 opacity-60" />
           ) : null}
           <div className="z-10 bg-white/90 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-black text-blue-700 shadow-xs backdrop-blur-xs">
             Cópia Automática
           </div>
         </div>
       );
    }

    if (isText) {
      return (
        <div 
          className={`flex-1 flex flex-col gap-2 relative transition-all ${isDraggingThis ? 'opacity-50 scale-95 border-blue-500' : ''} aspect-square`}
          {...dragHandlers}
        >
           <textarea 
             placeholder="Texto da carta..."
             value={item.content}
             onChange={(e) => handleTextChange(pair.id, slotIndex, e.target.value)}
             className="w-full bg-white border-2 border-blue-200 rounded-2xl p-3 text-slate-700 font-bold focus:bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 resize-none h-full min-h-[100px] text-xs sm:text-sm cursor-text shadow-xs"
           />
           <div className="absolute top-2 right-2 text-slate-400 cursor-grab hover:text-blue-600 p-1" title="Arraste para trocar">
             <Type size={14} />
           </div>
        </div>
      );
    }

    if (isImage || item.type === 'empty') {
      return (
        <div 
          className={`flex-1 aspect-square transition-all ${isDraggingThis ? 'opacity-50 scale-95' : ''}`}
          {...dragHandlers}
        >
          <label className={`block w-full h-full bg-white border-2 border-dashed ${item.content ? 'border-blue-300' : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/50'} rounded-2xl cursor-pointer relative overflow-hidden group transition-all shadow-xs`}>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleSingleSlotUpload(pair.id, slotIndex, e.target.files[0])}
            />
            {item.content ? (
              <>
                <img src={item.content} alt="Upload" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <p className="text-white font-black text-xs bg-black/60 px-2.5 py-1 rounded-xl">Alterar Imagem</p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                <ImageIcon size={24} className="mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-500 leading-tight">Clique ou solte</span>
              </div>
            )}
          </label>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-5">
      {/* Zona de Upload em Massa para modos de imagem */}
      {matchType.includes('image') && (
        <div className="bg-blue-50/80 border border-blue-200 p-4 sm:p-5 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <UploadCloud size={18} className="text-blue-600" /> Upload Rápido de Imagens
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Envie múltiplas imagens de uma vez para preencher os pares automaticamente.</p>
            </div>
            <label className={`btn-primary py-2 px-4 text-xs font-black shrink-0 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              {isUploading ? 'Enviando...' : 'Selecionar Imagens'}
              <input type="file" multiple accept="image/*" className="hidden" disabled={isUploading} onChange={handleBulkImageUpload} />
            </label>
          </div>
        </div>
      )}

      {/* Título e Ação Adicionar Par */}
      <div className="flex items-center justify-between">
         <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
           Cartas do Jogo
           <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-black border border-blue-200">
             {pairs.length} {pairs.length === 1 ? 'Par' : 'Pares'} ({pairs.length * 2} Cartas)
           </span>
         </h3>
         <button 
           type="button"
           onClick={addEmptyPair}
           className="text-blue-600 hover:text-blue-700 font-black text-xs flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors border border-blue-200"
         >
           <Plus size={14} /> Adicionar Par Vazio
         </button>
      </div>

      {/* Grid de Pares */}
      {pairs.length === 0 ? (
        <div className="text-center py-10 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-3xl">
           <p className="text-slate-400 font-bold text-xs">Nenhum par criado ainda. Faça upload de imagens ou clique em "Adicionar Par Vazio".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {pairs.map((pair) => (
            <div key={pair.id} className="bg-white border-2 border-blue-100 p-3.5 rounded-2xl flex gap-2.5 group/pair relative shadow-xs hover:border-blue-300 transition-all">
              {/* Botão de excluir */}
              <button 
                type="button" 
                onClick={() => removePair(pair.id)}
                className="absolute -top-2.5 -right-2.5 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-sm z-20 transition-transform cursor-pointer"
                title="Remover Par"
              >
                <Trash2 size={13} />
              </button>

              {/* Slot 1 */}
              {renderSlot(pair, 1)}
              
              {/* Elo de ligação */}
              <div className="flex flex-col items-center justify-center pointer-events-none px-0.5">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200 z-10 shadow-xs">
                  <span className="text-blue-600 text-xs font-black">=</span>
                </div>
              </div>

              {/* Slot 2 */}
              {renderSlot(pair, 2)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
