import { useEffect, useState } from 'react';

// Hook para asegurar que GSAP esté listo antes de ejecutar animaciones
export const useGSAPReady = (dependencies: any[] = []) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Pequeño delay para asegurar que el DOM esté completamente renderizado
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, dependencies);

  return isReady;
};

// Hook para animaciones GSAP con retry automático
export const useGSAPAnimation = (animationFn: () => void, dependencies: any[] = []) => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const executeAnimation = () => {
      try {
        animationFn();
      } catch (error) {
        console.warn('GSAP animation failed, retrying...', error);
        if (retryCount < maxRetries) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 200 * (retryCount + 1));
        }
      }
    };

    // Delay para asegurar que los elementos estén en el DOM
    const timer = setTimeout(executeAnimation, 150);

    return () => clearTimeout(timer);
  }, [...dependencies, retryCount]);

  return { retryCount };
};
