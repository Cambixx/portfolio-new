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

const Hero = () => {
  const { loaded } = useProgress();
  const [showLoader, setShowLoader] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setShowLoader(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  const heroRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const firstNameRef = useRef<HTMLDivElement>(null);
  const lastNameRef = useRef<HTMLDivElement>(null);
  const nameContainerRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Animación principal
  useEffect(() => {
    const hero = heroRef.current;
    const firstNameLine = firstNameRef.current;
    const lastNameLine = lastNameRef.current;
    const container = nameContainerRef.current;
    const scrollIndicator = scrollIndicatorRef.current;
    
    if (!hero || !firstNameLine || !lastNameLine || !container || !scrollIndicator) return;

    // Asegurarse de que el hero sea visible
    gsap.set(hero, { opacity: 1 });
    gsap.set(scrollIndicator, { opacity: 0 });
    
    // Obtener todas las letras por línea
    const firstNameLetters = gsap.utils.toArray('.first-name .letter');
    const lastNameLetters = gsap.utils.toArray('.last-name .letter');
    
    // Timeline para la animación
    const tl = gsap.timeline();
    
    // Configurar posición inicial (letras abajo)
    gsap.set([firstNameLetters, lastNameLetters], {
      y: 100,
      opacity: 0
    });
    
    // Animación de entrada desde abajo hacia arriba para el primer nombre
    tl.to(firstNameLetters, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.03,
      ease: "power3.out"
    });
    
    // Animación de entrada desde abajo hacia arriba para el apellido
    tl.to(lastNameLetters, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.03,
      ease: "power3.out"
    }, "-=0.5");
    
    // Efecto de brillo suave
    tl.to([firstNameLetters, lastNameLetters], {
      textShadow: "0 0 10px rgba(255,154,158,0.3)",
      duration: 1.2,
      ease: "power2.inOut"
    }, "-=0.5");
    
    // Mostrar el indicador de scroll al final
    tl.to(scrollIndicator, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    });
    
  }, []);

  // Efecto para el scroll
  useEffect(() => {
    const hero = heroRef.current;
    const container = nameContainerRef.current;
    const scrollIndicator = scrollIndicatorRef.current;
    const firstNameLetters = gsap.utils.toArray('.first-name .letter');
    const lastNameLetters = gsap.utils.toArray('.last-name .letter');
    
    if (!hero || !container || !scrollIndicator) return;
    
    // Crear animación de scroll
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "center top",
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Hacer que las letras se desvanezcan de arriba hacia abajo
        gsap.to(firstNameLetters, {
          y: 50 * progress, // Movimiento hacia abajo
          opacity: Math.max(0, 1 - progress * 2),
          stagger: {
            each: 0.02,
            from: "start"
          },
          duration: 0.1
        });
        
        gsap.to(lastNameLetters, {
          y: 70 * progress, // Movimiento hacia abajo pero más pronunciado
          opacity: Math.max(0, 1 - progress * 2),
          stagger: {
            each: 0.02,
            from: "start"
          },
          duration: 0.1
        });
        
        // Animar el indicador de scroll
        gsap.to(scrollIndicator, {
          opacity: Math.max(0, 1 - progress * 3),
          y: 20 * progress, // También hacia abajo
          duration: 0.1
        });
      }
    });
    
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Función para crear los spans de las letras
  const createLetterSpans = (text: string) => {
    return text.split('').map((char, index) => (
      <span 
        key={index} 
        className="letter"
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  return (
    <section className="hero" ref={heroRef}>
      <ModelLoader show={showLoader} />
      
      <div className="hero-right">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <directionalLight position={[0, 5, 5]} intensity={1} castShadow />
          <Model3D audioEnabled={audioEnabled} />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>
      
      <div className="simple-content">
        <div className="name-container" ref={nameContainerRef}>
          <div className="hero-name" ref={nameRef}>
            <div className="first-name" ref={firstNameRef}>{createLetterSpans("CARLOS")}</div>
            <div className="last-name" ref={lastNameRef}>{createLetterSpans("RÁBAGO")}</div>
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