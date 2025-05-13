import { useState, useEffect } from 'react';
import '../styles/audio-button.scss';

interface AudioButtonProps {
  onToggle: (isPlaying: boolean) => void;
}

export function AudioButton({ onToggle }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Crear elemento de audio
    const audio = new Audio('/sounds/beat.mp3');
    audio.loop = true;
    setAudioElement(audio);

    // Inicializar contexto de audio
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    setAudioContext(new AudioContext());

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
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
      audioElement.play();
    }

    const newState = !isPlaying;
    setIsPlaying(newState);
    onToggle(newState);
  };

  return (
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
  );
}