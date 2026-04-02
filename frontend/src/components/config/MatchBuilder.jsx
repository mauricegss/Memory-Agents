import React, { useRef, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, UploadCloud, Type } from 'lucide-react';
import { compressImage } from '../../utils/imageProcessor';

export const MatchBuilder = ({ matchType, pairs, setPairs }) => {
  const [draggedItem, setDraggedItem] = useState(null);

  // Helper para gerar IDs únicos locais
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Upload em massa inteligente com preenchimento de slots
  const handleBulkImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Processar todas as imagens em blobs/urls primeiro
    const processedImages = [];
    for (const file of files) {
      try {
        const compressedBlob = await compressImage(file, 512, 0.85);
        const url = URL.createObjectURL(compressedBlob);
        processedImages.push(url);
      } catch (err) {
        console.error("Erro ao comprimir imagem bulk:", err);
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
  };

  // Upload para um slot específico de um par com Compressão
  const handleSingleSlotUpload = async (pairId, slotIndex, file) => {
    if (!file) return;
    try {
      const compressedBlob = await compressImage(file, 512, 0.85);
      const url = URL.createObjectURL(compressedBlob);
      const updated = pairs.map(p => {
        if (p.id === pairId) {
          if (slotIndex === 1) return { ...p, item1: { type: 'image', content: url } };
          if (slotIndex === 2) return { ...p, item2: { type: 'image', content: url } };
        }
        return p;
      });
      setPairs(updated);
    } catch (err) {
      console.error("Erro ao comprimir imagem única:", err);
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
    // Define os dados de transferência para compatibilidade
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

    // Se dropou no mesmo lugar, ignora
    if (sourcePairId === targetPairId && sourceSlotIndex === targetSlotIndex) {
      setDraggedItem(null);
      return;
    }

    const defaultType1 = matchType.startsWith('image') ? 'image' : 'text';
    const defaultType2 = matchType.endsWith('text') || matchType === 'text_text' ? 'text' : 'image';
    
    // Validar se o tipo pode ir para o slot
    const isValidType = (itemType, tSlot) => {
      if (itemType === 'empty') return true;
      const expectedType = tSlot === 1 ? defaultType1 : defaultType2;
      return itemType === expectedType;
    };

    // Criar cópia profunda do array de pares
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

      // Swap validation
      if (!isValidType(itemSource.type, targetSlotIndex) || !isValidType(itemTarget.type, sourceSlotIndex)) {
        alert('Troca inválida: este slot não permite esse formato.');
        setDraggedItem(null);
        return;
      }

      // Swap
      if (sourceSlotIndex === 1) pSource.item1 = itemTarget; 
      else pSource.item2 = itemTarget;

      if (targetSlotIndex === 1) pTarget.item1 = itemSource; 
      else pTarget.item2 = itemSource;
    }

    setPairs(updated);
    setDraggedItem(null);
  };

  // Renderizadores de Slots (Inputs ou Dropzones)
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
       return <div className="flex-1 flex items-center justify-center p-4 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl relative overflow-hidden group aspect-square">
         <img src={pair.item1.content} alt="Cópia" className="absolute inset-0 w-full h-full object-contain p-2 opacity-50 grayscale" />
         <div className="z-10 bg-slate-900/80 px-3 py-1 rounded-lg text-xs font-bold text-slate-300 backdrop-blur-sm shadow-black">Cópia Automática</div>
       </div>;
    }

    if (isText) {
      return (
        <div 
          className={`flex-1 flex flex-col gap-2 relative transition-all ${isDraggingThis ? 'opacity-50 scale-95 border-indigo-500' : ''} aspect-square`}
          {...dragHandlers}
        >
           <textarea 
             placeholder="Digite o texto da carta..."
             value={item.content}
             onChange={(e) => handleTextChange(pair.id, slotIndex, e.target.value)}
             className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 resize-none h-full min-h-[120px] cursor-text"
           />
           <div className="absolute top-2 right-2 text-slate-600 cursor-grab hover:text-indigo-400 p-1" title="Arraste para trocar">
             <Type size={16} />
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
          <label className={`block w-full h-full bg-slate-900 border-2 border-dashed ${item.content ? 'border-slate-700' : 'border-indigo-500 hover:bg-slate-800'} rounded-xl cursor-pointer relative overflow-hidden group transition-all`}>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleSingleSlotUpload(pair.id, slotIndex, e.target.files[0])}
            />
            {item.content ? (
              <>
                <img src={item.content} alt="Upload" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <p className="text-white font-bold text-sm bg-black/40 px-3 py-1 rounded-full cursor-pointer">Re-enviar</p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <ImageIcon size={28} className="mb-2 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-slate-400">Arraste algo p/ cá</span>
              </div>
            )}
          </label>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Zona de Upload em Massa para modos de imagem */}
      {matchType.includes('image') && (
        <div className="bg-indigo-900/10 border border-indigo-900/30 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2"><UploadCloud size={20} className="text-indigo-400" /> Upload Rápido de Imagens</h3>
              <p className="text-slate-400 text-sm mt-1">Gere quadrados automaticamente. Depois **clique e arraste** para trocar imagens entre os blocos!</p>
            </div>
            <label className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-500 transition-all cursor-pointer whitespace-nowrap">
              Selecionar Imagens
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleBulkImageUpload} />
            </label>
          </div>
        </div>
      )}

      {/* Título e Contador dinâmico */}
      <div className="flex items-center justify-between">
         <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
           Pares do Jogo
           <span className="bg-slate-800 text-indigo-400 px-3 py-1 rounded-full text-sm border border-slate-700">
             {pairs.length} {pairs.length === 1 ? 'Par' : 'Pares'} ({pairs.length * 2} Cartas)
           </span>
         </h3>
         <button 
           type="button"
           onClick={addEmptyPair}
           className="text-slate-400 hover:text-indigo-400 font-bold text-sm flex items-center gap-1 transition-colors"
         >
           <Plus size={16} /> Adicionar Par Vazio
         </button>
      </div>

      {/* Grid de Pares */}
      {pairs.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
           <p className="text-slate-500 font-medium">Nenhum par criado ainda. Faça upload ou clique em "Adicionar Par Vazio".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pairs.map((pair, index) => (
            <div key={pair.id} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex gap-3 group/pair relative animate-fadeIn">
              {/* Botão de excluir */}
              <button 
                type="button" 
                onClick={() => removePair(pair.id)}
                className="absolute -top-3 -right-3 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover/pair:opacity-100 transition-all shadow-md z-20"
                title="Remover Par"
              >
                <Trash2 size={14} />
              </button>

              {/* Slot 1 */}
              {renderSlot(pair, 1)}
              
              {/* Elo de ligação */}
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 z-10 shadow-sm">
                  <span className="text-slate-500 text-sm font-black flex items-center justify-center">=</span>
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
