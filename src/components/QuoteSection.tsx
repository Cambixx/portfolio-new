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
            { y: 30, opacity: 0, scale: 0.95 }, 
            { 
              y: 0, 
              opacity: 1, 
              scale: 1,
              duration: 0.8, 
              stagger: 0.15, 
              ease: "power2.out" 
            }
          );
      }
    });
    
    tl.to([quoteTextRef.current, quoteAuthorRef.current], {
      y: -30,
      opacity: 0,
      scale: 0.98,
      duration: 0.7,
      stagger: 0.1,
      ease: "power2.in"
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
    gsap.set(card, { y: 80, opacity: 0, scale: 0.9 });
    gsap.set(text, { opacity: 0 });
    gsap.set(author, { opacity: 0, x: -20 });

    // Animación de entrada con pinning para mantener la sección visible
    ScrollTrigger.create({
      trigger: section,
      start: "top bottom-=100",
      end: "top top",
      scrub: 0.6,
      onEnter: () => {
        // Animar la entrada de la tarjeta
        gsap.to(card, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power2.out"
        });
        
        // Animar el texto con retraso
        gsap.to(text, {
          opacity: 1,
          duration: 0.6,
          delay: 0.3,
          ease: "power2.out"
        });
        
        // Animar el autor
        gsap.to(author, {
          opacity: 1,
          x: 0,
          duration: 0.6,
          delay: 0.5,
          ease: "power2.out"
        });
      }
    });

    // Animación de salida al seguir scrolleando
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      scrub: true,
      pin: true, // Mantener la sección fija mientras se hace scroll
      pinSpacing: true,
      onUpdate: (self) => {
        // Suavizar la salida de la tarjeta solo cuando comienza a salir
        if (self.progress > 0.1) {
          const fadeOutProgress = (self.progress - 0.1) / 0.9; // Normalizar de 0.1-1.0 a 0-1
          
          gsap.to(card, {
            y: fadeOutProgress * 50,
            opacity: Math.max(0, 1 - fadeOutProgress * 1.2),
            scale: Math.max(0.9, 1 - fadeOutProgress * 0.1),
            duration: 0.1
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