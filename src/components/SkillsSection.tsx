import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
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

const SkillsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<(HTMLDivElement | null)[]>([]);

  const setCategoryRef = (el: HTMLDivElement | null, index: number) => {
    categoriesRef.current[index] = el;
  };

  useEffect(() => {
    if (!titleContainerRef.current || !titleRef.current || !contentContainerRef.current) return;

    const titleContainer = titleContainerRef.current;
    const title = titleRef.current;
    const categories = categoriesRef.current.filter(Boolean);

    // Aplicar pin solo en pantallas grandes
    const mediaQuery = window.matchMedia('(min-width: 769px)');
    
    if (mediaQuery.matches) {
      ScrollTrigger.create({
        trigger: titleContainer,
        start: 'top 20%',
        endTrigger: categories[categories.length - 1],
        end: 'bottom 40%',
        pin: titleContainer,
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

    // Animaciones para cada skill dentro de cada categoría
    categories.forEach((category) => {
      if (category) {  // Verificamos que category no sea null
        const skills = category.querySelectorAll('.skill-item');
        skills.forEach((skill, index) => {
          gsap.fromTo(skill,
            {
              x: 250
            },
            {
              x: 0,
              ease: "power2.out",
              scrollTrigger: {
                trigger: skill,
                start: "top 85%",
                end: "top 60%",
                scrub: 1,
                toggleActions: "play none none reverse"
              }
            }
          );
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Función para renderizar una categoría de habilidades
  const renderCategory = (title: string, skills: string[], index: number) => {
    return (
      <div 
        className="category"
        ref={(el) => setCategoryRef(el, index)}
      >
        <div className="category-header">
          <h3>{title}</h3>
          <div className="line"></div>
        </div>
        <div className="skills-grid">
          {skills.map((skill) => (
            <motion.div 
              key={skill}
              className="skill-item"
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
            >
              <div className="skill-icon">
                {skillIcons[skill as keyof typeof skillIcons]}
              </div>
              <div className="skill-name">{skill}</div>
            </motion.div>
          ))}
        </div>
      </div>
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