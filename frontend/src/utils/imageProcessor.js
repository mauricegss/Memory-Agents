/**
 * Comprime e redimensiona uma imagem mantendo a proporção.
 * @param {File} file Arquivo de imagem original
 * @param {number} maxSize Tamanho máximo da maior dimensão em pixels (largura ou altura)
 * @param {number} quality Qualidade de saída do JPEG (0 a 1)
 * @returns {Promise<Blob>} Blob da imagem resultante
 */
export const compressImage = (file, maxSize = 512, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // Apenas comprimir se for arquivo válido e for imagem
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Formato de arquivo inválido.'));
      return;
    }

    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular a nova proporção caso estoure o limite máximo
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Pintar fundo branco para caso seja PNG transparente e estejamos exportando para JPEG
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erro ao converter canvas em blob.'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};
