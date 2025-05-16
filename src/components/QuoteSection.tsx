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
  
  const intervalRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false); // Ref to track animation state
  const scrollTriggerVisibilityInstanceRef = useRef<ScrollTrigger | null>(null); // Ref for the visibility ScrollTrigger

  // Estado para el índice de la cita actual
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false); // State to trigger effects

  // Sync isAnimating state to isAnimatingRef
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  // Optimizado: animateToNextQuote es ahora estable
  const animateToNextQuote = useCallback(() => {
    if (isAnimatingRef.current || !quoteTextRef.current || !quoteAuthorRef.current) return;
    
    setIsAnimating(true); // Signal animation start
    
    const elements = [quoteTextRef.current, quoteAuthorRef.current];
    
    gsap.timeline({
      onComplete: () => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        
        // Reset for incoming animation
        gsap.set(elements, { y: 20, opacity: 0, scale: 0.99 });
        gsap.to(elements, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          onComplete: () => setIsAnimating(false) // Signal animation end
        });
      }
    }).to(elements, {
      y: -20,
      opacity: 0,
      scale: 0.99,
      duration: 0.4,
      stagger: 0.06,
      ease: "power1.in"
    });
  }, [setCurrentQuoteIndex, setIsAnimating]); // Depends on stable setters

  // Optimizado: Lógica centralizada y estable para manejar el intervalo
  const manageInterval = useCallback(() => {
    const st = scrollTriggerVisibilityInstanceRef.current;
    const sectionIsVisible = st ? st.isActive : false;

    const shouldBeRunning =
      !document.hidden &&
      sectionIsVisible &&
      !isAnimatingRef.current;

    if (shouldBeRunning && !intervalRef.current) {
      intervalRef.current = window.setInterval(animateToNextQuote, 6000);
    } else if (!shouldBeRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [animateToNextQuote]); // Depends on stable animateToNextQuote

  // Optimizado: Efecto para llamar a manageInterval cuando isAnimating cambia
  useEffect(() => {
    manageInterval();
  }, [isAnimating, manageInterval]);

  // Optimizado: Efecto para configurar listeners (visibilidad y scroll) - se ejecuta una vez
  useEffect(() => {
    document.addEventListener('visibilitychange', manageInterval);

    if (sectionRef.current) {
      scrollTriggerVisibilityInstanceRef.current = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (_self) => { // Cambiado de self a _self
          manageInterval();
        }
      });
    }
    
    manageInterval(); // Comprobación inicial

    return () => {
      document.removeEventListener('visibilitychange', manageInterval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (scrollTriggerVisibilityInstanceRef.current) {
        scrollTriggerVisibilityInstanceRef.current.kill();
        scrollTriggerVisibilityInstanceRef.current = null;
      }
    };
  }, [manageInterval]); // Depende de manageInterval estable, por lo que se ejecuta una vez para configuración/limpieza

  // Optimizado: Mejorada la animación inicial
  useEffect(() => {
    const section = sectionRef.current;
    const card = quoteCardRef.current;
    const text = quoteTextRef.current;
    const author = quoteAuthorRef.current;

    if (!section || !card || !text || !author) return;

    const isMobile = window.innerWidth <= 768;
    const scaleFactor = isMobile ? { from: 1, to: 1 } : { from: 0.95, to: 1 };

    gsap.set([card, text, author], { y: 40, opacity: 0 });
    
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom-=100",
        end: "bottom top",
        scrub: false,
        once: true,
        onEnter: () => {
          gsap.to(card, {
            y: 0,
            opacity: 1,
            scale: scaleFactor.to,
            duration: 0.6,
            ease: "power2.out"
          });
          
          gsap.to([text, author], {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.2,
            ease: "power2.out"
          });
        }
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom+=20% top",
        pin: true,
        pinSpacing: true,
        onUpdate: (self) => {
          if (!card) return;

          const currentIsMobile = window.innerWidth <= 768; // Recalculate in case of resize during scroll
          const currentScaleFactorTo = currentIsMobile ? 1 : scaleFactor.to;

          let y = 0;
          let opacity = 1;
          let scale = currentScaleFactorTo;

          if (self.progress > 0.3) {
            const fadeOutProgress = Math.min(1, Math.max(0, (self.progress - 0.3) / 0.7));
            y = fadeOutProgress * (currentIsMobile ? 20 : 40);
            opacity = 1 - fadeOutProgress;
            scale = currentIsMobile ? 1 : currentScaleFactorTo - (fadeOutProgress * 0.05);
          }
          
          gsap.set(card, { y, opacity, scale });
        }
      });
    }, section);

    return () => ctx.revert();
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