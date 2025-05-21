import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useAnimation } from 'framer-motion';
// Importamos los iconos necesarios
import { 
  FaHtml5, FaCss3Alt, FaSass, FaJs, FaReact, FaNodeJs, FaPhp, 
  FaGitAlt, FaGithub, FaDocker, FaFigma, FaAws
} from 'react-icons/fa';
import { SiTypescript, SiTailwindcss, SiBootstrap, SiVite, SiWebpack, SiMysql, SiThreedotjs } from 'react-icons/si';
import '../styles/skills.scss';

gsap.registerPlugin(ScrollTrigger);

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
const skillsData = {
  frontend: [
    'HTML5',
    'CSS3',
    'Sass',
    'JavaScript',
    'TypeScript',
    'React',
    'Three.js',
    'Tailwind CSS',
    'Bootstrap'
  ],
  backend: [
    'Node.js',
    'PHP',
    'MySQL'
  ],
  tools: [
    'Git',
    'GitHub',
    'Docker',
    'Vite',
    'Webpack',
    'Figma',
    'AWS'
  ]
};

// Variantes de animación para framer-motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.1,
      staggerDirection: -1,
    }
  }
};

const categoryVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.15,
    }
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    }
  }
};

// Modificamos las variantes para entrada horizontal y salida inversa
const skillItemVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    x: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: -20,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const SkillsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [, setCategoriesVisible] = useState([false, false, false]);
  const categoryControls = useRef([useAnimation(), useAnimation(), useAnimation()]);
  const lastScrollY = useRef(0);

  // Función para resetear animaciones de una categoría
  const resetCategory = (index: number) => {
    // Resetear el estado de visibilidad
    setCategoriesVisible(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
    
    // Resetear manualmente la animación a estado inicial
    categoryControls.current[index].set("hidden");
  };

  const setCategoryRef = (el: HTMLDivElement | null, index: number) => {
    categoriesRef.current[index] = el;
  };

  useEffect(() => {
    if (!titleContainerRef.current || !titleRef.current || !contentContainerRef.current) return;

    const titleContainer = titleContainerRef.current;
    const title = titleRef.current;
    const categories = categoriesRef.current.filter(Boolean);

    // Función para detectar dirección de scroll
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Mantenemos la variable para referencia futura, pero no usamos la dirección por ahora
      // const isScrollingDown = scrollY > lastScrollY.current;
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Aplicar pin solo en pantallas grandes
    const mediaQuery = window.matchMedia('(min-width: 769px)');
    
    if (mediaQuery.matches) {
      ScrollTrigger.create({
        trigger: titleContainer,
        start: 'top 20%',
        endTrigger: categories[categories.length - 1],
        end: 'bottom 40%',
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

    // Configuramos ScrollTriggers para cada categoría
    categories.forEach((category, index) => {
      ScrollTrigger.create({
        trigger: category,
        start: 'top 85%', // Activar más temprano
        end: 'bottom 15%', // Detectar salida
        markers: false, // Quitar en producción
        onEnter: () => {
          // La categoría entra en el viewport
          setCategoriesVisible(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
          categoryControls.current[index].start("visible");
        },
        onLeave: () => {
          // La categoría sale por abajo
          categoryControls.current[index].start("exit");
        },
        onEnterBack: () => {
          // La categoría vuelve a entrar desde abajo
          setCategoriesVisible(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
          categoryControls.current[index].start("visible");
        },
        onLeaveBack: () => {
          // La categoría sale por arriba - REINICIAR COMPLETAMENTE
          resetCategory(index);
        }
      });
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Función para renderizar una categoría de habilidades
  const renderCategory = (title: string, skills: string[], index: number) => {
    return (
      <motion.div 
        className="category"
        ref={(el) => setCategoryRef(el, index)}
        initial="hidden"
        animate={categoryControls.current[index]}
        variants={categoryVariants}
      >
        <div className="category-header">
          <h3>{title}</h3>
          <div className="line"></div>
        </div>
        <motion.div 
          className="skills-grid"
          variants={containerVariants}
        >
          {skills.map((skill, skillIndex) => (
            <motion.div 
              key={`${title.toLowerCase()}-${skillIndex}`}
              className="skill-item"
              variants={skillItemVariants}
              whileHover={{ 
                scale: 1.05, 
                // El backgroundColor y borderColor se gestionarán ahora desde SCSS para el hover
                transition: { duration: 0.3 }
              }}
            >
              <div className="skill-icon">
                {skillIcons[skill as keyof typeof skillIcons]}
              </div>
              <div className="skill-name">{skill}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <section ref={sectionRef} className="skills-section">
      <div className="skills-layout">
        <div ref={titleContainerRef} className="title-wrapper">
          <div className="title-container" ref={titleRef}>
            <h2 className="title">Habili<span>dades</span></h2>
            <div className="vertical-line"></div>
            <p className="subtitle">Un conjunto de tecnologías y herramientas que domino para crear experiencias web excepcionales.</p>
          </div>
        </div>

        <div ref={contentContainerRef} className="content-wrapper">
          <div className="categories-container">
            {renderCategory("Frontend", skillsData.frontend, 0)}
            {renderCategory("Backend", skillsData.backend, 1)}
            {renderCategory("Herramientas", skillsData.tools, 2)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection; 