export function isImageFile(file) {
  return !!file && String(file.type || '').toLowerCase().startsWith('image/');
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao carregar imagem para conversao.'));
    };

    image.src = objectUrl;
  });
}

export async function convertImageToWebp(file, { quality = 0.9 } = {}) {
  if (!isImageFile(file)) {
    throw new Error('Arquivo de imagem invalido.');
  }

  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Falha ao preparar canvas para conversao.');
  }

  context.drawImage(image, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Falha ao gerar arquivo WebP.'));
    }, 'image/webp', quality);
  });

  const originalName = String(file.name || 'imagem').replace(/\.[^.]+$/, '');
  return new File([blob], `${originalName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}
