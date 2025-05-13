import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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
    if (!sectionRef.current || !containerRef.current || !projectsRef.current || !lastCardRef.current) return;

    const container = containerRef.current;
    const projectsWrapper = projectsRef.current;
    const lastCard = lastCardRef.current;

    // Calculamos el ancho total del contenedor de proyectos
    const totalWidth = projectsWrapper.scrollWidth;
    const viewportWidth = window.innerWidth;
    const scrollDistance = totalWidth - viewportWidth + (viewportWidth * 0.5);

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
        markers: {
          startColor: "purple",
          endColor: "lime",
          fontSize: "16px",
          indent: 20
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const handleProjectClick = (projectId: number) => {
    setSelectedProject(projectId);
  };

  return (
    <section ref={sectionRef} className="projects-section">
      <LayoutGroup>
        <div ref={containerRef} className="projects-container">
          <div className="title-container">
            <h2 className="title">Proyectos</h2>
            <div className="vertical-line"></div>
          </div>
          
          <div ref={projectsRef} className="projects-wrapper">
            {projectsData.projects.map((project, index) => (
              <motion.div 
                key={project.id} 
                layoutId={`project-card-${project.id}`}
                className="project-card"
                ref={index === projectsData.projects.length - 1 ? lastCardRef : null}
                onClick={() => handleProjectClick(project.id)}
                style={{ 
                  cursor: 'pointer',
                  backgroundImage: `url(${project.image})`
                }}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1
                }}
                transition={{ 
                  layout: { type: "tween", duration: 0.2, ease: "easeInOut" }
                }}
              >
                <motion.div 
                  className="project-content"
                  layoutId={`project-content-${project.id}`}
                >
                  <motion.h3 layoutId={`project-title-${project.id}`}>{project.title}</motion.h3>
                  <motion.p layoutId={`project-description-${project.id}`}>{project.description}</motion.p>
                  <motion.div 
                    className="technologies"
                    layoutId={`project-technologies-${project.id}`}
                  >
                    {project.technologies.map((tech, index) => (
                      <motion.span 
                        key={index} 
                        className="tech-tag"
                        layout
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </motion.div>
                </motion.div>
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
      </LayoutGroup>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        layoutId={`project-card-${project.id}`}
        className="project-modal"
        onClick={e => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose} aria-label="Cerrar modal"></button>
        <div className="modal-content">
          <motion.div 
            className="project-image" 
            style={{ backgroundImage: `url(${project.image})` }}
            layoutId={`project-image-${project.id}`}
          />
          <div className="project-details">
            <motion.h2 layoutId={`project-title-${project.id}`}>{project.title}</motion.h2>
            <motion.p layoutId={`project-description-${project.id}`}>{project.description}</motion.p>
            <motion.div 
              className="technologies"
              layoutId={`project-technologies-${project.id}`}
            >
              {project.technologies.map((tech, index) => (
                <motion.span 
                  key={index} 
                  className="tech-tag"
                  layout
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.2 }}
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