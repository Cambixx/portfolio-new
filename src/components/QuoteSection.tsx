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

  // Optimizado: Reducido el uso de callbacks y mejorada la eficiencia de la animación
  const animateToNextQuote = useCallback(() => {
    if (isAnimating || !quoteTextRef.current || !quoteAuthorRef.current) return;
    
    setIsAnimating(true);
    
    const elements = [quoteTextRef.current, quoteAuthorRef.current];
    
    gsap.timeline({
      onComplete: () => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        
        gsap.to(elements, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          onComplete: () => setIsAnimating(false)
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
  }, [isAnimating]);

  // Optimizado: Aumentado el intervalo de cambio de citas
  useEffect(() => {
    const initialDelay = setTimeout(() => {
      intervalRef.current = window.setInterval(animateToNextQuote, 6000);
    }, 3000);
    
    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [animateToNextQuote]);

  // Optimizado: Mejorado el manejo de visibilidad
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (!intervalRef.current && !isAnimating) {
        intervalRef.current = window.setInterval(animateToNextQuote, 6000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    if (sectionRef.current) {
      const scrollTrigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        onEnter: handleVisibilityChange,
        onLeave: () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        },
        onEnterBack: handleVisibilityChange,
        onLeaveBack: () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      });

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        scrollTrigger.kill();
      };
    }
  }, [animateToNextQuote, isAnimating]);

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
          if (self.progress > 0.3) {
            const fadeOutProgress = (self.progress - 0.3) / 0.7;
            gsap.to(card, {
              y: fadeOutProgress * (isMobile ? 20 : 40),
              opacity: 1 - fadeOutProgress,
              scale: isMobile ? 1 : scaleFactor.to - (fadeOutProgress * 0.05),
              duration: 0.1
            });
          }
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