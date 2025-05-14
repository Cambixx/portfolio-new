import { useRef, useEffect } from 'react';
import '../styles/audio-visualizer.scss';

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
}

// Configuración del visualizador
const VISUALIZER_CONFIG = {
  // Configuración de las barras
  BAR_COUNT: 70, // Número de barras a mostrar
  MIN_BAR_HEIGHT: 1, // Altura mínima de cada barra
  BAR_GAP: 0.5, // Espacio entre barras
  MIN_BAR_WIDTH: 4, // Ancho mínimo de cada barra
  BAR_WIDTH_SCALE: 0.9, // Factor de escala para el ancho máximo de las barras (0-1)
  
  // Configuración de la distribución del espectro
  FREQUENCY_DISTRIBUTION: {
    POWER: 1.2, // Exponente para la distribución logarítmica
    RANGE: 0.6, // Rango del espectro de frecuencias a utilizar (0-1)
    OFFSET: 3, // Desplazamiento del índice de frecuencia
  },
  
  // Configuración del gradiente
  GRADIENT: {
    START_COLOR: 'rgba(121, 40, 202, 0)', // Color inicial (Púrpura)
    END_COLOR: 'rgba(255, 154, 158, 0.6)', // Color final (Rosa)
  },
};

export function AudioVisualizer({ audioContext, audioElement, isPlaying, analyser }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // No necesitamos configurar el analizador aquí, ya lo recibimos como prop
  useEffect(() => {
    // Este useEffect puede usarse para inicializar o actualizar el canvas cuando cambian las dependencias
  }, [audioContext, audioElement]);
  
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
      (canvas.height / VISUALIZER_CONFIG.BAR_COUNT) - VISUALIZER_CONFIG.BAR_GAP
    );
    
    // Dibujar cada barra horizontal
    for (let i = 0; i < VISUALIZER_CONFIG.BAR_COUNT; i++) {
      // Distribución logarítmica para representar mejor el espectro de audio
      const index = Math.floor(
        Math.pow(i / VISUALIZER_CONFIG.BAR_COUNT, VISUALIZER_CONFIG.FREQUENCY_DISTRIBUTION.POWER) *
        (bufferLength * VISUALIZER_CONFIG.FREQUENCY_DISTRIBUTION.RANGE) +
        VISUALIZER_CONFIG.FREQUENCY_DISTRIBUTION.OFFSET
      );
      const value = dataArray[index];
      
      // Ancho de la barra proporcional a la intensidad de la frecuencia
      const barWidth = Math.max(
        VISUALIZER_CONFIG.MIN_BAR_WIDTH,
        (value / 255) * canvas.width * VISUALIZER_CONFIG.BAR_WIDTH_SCALE
      );
      
      // Posición y de la barra
      const y = i * (barHeight + VISUALIZER_CONFIG.BAR_GAP);
      
      // Gradiente para las barras (ahora horizontal)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, VISUALIZER_CONFIG.GRADIENT.START_COLOR);
      gradient.addColorStop(1, VISUALIZER_CONFIG.GRADIENT.END_COLOR)
      
      ctx.fillStyle = gradient;
      // Dibujamos desde la derecha hacia la izquierda
      ctx.fillRect(canvas.width - barWidth, y, barWidth, barHeight);
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