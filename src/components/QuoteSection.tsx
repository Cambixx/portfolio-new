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
  const isMobileRef = useRef(window.innerWidth <= 768);

  // Estado para el índice de la cita actual
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false); // State to trigger effects

  // Sync isAnimating state to isAnimatingRef
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  // Optimizada la función de animación para mejor rendimiento
  const animateToNextQuote = useCallback(() => {
    if (isAnimatingRef.current || !quoteTextRef.current || !quoteAuthorRef.current) return;
    
    setIsAnimating(true);
    
    const elements = [quoteTextRef.current, quoteAuthorRef.current];
    const isMobile = isMobileRef.current;
    
    const timeline = gsap.timeline({
      defaults: {
        duration: isMobile ? 0.3 : 0.4,
        ease: "power2.inOut",
        force3D: true,
      },
      onComplete: () => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        
        gsap.set(elements, {
          opacity: 0,
          transform: 'translate3d(0, 20px, 0)',
        });
        
        gsap.to(elements, {
          opacity: 1,
          transform: 'translate3d(0, 0, 0)',
          duration: isMobile ? 0.3 : 0.5,
          stagger: isMobile ? 0.05 : 0.08,
          ease: "power2.out",
          force3D: true,
          onComplete: () => setIsAnimating(false)
        });
      }
    });

    timeline.to(elements, {
      opacity: 0,
      transform: 'translate3d(0, -20px, 0)',
      stagger: isMobile ? 0.04 : 0.06,
    });
  }, []);

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
    const handleResize = () => {
      isMobileRef.current = window.innerWidth <= 768;
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', manageInterval);

    if (sectionRef.current) {
      scrollTriggerVisibilityInstanceRef.current = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: () => manageInterval()
      });
    }
    
    manageInterval(); // Comprobación inicial

    return () => {
      window.removeEventListener('resize', handleResize);
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

    const isMobile = isMobileRef.current;

    gsap.set([card, text, author], {
      opacity: 0,
      transform: 'translate3d(0, 40px, 0)',
    });
    
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom-=100",
        end: "bottom top",
        once: true,
        onEnter: () => {
          gsap.to(card, {
            opacity: 1,
            transform: 'translate3d(0, 0, 0) scale(1)',
            duration: isMobile ? 0.4 : 0.6,
            ease: "power2.out",
            force3D: true,
          });
          
          gsap.to([text, author], {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)',
            duration: isMobile ? 0.3 : 0.5,
            stagger: isMobile ? 0.05 : 0.1,
            delay: isMobile ? 0.1 : 0.2,
            ease: "power2.out",
            force3D: true,
          });
        }
      });

      // Optimizado el ScrollTrigger de pin para móviles
      if (!isMobile) {
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom+=20% top",
          pin: true,
          pinSpacing: true,
          onUpdate: (self) => {
            if (!card) return;

            let progress = self.progress;
            let y = 0;
            let opacity = 1;
            let scale = 1;

            if (progress > 0.3) {
              const fadeOutProgress = Math.min(1, (progress - 0.3) / 0.7);
              y = fadeOutProgress * 40;
              opacity = 1 - fadeOutProgress;
              scale = 1 - (fadeOutProgress * 0.05);
            }
            
            gsap.set(card, {
              transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
              opacity,
              force3D: true,
            });
          }
        });
      }
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