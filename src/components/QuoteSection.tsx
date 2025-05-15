import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import quotes from '../data/quotes.json';
import '../styles/quote.scss';

// Registramos ScrollTrigger para poder usarlo
gsap.registerPlugin(ScrollTrigger);

const QuoteSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const quoteCardRef = useRef<HTMLDivElement>(null);
  const quoteTextRef = useRef<HTMLParagraphElement>(null);
  const quoteAuthorRef = useRef<HTMLDivElement>(null);
  
  // Estado para el índice de la cita actual
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Función para cambiar a la siguiente cita con animación GSAP
  const animateToNextQuote = useCallback(() => {
    if (isAnimating || !quoteTextRef.current || !quoteAuthorRef.current) return;
    
    setIsAnimating(true);
    
    // Animación de salida (fade out hacia arriba con ligera reducción de escala)
    const tl = gsap.timeline({
      onComplete: () => {
        // Actualizar el índice de la cita
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        
        // Animación de entrada (fade in desde abajo con ligero aumento de escala)
        gsap.timeline({
          onComplete: () => setIsAnimating(false)
        })
          .fromTo([quoteTextRef.current, quoteAuthorRef.current], 
            { y: 20, opacity: 0, scale: 0.98 }, 
            { 
              y: 0, 
              opacity: 1, 
              scale: 1,
              duration: 0.6, 
              stagger: 0.1, 
              ease: "power2.out" 
            }
          );
      }
    });
    
    tl.to([quoteTextRef.current, quoteAuthorRef.current], {
      y: -20,
      opacity: 0,
      scale: 0.99,
      duration: 0.5,
      stagger: 0.08,
      ease: "power1.in"
    });
  }, [isAnimating]);

  // Efecto para cambiar automáticamente la cita cada 4 segundos
  useEffect(() => {
    // Comenzamos después de un pequeño retraso inicial
    const initialDelay = setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        if (!isAnimating) {
          animateToNextQuote();
        }
      }, 4000);
    }, 2000); // Comienza después de 2 segundos para dar tiempo a la animación inicial
    
    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [animateToNextQuote, isAnimating]);

  // Pausar la animación cuando la sección no está visible
  useEffect(() => {
    const pauseAnimation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const resumeAnimation = () => {
      if (!intervalRef.current && !isAnimating) {
        intervalRef.current = window.setInterval(() => {
          animateToNextQuote();
        }, 4000);
      }
    };

    // Pausar/reanudar animaciones cuando la página no está visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseAnimation();
      } else {
        resumeAnimation();
      }
    });

    // Crear trigger para detectar cuando la sección está visible
    if (sectionRef.current) {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        onEnter: resumeAnimation,
        onLeave: pauseAnimation,
        onEnterBack: resumeAnimation,
        onLeaveBack: pauseAnimation
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', () => {});
    };
  }, [animateToNextQuote, isAnimating]);

  // Animación al cargar el componente
  useEffect(() => {
    const section = sectionRef.current;
    const card = quoteCardRef.current;
    const text = quoteTextRef.current;
    const author = quoteAuthorRef.current;

    if (!section || !card || !text || !author) return;

    // Configuramos posición inicial (fuera de la vista)
    gsap.set(card, { y: 60, opacity: 0, scale: 0.95 });
    gsap.set(text, { opacity: 0 });
    gsap.set(author, { opacity: 0, x: -15 });

    // Optimizar para móviles
    const isMobile = window.innerWidth <= 768;
    const scaleFactor = isMobile ? { from: 0.97, to: 1 } : { from: 0.9, to: 1 };
    const yOffset = isMobile ? 50 : 80;

    // Animación de entrada con pinning para mantener la sección visible
    ScrollTrigger.create({
      trigger: section,
      start: "top bottom-=100",
      end: "top top",
      scrub: isMobile ? 0.4 : 0.6, // Más rápido en móviles
      onEnter: () => {
        // Animar la entrada de la tarjeta con valores optimizados
        gsap.to(card, {
          y: 0,
          opacity: 1,
          scale: scaleFactor.to,
          duration: isMobile ? 0.5 : 0.8,
          ease: "power1.out"
        });
        
        // Animar el texto con retraso
        gsap.to(text, {
          opacity: 1,
          duration: 0.5,
          delay: 0.2,
          ease: "power1.out"
        });
        
        // Animar el autor
        gsap.to(author, {
          opacity: 1,
          x: 0,
          duration: 0.5,
          delay: 0.3,
          ease: "power1.out"
        });
      }
    });

    // Animación de salida al seguir scrolleando - extendemos el tiempo de visibilidad
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom+=40% top", // Extendemos el final para que permanezca más tiempo visible
      scrub: isMobile ? 0.3 : true, // Valor fijo para móviles para mayor suavidad
      pin: true, // Mantener la sección fija mientras se hace scroll
      pinSpacing: true,
      onUpdate: (self) => {
        // Retrasamos el inicio de la animación de salida
        // Cambiamos de 0.1 a 0.3, lo que significa que estará 30% del scroll completo antes de comenzar a desvanecerse
        if (self.progress > 0.3) {
          // Normalizamos el progreso para que vaya de 0 a 1 en el 70% restante del scroll
          const fadeOutProgress = (self.progress - 0.3) / 0.7;
          
          // Valores reducidos para animación más suave en móviles
          const scaleReduction = isMobile ? 0.03 : 0.1;
          const yMultiplier = isMobile ? 30 : 50;
          
          gsap.to(card, {
            y: fadeOutProgress * yMultiplier,
            opacity: Math.max(0, 1 - fadeOutProgress * 1.2),
            scale: Math.max(scaleFactor.from, scaleFactor.to - fadeOutProgress * scaleReduction),
            duration: 0.05 // Duración más corta para mayor reactividad
          });
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Obtener la cita actual del array
  const currentQuote = quotes[currentQuoteIndex];

  return (
    <section className="quote-section" ref={sectionRef}>
      <div className="quote-card" ref={quoteCardRef}>
        <p className="quote-text" ref={quoteTextRef}>
          {currentQuote.text}
        </p>
        <div className="quote-author" ref={quoteAuthorRef}>
          <span>{currentQuote.author}</span>
        </div>
      </div>
    </section>
  );
};

export default QuoteSection; 