import { useRef, useEffect } from 'react';
import { useState } from 'react';
import '../styles/audio-visualizer.scss';

interface AudioVisualizerProps {
  // audioContext: AudioContext | null; // Eliminado
  // audioElement: HTMLAudioElement | null; // Eliminado
  isPlaying: boolean;
  analyser: AnalyserNode | null;
}

// Configuración del visualizador
const VISUALIZER_CONFIG = {
  // Configuración de las barras
  DESKTOP_BAR_COUNT: 50, // Número de barras para escritorio
  MOBILE_BAR_COUNT: 30, // Número de barras para móvil
  MIN_BAR_HEIGHT: 1, // Altura mínima de cada barra
  BAR_GAP: 0.5, // Espacio entre barras
  MIN_BAR_WIDTH: 4, // Ancho mínimo de cada barra
  DESKTOP_MAX_BAR_WIDTH: 200, // Ancho máximo de las barras en escritorio
  MOBILE_MAX_BAR_WIDTH: 70, // Ancho máximo de las barras en móvil
  BAR_WIDTH_SCALE: 0.9, // Factor de escala para el ancho máximo de las barras (0-1)
  SMOOTHING_FACTOR: 0.15, // Factor para suavizar el movimiento (0-1, más bajo es más suave)
  
  // Configuración de la distribución del espectro
  FREQUENCY_DISTRIBUTION: {
    DESKTOP: {
      POWER: 1.2, // Exponente para la distribución logarítmica
      RANGE: 0.6, // Rango del espectro de frecuencias a utilizar (0-1)
      OFFSET: 3, // Desplazamiento del índice de frecuencia
    },
    MOBILE: {
      POWER: 0.5, // Mayor exponente para una distribución más pronunciada en móvil
      RANGE: 0.5, // Rango más reducido para enfocarse en frecuencias más relevantes
      OFFSET: 2, // Menor desplazamiento para ajustarse al ancho reducido
    }
  },
  
  // Configuración del gradiente
  GRADIENT: {
    START_COLOR: 'rgba(161, 81, 241, 0)', // Color inicial (Púrpura)
    END_COLOR: 'rgba(255, 154, 158, 0.4)', // Color final (Rosa)
  },
};

export function AudioVisualizer({ /* audioContext, audioElement, */ isPlaying, analyser }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [barCount, setBarCount] = useState(VISUALIZER_CONFIG.DESKTOP_BAR_COUNT);
  const currentBarVisualDataRef = useRef<{ width: number }[]>([]); // Almacena los anchos suavizados

  // Efecto para manejar el cambio de barras según el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setBarCount(isMobile ? VISUALIZER_CONFIG.MOBILE_BAR_COUNT : VISUALIZER_CONFIG.DESKTOP_BAR_COUNT);
    };

    handleResize(); // Establecer valor inicial
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efecto para inicializar/reiniciar currentBarVisualDataRef cuando barCount cambia
  useEffect(() => {
    currentBarVisualDataRef.current = Array.from({ length: barCount }, () => ({ width: 0 }));
  }, [barCount]);
  
  // No necesitamos configurar el analizador aquí, ya lo recibimos como prop
  // Este useEffect puede usarse para inicializar o actualizar el canvas cuando cambian las dependencias
  // Lo eliminamos porque estaba vacío y no se usaba.

  // Iniciar o detener la animación según el estado de reproducción
  useEffect(() => {
    if (isPlaying && analyser) {
      startAnimation();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      
      // Limpiar el canvas cuando se detiene
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyser]);
  
  // Función para dibujar las barras del visualizador
  const drawVisualizer = () => {
    if (!analyser || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Ajustar el tamaño del canvas al tamaño actual del elemento
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Obtener datos de frecuencia
    analyser.getByteFrequencyData(dataArray);
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configuración para dibujar las barras horizontales
    const barHeight = Math.max(
      VISUALIZER_CONFIG.MIN_BAR_HEIGHT,
      (canvas.height / barCount) - VISUALIZER_CONFIG.BAR_GAP
    );
    
    // Dibujar cada barra horizontal
    for (let i = 0; i < barCount; i++) {
      // Distribución logarítmica para representar mejor el espectro de audio
      const isMobile = window.innerWidth <= 768;
      const freqConfig = isMobile ? VISUALIZER_CONFIG.FREQUENCY_DISTRIBUTION.MOBILE : VISUALIZER_CONFIG.FREQUENCY_DISTRIBUTION.DESKTOP;
      const index = Math.floor(
        Math.pow(i / barCount, freqConfig.POWER) *
        (bufferLength * freqConfig.RANGE) +
        freqConfig.OFFSET
      );
      const value = dataArray[index];
      
      // Ancho de la barra proporcional a la intensidad de la frecuencia
      const maxBarWidth = window.innerWidth <= 768 
        ? VISUALIZER_CONFIG.MOBILE_MAX_BAR_WIDTH 
        : VISUALIZER_CONFIG.DESKTOP_MAX_BAR_WIDTH;
      
      const targetBarWidth = Math.max(
        VISUALIZER_CONFIG.MIN_BAR_WIDTH,
        Math.min(
          maxBarWidth,
          (value / 255) * canvas.width * VISUALIZER_CONFIG.BAR_WIDTH_SCALE
        )
      );

      // Asegurarse de que la entrada existe en la referencia
      if (!currentBarVisualDataRef.current[i]) {
        currentBarVisualDataRef.current[i] = { width: 0 };
      }
      
      const previousBarWidth = currentBarVisualDataRef.current[i].width;
      const smoothedBarWidth = previousBarWidth + (targetBarWidth - previousBarWidth) * VISUALIZER_CONFIG.SMOOTHING_FACTOR;
      
      currentBarVisualDataRef.current[i].width = smoothedBarWidth;
      
      // Posición y de la barra
      const y = i * (barHeight + VISUALIZER_CONFIG.BAR_GAP);
      
      // Gradiente para las barras (ahora horizontal)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, VISUALIZER_CONFIG.GRADIENT.START_COLOR);
      gradient.addColorStop(1, VISUALIZER_CONFIG.GRADIENT.END_COLOR)
      
      ctx.fillStyle = gradient;
      // Dibujamos desde la derecha hacia la izquierda
      ctx.fillRect(canvas.width - smoothedBarWidth, y, smoothedBarWidth, barHeight);
    }
  };
  
  // Función para iniciar la animación
  const startAnimation = () => {
    if (!analyser) return;
    
    const animate = () => {
      drawVisualizer();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  return (
    <div className={`audio-visualizer ${isPlaying ? 'active' : ''}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}