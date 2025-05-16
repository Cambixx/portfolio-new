import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useProgress } from '@react-three/drei';
import { Model3D } from './Model3D';
import { ModelLoader } from './ModelLoader';
import { AudioButton } from './AudioButton';
import '../styles/hero.scss';

// Registramos ScrollTrigger para poder usarlo
gsap.registerPlugin(ScrollTrigger);

// Configuración optimizada de la animación
const NAME_ANIMATION_CONFIG = {
  DESKTOP: {
    FINAL_SCALE: 70,
    SCROLL_DURATION: "+=120%",
    FADE_OUT_START: 0.65,
    FADE_OUT_END: 0.85,
    INITIAL_Y: 100,
    SCRUB_SMOOTHNESS: 0.8
  },
  MOBILE: {
    FINAL_SCALE: 50,
    SCROLL_DURATION: "+=80%",
    FADE_OUT_START: 0.7,
    FADE_OUT_END: 0.9,
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

  const heroRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const firstNameRef = useRef<SVGTextElement>(null);
  const lastNameRef = useRef<SVGTextElement>(null);
  const nameContainerRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
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

  // Animación inicial optimizada
  useEffect(() => {
    const hero = heroRef.current;
    const firstNameLine = firstNameRef.current;
    const lastNameLine = lastNameRef.current;
    const scrollIndicator = scrollIndicatorRef.current;

    if (!hero || !firstNameLine || !lastNameLine || !scrollIndicator) return;

    const config = isMobile ? 
      NAME_ANIMATION_CONFIG.MOBILE : 
      NAME_ANIMATION_CONFIG.DESKTOP;

    const defaults = isMobile ? 
      NAME_ANIMATION_CONFIG.ANIMATION_DEFAULTS.MOBILE : 
      NAME_ANIMATION_CONFIG.ANIMATION_DEFAULTS.DESKTOP;

    // Crear contexto de animación
    animationContextRef.current = gsap.context(() => {
      gsap.set([firstNameLine, lastNameLine], {
        y: config.INITIAL_Y,
        opacity: 0
      });

      const tl = gsap.timeline({
        defaults: {
          duration: defaults.duration,
          ease: defaults.ease
        }
      });

      // Animación optimizada de entrada
      tl.to(firstNameLine, {
        y: 0,
        opacity: 1
      })
      .to(lastNameLine, {
        y: 0,
        opacity: 1
      }, "-=0.3")
      .to(scrollIndicator, {
        opacity: 1,
        y: 0,
        duration: defaults.duration * 0.75
      }, "-=0.2");
    }, hero);

    return () => cleanupAnimations();
  }, [isMobile, cleanupAnimations]);

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
      pin: container,
      pinSpacing: true,
      scrub: config.SCRUB_SMOOTHNESS,
      onUpdate: (self) => {
        const progress = self.progress;
        const scale = 1 + (progress * (config.FINAL_SCALE - 1));
        
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
          scale: scale,
          opacity: opacity
        });
        
        gsap.set(scrollIndicator, {
          opacity: gsap.utils.clamp(0, 1, 1 - progress * 2.5),
          y: progress * 15
        });
      }
    });

    return () => cleanupAnimations();
  }, [isMobile, cleanupAnimations]);

  return (
    <section className="hero" ref={heroRef}>
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
          <Model3D audioEnabled={audioEnabled} />
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
            <svg 
              width="100%" 
              height={isMobile ? "120" : "200"} 
              className="name-svg"
            >
              <defs>
                <linearGradient id="nameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF9A9E" />
                  <stop offset="100%" stopColor="#FFECD2" />
                </linearGradient>
              </defs>
              <text
                ref={firstNameRef}
                x="50%"
                y={isMobile ? "45%" : "40%"}
                textAnchor="middle"
                className="first-name"
                fill="url(#nameGradient)"
              >
                CARLOS
              </text>
              <text
                ref={lastNameRef}
                x="50%"
                y={isMobile ? "85%" : "80%"}
                dominantBaseline="middle"
                textAnchor="middle"
                className="last-name"
                fill="url(#nameGradient)"
              >
                RÁBAGO
              </text>
            </svg>
          </div>
        </div>

        <div 
          className="scroll-indicator" 
          ref={scrollIndicatorRef}
        >
          <span>Scroll</span>
          <div className="arrow"></div>
        </div>
      </div>
      
      <AudioButton onToggle={setAudioEnabled} />
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