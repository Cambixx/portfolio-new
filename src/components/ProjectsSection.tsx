import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import projectsData from '../data/projects.json';
import '../styles/projects.scss';

gsap.registerPlugin(ScrollTrigger);

const ProjectsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const lastCardRef = useRef<HTMLDivElement>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  useEffect(() => {
    if (window.innerWidth < 768) return; // Solo aplica GSAP en desktop
    
    // Función para inicializar GSAP con retry
    const initGSAP = () => {
      if (!sectionRef.current || !containerRef.current || !projectsRef.current || !lastCardRef.current) {
        console.log('GSAP: Elementos no encontrados, reintentando...');
        setTimeout(initGSAP, 100);
        return;
      }

      const container = containerRef.current;
      const projectsWrapper = projectsRef.current;
      const lastCard = lastCardRef.current;

      // Asegurar que los elementos tengan dimensiones
      if (projectsWrapper.scrollWidth === 0) {
        console.log('GSAP: ScrollWidth es 0, reintentando...');
        setTimeout(initGSAP, 100);
        return;
      }

      // Calculamos el ancho total del contenedor de proyectos
      const totalWidth = projectsWrapper.scrollWidth;
      const viewportWidth = window.innerWidth;
      const scrollDistance = totalWidth - viewportWidth + (viewportWidth * 0.5);

      // Limpiar triggers existentes
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) {
          trigger.kill();
        }
      });

      // Creamos la animación de scroll horizontal
      gsap.to(projectsWrapper, {
        x: -scrollDistance,
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: container,
          endTrigger: lastCard,
          pin: true,
          start: "top top",
          end: "bottom top",
          scrub: 0.3,
          anticipatePin: 1,
          pinSpacing: true,
          fastScrollEnd: true,
          preventOverlaps: true,
          invalidateOnRefresh: true,
          onRefresh: () => {
            console.log('GSAP ScrollTrigger refreshed');
          }
        }
      });

      console.log('GSAP ProjectsSection initialized successfully');
    };

    // Delay inicial para asegurar que el DOM esté listo
    const timer = setTimeout(initGSAP, 200);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === containerRef.current) {
          trigger.kill();
        }
      });
    };
  }, []);

  const handleProjectClick = (projectId: number) => {
    setSelectedProject(projectId);
  };

  return (
    <section ref={sectionRef} className="projects-section">
      <div ref={containerRef} className="projects-container">
        <div className="title-container">
          <h2 className="title">Proyectos</h2>
          <div className="vertical-line"></div>
        </div>
        
        <div ref={projectsRef} className="projects-wrapper">
          {projectsData.projects.map((project, index) => (
            <motion.div 
              key={project.id} 
              className="project-card"
              ref={index === projectsData.projects.length - 1 ? lastCardRef : null}
              onClick={() => handleProjectClick(project.id)}
              style={{ 
                cursor: 'pointer',
                backgroundImage: `url(${project.image})`
              }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ 
                opacity: 1,
                y: 0
              }}
              transition={{ 
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              whileHover={{ 
                y: -8,
                transition: { 
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { 
                  duration: 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }
              }}
            >
              <div className="project-content">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="technologies">
                  {project.technologies.map((tech, index) => (
                    <span 
                      key={index} 
                      className="tech-tag"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <ProjectModal 
            project={projectsData.projects.find(p => p.id === selectedProject)!}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

interface ProjectModalProps {
  project: typeof projectsData.projects[0];
  onClose: () => void;
}

const ProjectModal = ({ project, onClose }: ProjectModalProps) => {
  return (
    <motion.div 
      className="project-modal-overlay"
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94],
        backdropFilter: { duration: 0.5 }
      }}
      onClick={onClose}
    >
      <motion.div 
        className="project-modal"
        initial={{ 
          opacity: 0, 
          scale: 0.85, 
          y: 60,
          rotateX: -12
        }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          rotateX: 0
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.92, 
          y: 40,
          rotateX: -8
        }}
        transition={{ 
          type: "spring",
          damping: 22,
          stiffness: 220,
          mass: 1,
          duration: 0.6
        }}
        onClick={e => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose} aria-label="Cerrar modal"></button>
        <div className="modal-content">
          <motion.div 
            className="project-image" 
            style={{ backgroundImage: `url(${project.image})` }}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.15, 
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          />
          <div className="project-details">
            <motion.h2 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.2, 
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              {project.title}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.3, 
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              {project.description}
            </motion.p>
            <motion.div 
              className="technologies"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.4, 
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              {project.technologies.map((tech, index) => (
                <motion.span 
                  key={index} 
                  className="tech-tag"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.5 + (index * 0.08), 
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  {tech}
                </motion.span>
              ))}
            </motion.div>
            {project.link && (
              <motion.a 
                href={project.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="project-link"
                initial={{ opacity: 0, y: 25, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 0.6, 
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                Ver proyecto
              </motion.a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectsSection;