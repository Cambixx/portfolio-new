import { useRef, useEffect } from 'react';

export function AudioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const isInitializedRef = useRef(false);

  // Inicializar el audio
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    // Crear elemento de audio
    audioRef.current = new Audio('/sounds/beat.mp3');
    audioRef.current.loop = true;

    // Configurar el contexto de audio
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContext();
    
    // Conectar el audio directamente al destino
    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    sourceRef.current.connect(audioContextRef.current.destination);
    
    isInitializedRef.current = true;

    return () => {
      // Limpiar recursos
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);



  return null;
}