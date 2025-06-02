import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
// Importamos los iconos necesarios
import { 
  FaHtml5, FaCss3Alt, FaSass, FaJs, FaReact, FaNodeJs, FaPhp, 
  FaGitAlt, FaGithub, FaDocker, FaFigma, FaAws
} from 'react-icons/fa';
import { SiTypescript, SiTailwindcss, SiBootstrap, SiVite, SiWebpack, SiMysql, SiThreedotjs } from 'react-icons/si';
import '../styles/skills.scss';

// Tipos TypeScript
interface SkillCategory {
  name: string;
  skills: string[];
}

// Objeto que mapea cada skill con su icono correspondiente
const skillIcons = {
  'HTML5': <FaHtml5 />,
  'CSS3': <FaCss3Alt />,
  'Sass': <FaSass />,
  'JavaScript': <FaJs />,
  'TypeScript': <SiTypescript />,
  'React': <FaReact />,
  'Three.js': <SiThreedotjs />,
  'Tailwind CSS': <SiTailwindcss />,
  'Bootstrap': <SiBootstrap />,
  'Node.js': <FaNodeJs />,
  'PHP': <FaPhp />,
  'MySQL': <SiMysql />,
  'Git': <FaGitAlt />,
  'GitHub': <FaGithub />,
  'Docker': <FaDocker />,
  'Vite': <SiVite />,
  'Webpack': <SiWebpack />,
  'Figma': <FaFigma />,
  'AWS': <FaAws />
};

// Datos de habilidades divididos por categorías
const skillsData: SkillCategory[] = [
  {
    name: 'Frontend',
    skills: ['HTML5', 'CSS3', 'Sass', 'JavaScript', 'TypeScript', 'React', 'Three.js', 'Tailwind CSS', 'Bootstrap']
  },
  {
    name: 'Backend',
    skills: ['Node.js', 'PHP', 'MySQL']
  },
  {
    name: 'Herramientas',
    skills: ['Git', 'GitHub', 'Docker', 'Vite', 'Webpack', 'Figma', 'AWS']
  }
];

function SkillsSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Detectar si es dispositivo móvil
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer para móvil
  useEffect(() => {
    if (!isMobile || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setActiveIndex(index);
          }
        });
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px', // Solo activa cuando está en el centro
        threshold: 0
      }
    );

    // Observar todos los items del menú
    const menuItems = sectionRef.current.querySelectorAll('.skills-menu__item');
    menuItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [isMobile]);

  return (
    <section ref={sectionRef} className="skills-section">
      <div className="skills-container">
        <div className="title-container">
          <h2 className="title">Habilidades</h2>
          <div className="vertical-line"></div>
        </div>
        
        <div className="skills-wrap">
          <nav className="skills-menu">
            {skillsData.map((category, idx) => (
              <SkillCategoryComponent 
                key={idx} 
                {...category} 
                index={idx}
                isMobile={isMobile}
                isActive={isMobile ? activeIndex === idx : false}
              />
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}

interface SkillCategoryProps extends SkillCategory {
  index: number;
  isMobile: boolean;
  isActive: boolean;
}

function SkillCategoryComponent({ name, skills, index, isMobile, isActive }: SkillCategoryProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const [manualActive, setManualActive] = useState(false);

  const animationDefaults = { duration: 0.6, ease: 'expo' };

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number): string => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
  };

  const distMetric = (x: number, y: number, x2: number, y2: number): number => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  };

  const showMarquee = (edge = 'bottom') => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;

    gsap.timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0);
  };

  const hideMarquee = (edge = 'bottom') => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;

    gsap.timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0)
      .to(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0);
  };

  // Efecto para mostrar/ocultar marquee basado en isActive (solo móvil)
  useEffect(() => {
    if (!isMobile) return;

    if (isActive) {
      showMarquee();
    } else {
      hideMarquee();
    }
  }, [isActive, isMobile]);

  const handleMouseEnter = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    showMarquee(edge);
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    hideMarquee(edge);
  };

  const handleTouchStart = () => {
    if (!isMobile) return;
    
    // En móvil, toggle manual solo si no está activo por scroll
    if (!isActive) {
      setManualActive(!manualActive);
      if (!manualActive) {
        showMarquee();
      } else {
        hideMarquee();
      }
    }
  };

  const repeatedMarqueeContent = Array.from({ length: isMobile ? 2 : 3 }).map((_, idx) => (
    <React.Fragment key={idx}>
      {skills.map((skill, skillIdx) => (
        <div key={`${idx}-${skillIdx}`} className="marquee__skill">
          <div className="skill-icon">
            {skillIcons[skill as keyof typeof skillIcons]}
          </div>
          <span className="skill-name">{skill}</span>
        </div>
      ))}
    </React.Fragment>
  ));

  const finalIsActive = isMobile ? isActive || manualActive : false;

  return (
    <div 
      className={`skills-menu__item ${isMobile ? 'mobile' : ''} ${finalIsActive ? 'active' : ''}`} 
      ref={itemRef}
      data-index={index}
    >
      <div
        className="skills-menu__item-link"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onClick={handleTouchStart}
      >
        {name}
        {isMobile && !isActive && <span className="mobile-indicator">{manualActive ? '−' : '+'}</span>}
        {isMobile && isActive && <span className="active-indicator">•</span>}
      </div>
      <div className="marquee" ref={marqueeRef}>
        <div className="marquee__inner-wrap" ref={marqueeInnerRef}>
          <div className="marquee__inner" aria-hidden="true">
            {repeatedMarqueeContent}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillsSection; 