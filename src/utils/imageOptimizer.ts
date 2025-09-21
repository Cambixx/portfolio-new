import React, { useState, useEffect } from 'react';

// Utilidad para optimización de imágenes
export const optimizeImage = (src: string, _width?: number, _quality: number = 80): string => {
  // Si es una imagen local, mantenerla como está por ahora
  // En producción, podrías usar un servicio como Cloudinary o ImageKit
  if (src.startsWith('/')) {
    return src;
  }
  
  // Para URLs externas, podrías agregar parámetros de optimización
  return src;
};

// Hook para lazy loading de imágenes
export const useImagePreload = (src: string) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  return { loaded, error };
};

// Componente de imagen optimizada
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  quality = 80 
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
}) => {
  const { loaded, error } = useImagePreload(src);
  const optimizedSrc = optimizeImage(src, width, quality);

  if (error) {
    return React.createElement('div', { className: `image-error ${className}` }, 'Error cargando imagen');
  }

  return React.createElement('div', { className: `image-container ${className}` },
    !loaded && React.createElement('div', { className: 'image-placeholder' }, 'Cargando...'),
    React.createElement('img', {
      src: optimizedSrc,
      alt: alt,
      width: width,
      height: height,
      style: { opacity: loaded ? 1 : 0 },
      loading: 'lazy',
      decoding: 'async'
    })
  );
};
