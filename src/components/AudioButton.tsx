import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap'; // Importar GSAP
import '../styles/audio-button.scss';
import { AudioVisualizer } from './AudioVisualizer';

interface AudioButtonProps {
  onToggle: (isPlaying: boolean) => void;
  onAnalyserStateChange?: (analyser: AnalyserNode | null, isPlaying: boolean) => void;
}

export function AudioButton({ onToggle, onAnalyserStateChange }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playTextRef = useRef<HTMLSpanElement>(null); // Ref para el texto
  const playTextWrapperRef = useRef<HTMLDivElement>(null); // Ref para el contenedor del texto

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
    if (onAnalyserStateChange) {
      onAnalyserStateChange(analyserRef.current, isPlaying);
    }
    
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
      // Detener animación de GSAP al desmontar
      if (playTextRef.current) {
        gsap.killTweensOf(playTextRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (playTextRef.current && playTextWrapperRef.current) {
      const textElement = playTextRef.current;
      const wrapperElement = playTextWrapperRef.current;
      
      gsap.killTweensOf(textElement); // Detener animaciones previas

      if (!isPlaying) {
        gsap.set(wrapperElement, { opacity: 1 }); // Asegurar visibilidad del wrapper
        const textWidth = textElement.offsetWidth;
        const wrapperWidth = wrapperElement.offsetWidth;

        if (textWidth > wrapperWidth) {
          gsap.fromTo(textElement, 
            { x: 0 }, 
            {
              x: wrapperWidth - textWidth, 
              duration: 5, 
              ease: 'linear',
              repeat: -1, 
              yoyo: true, 
            }
          );
        } else {
          gsap.set(textElement, { x: 0 }); 
        }

      } else {
        gsap.to(wrapperElement, { opacity: 0, duration: 0.3 }); 
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioElement || !audioContext) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
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
    if (onAnalyserStateChange) {
      onAnalyserStateChange(analyserRef.current, newState);
    }
  };

  return (
    <>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 100
        }}
      >
        <div 
          ref={playTextWrapperRef}
          className="play-prompt-wrapper"
          style={{ 
            marginRight: '10px',
            width: '110px', 
            overflow: 'hidden', 
            display: isPlaying ? 'none' : 'inline-block', 
          }}
        >
          <span 
            ref={playTextRef} 
            className="play-prompt-text"
            style={{ 
              display: 'inline-block', 
              whiteSpace: 'nowrap' 
            }}
          >
            Dale Play 😎 Dale Play 😎 Dale Play 😎
          </span>
        </div>
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
      </div>
      <AudioVisualizer 
        audioContext={audioContext}
        audioElement={audioElement}
        isPlaying={isPlaying}
        analyser={analyserRef.current}
      />
    </>
  );
}