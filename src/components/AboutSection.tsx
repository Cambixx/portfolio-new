import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/about.scss';

gsap.registerPlugin(ScrollTrigger);

const AboutSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const textBlocksRef = useRef<(HTMLDivElement | null)[]>([]);
  const lastBlockTitleRef = useRef<HTMLHeadingElement>(null);
  const scrollTriggerInstanceRef = useRef<ScrollTrigger | null>(null);

  const setTextBlockRef = (el: HTMLDivElement | null, index: number) => {
    textBlocksRef.current[index] = el;
  };

  // Función para configurar el ScrollTrigger
  const setupScrollTrigger = () => {
    if (!titleContainerRef.current || !titleRef.current || !lastBlockTitleRef.current) return;

    const titleContainer = titleContainerRef.current;
    const title = titleRef.current;
    const lastBlockTitle = lastBlockTitleRef.current;

    // Limpiar el ScrollTrigger anterior si existe
    if (scrollTriggerInstanceRef.current) {
      scrollTriggerInstanceRef.current.kill();
    }

    // Solo aplicar el pin en pantallas grandes
    const mediaQuery = window.matchMedia('(min-width: 769px)');
    
    if (mediaQuery.matches) {
      scrollTriggerInstanceRef.current = ScrollTrigger.create({
        trigger: titleContainer,
        start: 'top 20%',
        endTrigger: lastBlockTitle,
        end: 'top 40%',
        pin: title,
        pinSpacing: false,
        onEnter: () => {
          title.classList.add('title-pinned');
        },
        onLeave: () => {
          title.classList.remove('title-pinned');
        },
        onEnterBack: () => {
          title.classList.add('title-pinned');
        },
        onLeaveBack: () => {
          title.classList.remove('title-pinned');
        }
      });
    }
  };

  useEffect(() => {
    setupScrollTrigger();

    // Configurar las animaciones de los bloques de texto
    const textBlocks = textBlocksRef.current.filter(Boolean);
    const textAnimations = textBlocks.map((block) => {
      return gsap.fromTo(block, 
        { 
          y: window.innerWidth <= 768 ? 30 : 50,
          opacity: 0 
        }, 
        {
          y: 0,
          opacity: 1,
          scrollTrigger: {
            trigger: block,
            start: 'top 80%',
            end: 'top center',
            scrub: 0.5
          }
        }
      );
    });

    // Manejar cambios de tamaño de ventana
    const handleResize = () => {
      setupScrollTrigger();
    };

    window.addEventListener('resize', handleResize);

    // Limpieza
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollTriggerInstanceRef.current) {
        scrollTriggerInstanceRef.current.kill();
      }
      textAnimations.forEach(animation => {
        if (animation.scrollTrigger) {
          animation.scrollTrigger.kill();
        }
      });
    };
  }, []);

  // Bloques de texto para la sección "Sobre mí"
  const textBlocks = [
    {
      title: "Diseño Centrado en Usuario",
      description: "Creo experiencias digitales intuitivas y atractivas, priorizando siempre las necesidades del usuario final."
    },
    {
      title: "Código Limpio y Optimizado",
      description: "Desarrollo utilizando las últimas tecnologías y mejores prácticas, garantizando sitios rápidos, accesibles y fáciles de mantener."
    },
    {
      title: "Enfoque Creativo y Analítico",
      description: "Combino creatividad en el diseño con análisis detallado para ofrecer soluciones técnicas eficientes que destacan en el mercado digital."
    }
  ];

  return (
    <section ref={sectionRef} className="about-section">
      <div className="about-layout">
        <div ref={titleContainerRef} className="title-wrapper">
          <div className="title-container" ref={titleRef}>
            <h2 className="title">Sobre<span>mí</span></h2>
            <div className="vertical-line"></div>
          </div>
        </div>

        <div ref={contentContainerRef} className="content-wrapper">
          <div className="text-container">
            {textBlocks.map((block, _index) => (
              <div 
                key={_index} 
                className="text-block"
                ref={(el) => setTextBlockRef(el, _index)}
              >
                <h3 ref={_index === textBlocks.length - 1 ? lastBlockTitleRef : null}>
                  {block.title}
                </h3>
                <p>{block.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection; 