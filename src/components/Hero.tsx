import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useProgress } from '@react-three/drei';
import { Model3D } from './Model3D';
import { ModelLoader } from './ModelLoader';
import { AudioButton } from './AudioButton';
import Ballpit from './Ballpit';
import Lanyard from './Lanyard';
// import { useActiveSection } from '../hooks/useActiveSection';
import '../styles/hero.scss';

// Registramos ScrollTrigger para poder usarlo
gsap.registerPlugin(ScrollTrigger);

// Configuración optimizada de la animación
const NAME_ANIMATION_CONFIG = {
  DESKTOP: {
    SCROLL_Y_TRANSLATE_PERCENT: -30,
    SCROLL_DURATION: "+=100%",
    FADE_OUT_START: 0.1,
    FADE_OUT_END: 0.7,
    INITIAL_Y: 100,
    SCRUB_SMOOTHNESS: 0.8
  },
  MOBILE: {
    SCROLL_Y_TRANSLATE_PERCENT: -25,
    SCROLL_DURATION: "+=100%",
    FADE_OUT_START: 0.1,
    FADE_OUT_END: 0.7,
    INITIAL_Y: 50,
    SCRUB_SMOOTHNESS: 0.5
  },
  ANIMATION_DEFAULTS: {
    DESKTOP: {
      duration: 0.8,
      ease: "power2.out"
    },
    MOBILE: {
      duration: 0.5,
      ease: "power2.out"
    }
  }
};

const Hero = () => {
  const { loaded } = useProgress();
  const [showLoader, setShowLoader] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [isAudioActuallyPlaying, setIsAudioActuallyPlaying] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Hook para detectar la sección activa
  // const { activeSection } = useActiveSection();

  const heroRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  // const firstNameRef = useRef<SVGTextElement>(null);
  // const lastNameRef = useRef<SVGTextElement>(null);
  const nameContainerRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const animationContextRef = useRef<gsap.Context | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  // Cleanup de animaciones
  const cleanupAnimations = useCallback(() => {
    if (animationContextRef.current) {
      animationContextRef.current.revert();
      animationContextRef.current = null;
    }
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
      scrollTriggerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setShowLoader(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  // Detector optimizado de cambio de tamaño
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        cleanupAnimations();
      }
    };

    const debouncedResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      cleanupAnimations();
    };
  }, [isMobile, cleanupAnimations]);

  // Animación inicial mejorada
  useEffect(() => {
    const hero = heroRef.current;
    const nameContainer = nameContainerRef.current;
    const scrollIndicator = scrollIndicatorRef.current;

    if (!hero || !nameContainer || !scrollIndicator) return;

    const config = isMobile ? 
      NAME_ANIMATION_CONFIG.MOBILE : 
      NAME_ANIMATION_CONFIG.DESKTOP;

    const defaults = isMobile ? 
      NAME_ANIMATION_CONFIG.ANIMATION_DEFAULTS.MOBILE : 
      NAME_ANIMATION_CONFIG.ANIMATION_DEFAULTS.DESKTOP;

    // Crear contexto de animación
    animationContextRef.current = gsap.context(() => {
      // Estados iniciales
      gsap.set(nameContainer, {
        y: config.INITIAL_Y,
        opacity: 0,
        scale: 0.9
      });

      gsap.set(scrollIndicator, {
        opacity: 0,
        y: 30
      });

      const tl = gsap.timeline({
        defaults: {
          duration: defaults.duration,
          ease: defaults.ease
        },
        delay: showLoader ? 0.5 : 0
      });

      // Animación de entrada más elegante
      tl.to(nameContainer, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: defaults.duration * 1.2,
        ease: "back.out(1.7)"
      })
      .to(scrollIndicator, {
        opacity: 1,
        y: 0,
        duration: defaults.duration * 0.8,
        ease: "power2.out"
      }, "-=0.4");
    }, hero);

    return () => cleanupAnimations();
  }, [isMobile, cleanupAnimations, showLoader]);

  // Efecto de scroll optimizado
  useEffect(() => {
    const hero = heroRef.current;
    const container = nameContainerRef.current;
    const nameContainer = nameRef.current;
    const scrollIndicator = scrollIndicatorRef.current;
    
    if (!hero || !container || !nameContainer || !scrollIndicator) return;
    
    const config = isMobile ? 
      NAME_ANIMATION_CONFIG.MOBILE : 
      NAME_ANIMATION_CONFIG.DESKTOP;

    // Crear ScrollTrigger optimizado
    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: config.SCROLL_DURATION,
      scrub: config.SCRUB_SMOOTHNESS,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Calculamos el desplazamiento vertical en porcentaje
        const yPercent = config.SCROLL_Y_TRANSLATE_PERCENT * progress;
        
        let opacity = 1;
        if (progress > config.FADE_OUT_START) {
          opacity = gsap.utils.clamp(
            0,
            1,
            1 - (progress - config.FADE_OUT_START) / 
              (config.FADE_OUT_END - config.FADE_OUT_START)
          );
        }
        
        // Aplicar transformaciones de manera más eficiente
        gsap.set(nameContainer, {
          yPercent: yPercent,
          opacity: opacity
        });
        
        gsap.set(scrollIndicator, {
          opacity: gsap.utils.clamp(0, 1, 1 - progress * 3),
          y: progress * 20
        });

        // Actualizar progreso para la barra
        setScrollProgress(progress);
      }
    });

    return () => cleanupAnimations();
  }, [isMobile, cleanupAnimations]);

  const handleAnalyserStateChange = useCallback((analyser: AnalyserNode | null, playing: boolean) => {
    setAnalyserNode(analyser);
    setIsAudioActuallyPlaying(playing);
  }, []);

  // Función para scroll suave a la siguiente sección
  const handleScrollToNext = useCallback(() => {
    const nextSection = document.querySelector('.about-section') || 
                       document.querySelector('section:nth-of-type(2)');
    
    if (nextSection) {
      nextSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback: scroll por viewport height
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      {/* Fondo Ballpit */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          minHeight: '500px',
          maxHeight: '100vh',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        <Ballpit
          followCursor={true}
        />
      </div>
      {/* Fin fondo Ballpit */}
      <ModelLoader show={showLoader} />
      
      <div className="hero-right">
        <Canvas
          camera={{ 
            position: [0, 0, 5], 
            fov: isMobile ? 60 : 45 
          }}
          style={{ width: '100%', height: '100%' }}
          dpr={[1, 2]} // Optimizar para diferentes densidades de píxeles
        >
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <directionalLight position={[0, 5, 5]} intensity={1} castShadow />
          <Model3D 
            audioEnabled={audioEnabled} 
            analyser={analyserNode} 
            isAudioPlaying={isAudioActuallyPlaying} 
          />
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 2.5}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      <div className="simple-content">
        <div className="name-container" ref={nameContainerRef}>
          <div className="hero-name" ref={nameRef}>
            <Lanyard position={[0, 0, 25]} gravity={[0, -30, 0]} />
          </div>
        </div>

        <div 
          className="scroll-indicator" 
          ref={scrollIndicatorRef}
          onClick={handleScrollToNext}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleScrollToNext();
            }
          }}
          aria-label="Scroll to next section"
        >
          <span>Scroll</span>
          <div className="arrow"></div>
        </div>
      </div>
      
      {/* Barra de progreso sutil */}
      <div className="progress-container">
        <div 
          className="progress-bar" 
          ref={progressBarRef}
          style={{
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left center'
          }}
        />
      </div>
      
      <AudioButton onToggle={setAudioEnabled} onAnalyserStateChange={handleAnalyserStateChange} />
    </section>
  );
};

// Utilidad para debounce
function debounce(fn: Function, ms: number) {
  let timer: number;
  return function(this: any, ...args: any[]) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn.apply(this, args), ms);
  };
}

export default Hero;