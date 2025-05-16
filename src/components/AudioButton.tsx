import { useState, useEffect, useRef } from 'react';
import '../styles/audio-button.scss';
import { AudioVisualizer } from './AudioVisualizer';

interface AudioButtonProps {
  onToggle: (isPlaying: boolean) => void;
}

export function AudioButton({ onToggle }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Crear elemento de audio
    const audio = new Audio('/sounds/beat3.mp3');
    audio.loop = true;
    setAudioElement(audio);

    // Inicializar contexto de audio
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const context = new AudioContext();
    
    // Crear un analizador para el visualizador
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;
    
    // Crear fuente de audio y conectarla
    const source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);
    
    setAudioContext(context);

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (context && context.state !== 'closed') {
        context.close();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioElement || !audioContext) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      // Reanudar el contexto de audio si está suspendido
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      audioElement.play().catch(error => {
        console.error('Error al reproducir audio:', error);
      });
    }

    const newState = !isPlaying;
    setIsPlaying(newState);
    onToggle(newState);
  };

  return (
    <>
      <button 
        className={`audio-button ${isPlaying ? 'playing' : ''}`}
        onClick={togglePlay}
        aria-label={isPlaying ? "Pausar música" : "Reproducir música"}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        <div className="audio-waves">
          <span className="wave"></span>
          <span className="wave"></span>
          <span className="wave"></span>
          <span className="wave"></span>
        </div>
      </button>
      <AudioVisualizer 
        audioContext={audioContext}
        audioElement={audioElement}
        isPlaying={isPlaying}
        analyser={analyserRef.current}
      />
    </>
  );
}