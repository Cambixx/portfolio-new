import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/about.scss';

gsap.registerPlugin(ScrollTrigger);

const textBlocksData = [
  {
    title: "Ingeniería Aplicada al Código",
    description: "Mi formación como Ingeniero Industrial me aporta una visión estratégica y una capacidad analítica que integro en cada proyecto para construir soluciones web robustas y eficientes."
  },
  {
    title: "Tecnología con Propósito",
    description: "Convierto ideas en aplicaciones web optimizadas y escalables. Mi enfoque se centra en escribir código limpio que garantiza un rendimiento excepcional y una gran experiencia de usuario."
  },
  {
    title: "Colaboración e Innovación Continua",
    description: "Soy un profesional proactivo, motivado por los proyectos innovadores y el trabajo en equipo. Busco constantemente aprender y aplicar nuevas tecnologías para aportar valor y superar expectativas."
  }
];

const AboutSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const textBlocksRef = useRef<(HTMLDivElement | null)[]>([]);
  const lastBlockTitleRef = useRef<HTMLHeadingElement>(null);
  const scrollTriggerInstanceRef = useRef<ScrollTrigger | null>(null);
  const textAnimationsRef = useRef<gsap.core.Tween[]>([]);

  // Memoizar la función para evitar recrearla en cada render
  const setTextBlockRef = useCallback((el: HTMLDivElement | null, index: number) => {
    textBlocksRef.current[index] = el;
  }, []);

  // Configuración del ScrollTrigger
  const setupScrollTrigger = useCallback(() => {
    if (!titleContainerRef.current || !titleRef.current || !lastBlockTitleRef.current) return;
    const titleContainer = titleContainerRef.current;
    const title = titleRef.current;
    const lastBlockTitle = lastBlockTitleRef.current;
    if (scrollTriggerInstanceRef.current) {
      scrollTriggerInstanceRef.current.kill();
    }
    const mediaQuery = window.matchMedia('(min-width: 769px)');
    if (mediaQuery.matches) {
      scrollTriggerInstanceRef.current = ScrollTrigger.create({
        trigger: titleContainer,
        start: 'top 20%',
        endTrigger: lastBlockTitle,
        end: 'top 40%',
        pin: title,
        pinSpacing: false,
        onEnter: () => title.classList.add('title-pinned'),
        onLeave: () => title.classList.remove('title-pinned'),
        onEnterBack: () => title.classList.add('title-pinned'),
        onLeaveBack: () => title.classList.remove('title-pinned'),
      });
    }
  }, []);

  useEffect(() => {
    setupScrollTrigger();
    // Animaciones de bloques de texto
    const textBlocks = textBlocksRef.current.filter(Boolean);
    // Limpiar animaciones previas si existen
    textAnimationsRef.current.forEach(anim => {
      if (anim.scrollTrigger) anim.scrollTrigger.kill();
      anim.kill();
    });
    textAnimationsRef.current = [];
    textBlocks.forEach((block) => {
      const tween = gsap.fromTo(
        block,
        {
          y: window.innerWidth <= 768 ? 20 : 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          ease: 'power2.out',
          force3D: true,
          scrollTrigger: {
            trigger: block,
            start: 'top 80%',
            end: 'top center',
            scrub: 1.2,
          },
        }
      );
      textAnimationsRef.current.push(tween);
    });
    // Resize handler
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
      textAnimationsRef.current.forEach(anim => {
        if (anim.scrollTrigger) anim.scrollTrigger.kill();
        anim.kill();
      });
      textAnimationsRef.current = [];
    };
  }, [setupScrollTrigger]);

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
            {textBlocksData.map((block, _index) => (
              <div
                key={_index}
                className="text-block"
                ref={(el) => setTextBlockRef(el, _index)}
              >
                <h3 ref={_index === textBlocksData.length - 1 ? lastBlockTitleRef : null}>
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