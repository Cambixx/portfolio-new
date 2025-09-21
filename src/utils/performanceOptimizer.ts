// Utilidades para optimización de rendimiento sin afectar GSAP

// Función para debounce
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
};

// Función para throttle
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

import React from 'react';

// Hook para lazy loading de imágenes con intersection observer
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isIntersecting;
};

// Función para preload de recursos críticos
export const preloadCriticalResources = () => {
  // Preload de fuentes críticas
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);

  // Preload de modelos 3D críticos
  const modelLink = document.createElement('link');
  modelLink.rel = 'preload';
  modelLink.href = '/models/carlos-3.glb';
  modelLink.as = 'fetch';
  modelLink.crossOrigin = 'anonymous';
  document.head.appendChild(modelLink);
};

// Función para optimizar imágenes con lazy loading
export const createOptimizedImage = (src: string, alt: string, className?: string) => {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = className || '';
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
};

// Función para detectar dispositivos de bajo rendimiento
export const isLowEndDevice = (): boolean => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return true;
  
  try {
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      // Detectar GPUs integradas o de bajo rendimiento
      return /intel|integrated|mali|adreno 3|powervr/i.test(renderer);
    }
  } catch (e) {
    // Si hay error, asumir dispositivo de bajo rendimiento
    return true;
  }
  
  // Fallback: detectar por memoria
  const memory = (navigator as any).deviceMemory;
  return memory && memory <= 2;
};

// Función para ajustar calidad según el dispositivo
export const getOptimalQuality = (): 'high' | 'medium' | 'low' => {
  if (isLowEndDevice()) return 'low';
  if (window.innerWidth < 768) return 'medium';
  return 'high';
};
