import { useEffect, useRef, useState } from 'react';
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

// Configuración de la animación del nombre
const NAME_ANIMATION_CONFIG = {
  FINAL_SCALE: 90, // Escala final del texto (1 es el tamaño original)
  SCROLL_DURATION: "+=150%", // Duración del scroll para la animación completa
  FADE_OUT_START: 0.7, // Punto donde comienza el fade out (0-1)
  FADE_OUT_END: 0.9, // Punto donde termina el fade out (0-1)
  SCRUB_SMOOTHNESS: 1, // Suavidad de la animación (mayor = más suave)
  MOBILE: {
    FINAL_SCALE: 40, // Escala reducida para móviles
    SCROLL_DURATION: "+=100%", // Duración reducida para móviles
    FADE_OUT_START: 0.6,
    FADE_OUT_END: 0.8,
  }
};

const Hero = () => {
  const { loaded } = useProgress();
  const [showLoader, setShowLoader] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setShowLoader(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  // Detector de cambio de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const firstNameRef = useRef<SVGTextElement>(null);
  const lastNameRef = useRef<SVGTextElement>(null);
  const nameContainerRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Animación inicial optimizada
  useEffect(() => {
    const hero = heroRef.current;
    const firstNameLine = firstNameRef.current;
    const lastNameLine = lastNameRef.current;
    const container = nameContainerRef.current;
    const scrollIndicator = scrollIndicatorRef.current;

    if (!hero || !firstNameLine || !lastNameLine || !container || !scrollIndicator) return;

    gsap.set(hero, { opacity: 1 });
    gsap.set(scrollIndicator, { opacity: 0 });
    
    const tl = gsap.timeline({
      defaults: {
        duration: isMobile ? 0.6 : 0.8,
        ease: "power2.out"
      }
    });
    
    gsap.set([firstNameLine, lastNameLine], {
      y: isMobile ? 50 : 100,
      opacity: 0
    });
    
    tl.to(firstNameLine, {
      y: 0,
      opacity: 1,
    })
    .to(lastNameLine, {
      y: 0,
      opacity: 1,
    }, "-=0.4")
    .to(scrollIndicator, {
      opacity: 1,
      y: 0,
      duration: 0.6
    }, "-=0.2");
    
  }, [isMobile]);

  // Efecto de scroll optimizado
  useEffect(() => {
    const hero = heroRef.current;
    const container = nameContainerRef.current;
    const nameContainer = nameRef.current;
    const scrollIndicator = scrollIndicatorRef.current;
    
    if (!hero || !container || !nameContainer || !scrollIndicator) return;
    
    const config = isMobile ? NAME_ANIMATION_CONFIG.MOBILE : NAME_ANIMATION_CONFIG;
    
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: config.SCROLL_DURATION,
      pin: container,
      pinSpacing: true,
      scrub: NAME_ANIMATION_CONFIG.SCRUB_SMOOTHNESS,
      onUpdate: (self) => {
        const progress = self.progress;
        
        const scale = 1 + (progress * (config.FINAL_SCALE - 1));
        
        let opacity = 1;
        if (progress > config.FADE_OUT_START) {
          opacity = Math.max(0, 1 - (progress - config.FADE_OUT_START) / 
            (config.FADE_OUT_END - config.FADE_OUT_START));
        }
        
        gsap.to(nameContainer, {
          scale: scale,
          opacity: opacity,
          duration: 0.1,
          ease: "none"
        });
        
        gsap.to(scrollIndicator, {
          opacity: Math.max(0, 1 - progress * 3),
          y: 20 * progress,
          duration: 0.1
        });
      }
    });
    
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isMobile]);

  return (
    <section className="hero" ref={heroRef}>
      <ModelLoader show={showLoader} />
      
      <div className="hero-right">
        <Canvas
          camera={{ position: [0, 0, 5], fov: isMobile ? 60 : 45 }}
          style={{ width: '100%', height: '100%' }}
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
          />
        </Canvas>
      </div>

      <div className="simple-content">
        <div className="name-container" ref={nameContainerRef}>
          <div className="hero-name" ref={nameRef}>
            <svg width="100%" height={isMobile ? "120" : "200"} className="name-svg">
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
                textAnchor="middle"
                className="last-name"
                fill="url(#nameGradient)"
              >
                RÁBAGO
              </text>
            </svg>
          </div>
        </div>

        <div className="scroll-indicator" ref={scrollIndicatorRef}>
          <span>Scroll</span>
          <div className="arrow"></div>
        </div>
      </div>
      
      <AudioButton onToggle={setAudioEnabled} />
    </section>
  );
};

export default Hero;